// Paper upload form with smart defaults and manual override
// Uses usePastPaperSubmission to create real database records and trigger grading

import { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { sanitiseErrorMessage } from '@/shared/lib/sanitise-error'
import { usePastPaperSubmission } from '../hooks/use-past-paper-submission'
import { triggerConfetti } from '@/shared/lib/confetti'
import { SelfCalibrationModal } from './SelfCalibrationModal'
import { useFeatureFlag } from '@/shared/hooks'
import { useStudentSubjects, ALL_SUBJECTS, type Subject } from '@/features/dashboard'
import { useAuth } from '@/features/auth'
import { useIsDemo } from '@/shared/hooks/use-is-demo'

interface PaperUploadFormProps {
  onSubmit?: (
    file: File,
    metadata: { subject: string; year: string; type: string }
  ) => Promise<void>
}

const MAX_FILE_SIZE_MB = 15

// Available year levels (7-12)
const YEAR_LEVELS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'] as const

// Default paper type (dropdown removed — students don't need to pick this)
const DEFAULT_TYPE = 'HSC' as const

/**
 * Parse student's year_level from database to dropdown value
 * Database stores: "9-10", "11", "12", etc.
 * Returns: "Year 10", "Year 11", "Year 12", etc.
 */
function parseYearLevel(yearLevel: string | null): string {
  if (!yearLevel) return 'Year 12' // Default to Year 12 if unknown

  // If already has "Year" prefix, return as-is
  if (yearLevel.startsWith('Year ')) return yearLevel

  // Handle ranges like "9-10" - take the higher value
  if (yearLevel.includes('-')) {
    const parts = yearLevel.split('-')
    const higher = Math.max(...parts.map((p) => parseInt(p.trim(), 10)))
    return `Year ${higher}`
  }

  // Handle plain numbers like "11", "12"
  const num = parseInt(yearLevel.trim(), 10)
  if (!isNaN(num) && num >= 7 && num <= 12) {
    return `Year ${num}`
  }

  // Fallback to Year 12
  return 'Year 12'
}

export function PaperUploadForm({ onSubmit }: PaperUploadFormProps) {
  const isDemo = useIsDemo()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [includeWorksheet, setIncludeWorksheet] = useState(true)
  const [studentNote, setStudentNote] = useState('')

  // Self-calibration modal state
  const [showCalibration, setShowCalibration] = useState(false)
  const { enabled: calibrationEnabled } = useFeatureFlag('feature_self_calibration')

  const pastPaperMutation = usePastPaperSubmission()

  // Get student info for year level default
  const { student } = useAuth()

  // Get student's enrolled subjects for smart defaults
  const { enrolled: enrolledSubjects, isLoading: subjectsLoading } = useStudentSubjects()

  // Smart defaults: first enrolled subject, student's year level, HSC
  const defaultSubject = enrolledSubjects[0] || ALL_SUBJECTS[0]
  const defaultYearLevel = parseYearLevel(student?.year_level ?? null)

  // Form values (smart defaults pre-selected, user can change)
  const [subject, setSubject] = useState<string>(defaultSubject)
  const [yearLevel, setYearLevel] = useState<string>(defaultYearLevel)
  const type = DEFAULT_TYPE

  // Update defaults when enrolled subjects or student info loads
  useEffect(() => {
    if (!subjectsLoading && enrolledSubjects.length > 0) {
      const firstEnrolled = enrolledSubjects[0]
      // Only update if current subject is not in enrolled subjects
      if (firstEnrolled && !enrolledSubjects.includes(subject as Subject)) {
        setSubject(firstEnrolled)
      }
    }
  }, [enrolledSubjects, subjectsLoading, subject])

  // Update year level when student info becomes available
  useEffect(() => {
    if (student?.year_level) {
      setYearLevel(parseYearLevel(student.year_level))
    }
  }, [student?.year_level])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(
        `File too large (max ${MAX_FILE_SIZE_MB} MB). Try re-scanning at a lower resolution.`
      )
      return
    }

    setFile(selectedFile)
    setError(null)
  }, [])

  const processQuestionPaper = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Exam paper must be a PDF')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Exam paper too large (max ${MAX_FILE_SIZE_MB} MB).`)
      return
    }

    setQuestionPaperFile(selectedFile)
    setError(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (isDemo) return

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) processFile(droppedFile)
    },
    [processFile, isDemo]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) processFile(selectedFile)
    },
    [processFile]
  )

  // Called when user clicks Submit button
  const handleSubmitClick = () => {
    if (!file || !questionPaperFile) return

    if (calibrationEnabled) {
      // Show calibration modal first
      setShowCalibration(true)
    } else {
      // Direct submit without calibration
      handleSubmitWithPrediction()
    }
  }

  // Submit with optional prediction data
  const handleSubmitWithPrediction = async (prediction?: { score?: number; band?: number }) => {
    if (!file || !questionPaperFile) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Use past paper submission mutation - creates record and triggers grading
      // Only include prediction fields if they have values (exactOptionalPropertyTypes)
      await pastPaperMutation.mutateAsync({
        files: [file],
        subject,
        examYear: new Date().getFullYear(),
        paperType: type,
        ...(!includeWorksheet && { skipWorksheet: true }),
        ...(prediction?.score !== undefined && { predictedScore: prediction.score }),
        ...(prediction?.band !== undefined && { predictedBand: prediction.band }),
        ...(studentNote.trim() && { studentNote: studentNote.trim() }),
        questionPaperFile,
      })

      // Success!
      triggerConfetti()
      setUploadSuccess(true)

      // Call optional callback if provided
      if (onSubmit) {
        await onSubmit(file, { subject, year: yearLevel, type })
      }

      // Reset form after brief success display
      setTimeout(() => {
        setUploadSuccess(false)
        setFile(null)
        setQuestionPaperFile(null)
        setSubject(defaultSubject)
        setYearLevel(defaultYearLevel)
        setIncludeWorksheet(true)
        setStudentNote('')
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error
          ? sanitiseErrorMessage(err.message, 'Upload failed. Please try again.')
          : 'Upload failed. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Called when user submits prediction from modal
  const handleCalibrationSubmit = (prediction: { score?: number; band?: number }) => {
    handleSubmitWithPrediction(prediction)
  }

  // Called when user skips prediction in modal
  const handleCalibrationSkip = () => {
    handleSubmitWithPrediction()
  }

  const handleReset = () => {
    setFile(null)
    setQuestionPaperFile(null)
    setSubject(defaultSubject)
    setYearLevel(defaultYearLevel)
    setIncludeWorksheet(true)
    setStudentNote('')
    setError(null)
  }

  if (isDemo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border-2 border-dashed border-g-200 p-8 text-center opacity-60 dark:border-g-300">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-g-100 dark:bg-g-100">
                <Upload className="h-6 w-6 text-g-400" />
              </div>
              <p className="mt-3 font-medium text-g-500 dark:text-g-600">
                Upload disabled in demo mode
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Exam paper upload — required */}
        <div className="mb-4">
          <label
            htmlFor="past-paper-question-pdf"
            className="mb-1.5 block text-sm font-medium text-g-700 dark:text-g-600"
          >
            Exam paper PDF
          </label>
          {questionPaperFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-g-200 bg-g-50 p-3 dark:border-g-300 dark:bg-g-100/50">
              <FileText className="h-5 w-5 shrink-0 text-p-600 dark:text-p-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-g-900 dark:text-white">
                  {questionPaperFile.name}
                </p>
                <p className="text-xs text-g-500 dark:text-g-600">
                  {(questionPaperFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuestionPaperFile(null)}
                className="text-sm text-g-500 hover:text-g-700 dark:text-g-600 dark:hover:text-g-400"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-g-300 p-3 transition-colors hover:border-p-400 hover:bg-g-50 dark:border-g-300 dark:hover:border-p-600 dark:hover:bg-g-100/30">
              <Upload className="h-5 w-5 shrink-0 text-g-400" />
              <p className="text-sm text-g-700 dark:text-g-600">
                Upload the printed exam questions (PDF)
              </p>
              <input
                id="past-paper-question-pdf"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) processQuestionPaper(f)
                }}
                className="hidden"
                aria-label="Upload exam paper PDF"
              />
            </label>
          )}
        </div>

        {/* Drop zone — scanned working */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragging
              ? 'border-p-500 bg-p-50 dark:bg-p-700/20'
              : file
                ? 'border-p-300 bg-p-50/50 dark:border-p-700 dark:bg-p-700/10'
                : 'border-g-300 hover:border-p-400 dark:border-g-300 dark:hover:border-p-600'
          )}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload your scanned working PDF"
          />

          {file ? (
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-p-100 dark:bg-p-700/50">
                <FileText className="h-6 w-6 text-p-600 dark:text-p-400" />
              </div>
              <p className="mt-3 font-medium text-g-900 dark:text-white">{file.name}</p>
              <p className="mt-1 text-sm text-g-500 dark:text-g-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-sm text-p-600 hover:text-p-700 dark:text-p-400 dark:hover:text-p-300"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-g-100 dark:bg-g-100">
                <Upload className="h-6 w-6 text-g-500 dark:text-g-600" />
              </div>
              <p className="mt-3 font-medium text-g-900 dark:text-white">
                Drop your scanned working here
              </p>
              <p className="mt-1 text-sm text-g-500 dark:text-g-600">or click to browse</p>
              <p className="mt-3 text-xs text-g-400 dark:text-g-500">
                PDF only, 15 MB max. Use CamScanner or similar to scan your paper.
              </p>
            </div>
          )}
        </div>

        {/* Metadata form - user selects paper details */}
        {file && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="past-paper-subject"
                className="mb-1.5 block text-sm font-medium text-g-700 dark:text-g-600"
              >
                Subject
              </label>
              <select
                id="past-paper-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-g-300 bg-white px-3 py-2 text-sm text-g-900 focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500 dark:border-g-300 dark:bg-g-100 dark:text-white"
              >
                {enrolledSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="past-paper-year-level"
                className="mb-1.5 block text-sm font-medium text-g-700 dark:text-g-600"
              >
                Year Level
              </label>
              <select
                id="past-paper-year-level"
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full rounded-lg border border-g-300 bg-white px-3 py-2 text-sm text-g-900 focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500 dark:border-g-300 dark:bg-g-100 dark:text-white"
              >
                {YEAR_LEVELS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Worksheet checkbox */}
        {file && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-g-200 p-3 transition-colors hover:bg-g-50 dark:border-g-300 dark:hover:bg-g-100/50">
            <input
              type="checkbox"
              checked={includeWorksheet}
              onChange={(e) => setIncludeWorksheet(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-g-300 text-p-600 focus:ring-p-500"
            />
            <div>
              <span className="text-sm font-medium text-g-900 dark:text-white">
                Include practice worksheet
              </span>
              <p className="text-xs text-g-500 dark:text-g-600">
                Extra practice questions based on your weak areas
              </p>
            </div>
          </label>
        )}

        {/* Student note for marker */}
        {file && (
          <div className="mt-4">
            <label
              htmlFor="past-paper-student-note"
              className="mb-1.5 block text-sm font-medium text-g-700 dark:text-g-600"
            >
              Notes for marker <span className="font-normal text-g-400">(optional)</span>
            </label>
            <textarea
              id="past-paper-student-note"
              rows={2}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="e.g. Q3 was invalid on my paper, I skipped Q7"
              className="w-full resize-none rounded-lg border border-g-300 bg-white px-3 py-2 text-sm text-g-900 placeholder:text-g-400 focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500 dark:border-g-300 dark:bg-g-100 dark:text-white dark:placeholder:text-g-500"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-err-bg p-3 text-sm text-err-text">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Success message */}
        {uploadSuccess && (
          <div className="mt-4 rounded-lg bg-ok-bg p-4 text-center">
            <p className="font-medium text-ok-text">Sent to our marking team!</p>
            <p className="mt-1 text-sm text-ok-text/80">You'll receive feedback within 24 hours.</p>
          </div>
        )}

        {/* Submit button */}
        {file && !uploadSuccess && (
          <Button
            onClick={handleSubmitClick}
            disabled={isSubmitting || isDemo || !questionPaperFile}
            title={isDemo ? 'Disabled in demo mode' : undefined}
            className="mt-6 w-full"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              'Submit for marking'
            )}
          </Button>
        )}
        {file && !uploadSuccess && (
          <p className="mt-2 text-center text-xs text-g-400">
            Submissions cannot be withdrawn once sent.
          </p>
        )}

        {/* Self-calibration modal */}
        <SelfCalibrationModal
          open={showCalibration}
          onOpenChange={setShowCalibration}
          maxScore={100}
          onSubmit={handleCalibrationSubmit}
          onSkip={handleCalibrationSkip}
        />
      </CardContent>
    </Card>
  )
}

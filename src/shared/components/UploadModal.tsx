import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { cn } from '../lib/cn'
import { triggerConfetti } from '../lib/confetti'
import { validatePdfPageCount, validateAggregateSize } from '../lib/pdf-validation'

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

export interface UploadModalContext {
  /** The subject name (e.g., "Mathematics") */
  subject: string
  /** The assignment name (e.g., "Homework #6") */
  assignmentName: string
}

export interface UploadModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Modal title */
  title?: string
  /** Modal description */
  description?: string
  /** Context for the upload (subject and assignment info) */
  context: UploadModalContext
  /** Callback when files are uploaded - receives array of Files */
  onUpload: (files: File[]) => Promise<void>
  /** Maximum file size in bytes per file (default: 20MB) */
  maxFileSize?: number
  /** Maximum number of files (default: 20) */
  maxFiles?: number
  /** Maximum total upload size in bytes (default: 20MB) */
  maxTotalSize?: number
  /** Maximum page count per PDF (default: 30 for homework) */
  maxPageCount?: number
}

const MAX_FILE_SIZE_DEFAULT = 20 * 1024 * 1024 // 20MB
const MAX_FILES_DEFAULT = 20 //
const MAX_TOTAL_SIZE_DEFAULT = 20 * 1024 * 1024 // 20MB total

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Upload modal with drag-drop functionality for assignment submissions.
 *
 * Features:
 * - Drag-and-drop zone for PDF uploads
 * - Multi-file selection (up to 20 files)
 * - PDF-only validation with error messages
 * - Context display showing subject and assignment
 * - Upload states: idle, dragging, uploading, success, error
 * 
 * - Confetti celebration on successful upload
 * - Mobile camera capture via HTML5 attribute
 * - Auto-close after successful upload
 *
 * @example
 * <UploadModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   context={{ subject: "Mathematics", assignmentName: "Homework #6" }}
 *   onUpload={async (files) => { await uploadToServer(files) }}
 * />
 */
export function UploadModal({
  open,
  onOpenChange,
  title = 'Submit your work',
  description,
  context,
  onUpload,
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
  maxFiles = MAX_FILES_DEFAULT,
  maxTotalSize = MAX_TOTAL_SIZE_DEFAULT,
  maxPageCount = 30,
}: UploadModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Small delay to allow close animation
      const timer = setTimeout(() => {
        setUploadState('idle')
        setErrorMessage(null)
        setSelectedFiles([])
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Auto-close after success with confetti
  useEffect(() => {
    if (uploadState === 'success') {
      // Trigger confetti celebration
      triggerConfetti()

      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [uploadState, onOpenChange])

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (file.type !== 'application/pdf') {
        return `"${file.name}" is not a PDF. Only PDF files are accepted.`
      }

      // Check file size
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
        return `"${file.name}" is too large. Maximum size per file is ${maxSizeMB}MB.`
      }

      return null
    },
    [maxFileSize]
  )

  const validateFiles = useCallback(
    (files: File[], existingFiles: File[]): string | null => {
      // Check total file count
      const totalCount = existingFiles.length + files.length
      if (totalCount > maxFiles) {
        return `Too many files. Maximum is ${maxFiles} files.`
      }

      // Calculate total size including existing files
      const existingSize = existingFiles.reduce((sum, f) => sum + f.size, 0)
      const newSize = files.reduce((sum, f) => sum + f.size, 0)
      const totalSize = existingSize + newSize

      if (totalSize > maxTotalSize) {
        const maxTotalMB = Math.round(maxTotalSize / (1024 * 1024))
        return `Total upload size exceeds ${maxTotalMB}MB limit.`
      }

      // Validate each file individually
      for (const file of files) {
        const fileError = validateFile(file)
        if (fileError) return fileError
      }

      return null
    },
    [maxFiles, maxTotalSize, validateFile]
  )

  const addFiles = useCallback(
    async (files: File[]) => {
      // Filter out duplicates (same name and size)
      const newFiles = files.filter(
        (newFile) =>
          !selectedFiles.some(
            (existing) => existing.name === newFile.name && existing.size === newFile.size
          )
      )

      if (newFiles.length === 0) {
        setErrorMessage('These files are already selected.')
        setUploadState('error')
        return
      }

      const validationError = validateFiles(newFiles, selectedFiles)
      if (validationError) {
        setErrorMessage(validationError)
        setUploadState('error')
        return
      }

      // Check aggregate size
      const allFiles = [...selectedFiles, ...newFiles]
      const aggError = validateAggregateSize(allFiles, maxTotalSize)
      if (aggError) {
        setErrorMessage(aggError)
        setUploadState('error')
        return
      }

      // Validate page count for each new PDF
      for (const file of newFiles) {
        if (file.type === 'application/pdf') {
          const result = await validatePdfPageCount(file, maxPageCount)
          if (!result.valid) {
            setErrorMessage(result.error!)
            setUploadState('error')
            return
          }
        }
      }

      setSelectedFiles((prev) => [...prev, ...newFiles])
      setErrorMessage(null)
      setUploadState('idle')
    },
    [selectedFiles, validateFiles, maxTotalSize, maxPageCount]
  )

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setErrorMessage(null)
    setUploadState('idle')
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least one file.')
      setUploadState('error')
      return
    }

    setErrorMessage(null)
    setUploadState('uploading')

    try {
      await onUpload(selectedFiles)
      setUploadState('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setUploadState('error')
    }
  }, [selectedFiles, onUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUploadState('dragging')
    setErrorMessage(null)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to idle if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setUploadState('idle')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setUploadState('idle')

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles)
      }
    },
    [addFiles]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        addFiles(Array.from(files))
      }
      // Reset input so same file can be selected again
      e.target.value = ''
    },
    [addFiles]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  // Calculate total size of selected files
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)

  const renderContent = () => {
    // Success state
    if (uploadState === 'success') {
      return (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-bg dark:bg-ok/20">
            <CheckCircle className="h-8 w-8 text-ok" />
          </div>
          <p className="text-lg font-medium text-foreground">Submitted!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sent to our marking team. You&apos;ll receive feedback within 24 hours.
          </p>
        </div>
      )
    }

    // Uploading state
    if (uploadState === 'uploading') {
      return (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-p-100 dark:bg-p-500/20">
            <Loader2 className="h-8 w-8 animate-spin text-p-500" />
          </div>
          <p className="text-lg font-medium text-foreground">
            Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}...
          </p>
          <div className="mt-3 space-y-1">
            {selectedFiles.map((file, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {file.name}
              </p>
            ))}
          </div>
        </div>
      )
    }

    // Idle/dragging/error state - show drop zone and file list
    return (
      <>
        {/* Context box - shows subject and assignment */}
        <div className="mb-4 rounded-lg bg-p-100 p-3 dark:bg-p-500/20">
          <p className="text-sm font-medium text-p-700 dark:text-p-300">{context.subject}</p>
          <p className="text-base font-semibold text-p-600 dark:text-p-200">
            {context.assignmentName}
          </p>
        </div>

        {/* File list when files are selected */}
        {selectedFiles.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg border border-g-200 dark:border-g-300">
            <div className="border-b border-g-200 bg-g-50 px-4 py-2.5 dark:border-g-300 dark:bg-g-100/50">
              <p className="text-sm font-medium text-foreground">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                <span className="ml-2 text-muted-foreground">({formatFileSize(totalSize)})</span>
              </p>
            </div>
            <ul className="max-h-48 divide-y divide-g-100 overflow-y-auto dark:divide-g-300">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <FileText className="h-5 w-5 flex-shrink-0 text-p-500" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 rounded-full p-1.5 text-g-400 transition-colors hover:bg-g-100 hover:text-g-600 dark:text-g-500 dark:hover:bg-g-200 dark:hover:text-g-300"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all',
            uploadState === 'dragging'
              ? 'border-p-500 bg-p-50 dark:bg-p-500/10'
              : 'border-g-300 bg-g-50 hover:border-p-400 hover:bg-p-50 dark:border-g-600 dark:bg-g-100/50 dark:hover:border-p-500 dark:hover:bg-p-500/10',
            uploadState === 'error' && 'border-err bg-err-bg dark:bg-err/10'
          )}
          onClick={handleBrowseClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleBrowseClick()
            }
          }}
          aria-label="Drop zone for PDF upload"
        >
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple={maxFiles > 1}
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
          />
          {/* Camera capture input for mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept=".pdf,application/pdf"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
          />

          <div className="text-center">
            <div
              className={cn(
                'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-transform',
                uploadState === 'dragging'
                  ? 'scale-110 bg-p-200 dark:bg-p-500/30'
                  : 'bg-p-100 dark:bg-p-500/20',
                uploadState === 'error' && 'bg-err-bg dark:bg-err/20'
              )}
            >
              {uploadState === 'error' ? (
                <AlertCircle className="h-7 w-7 text-err" />
              ) : selectedFiles.length > 0 ? (
                <Plus className="h-7 w-7 text-p-500" />
              ) : (
                <Upload
                  className={cn(
                    'h-7 w-7 transition-transform',
                    uploadState === 'dragging' ? 'text-p-600' : 'text-p-500'
                  )}
                />
              )}
            </div>

            <p className="mb-1 text-base font-medium text-foreground">
              {uploadState === 'dragging'
                ? maxFiles === 1
                  ? 'Drop your file here'
                  : 'Drop your files here'
                : selectedFiles.length > 0
                  ? maxFiles === 1
                    ? 'Replace file'
                    : 'Add more files'
                  : maxFiles === 1
                    ? 'Drop your PDF here'
                    : 'Drop your PDFs here'}
            </p>
            <p className="text-sm text-muted-foreground">or click to browse</p>

            {/* Error message */}
            {uploadState === 'error' && errorMessage && (
              <p className="mt-4 text-sm font-medium text-err">{errorMessage}</p>
            )}

            {/* File hint */}
            {uploadState !== 'error' && (
              <p className="mt-4 text-xs text-g-400 dark:text-g-500">
                PDF format only - Max 20 MB{maxFiles > 1 ? ` - Up to ${maxFiles} files` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={handleBrowseClick} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Browse files
          </Button>

          {/* Camera button - visible on all devices, only works on mobile with camera */}
          <Button
            onClick={handleCameraClick}
            variant="outline"
            className="gap-2"
            aria-label="Take photo with camera"
          >
            <Upload className="h-4 w-4" />
            Camera
          </Button>

          {/* Upload button when files are selected */}
          {selectedFiles.length > 0 && (
            <Button onClick={handleUpload} className="gap-2">
              <Upload className="h-4 w-4" />
              {`Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}`}
            </Button>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Submissions cannot be withdrawn once sent.
          </p>
        )}
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

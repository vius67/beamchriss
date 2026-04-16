// Self-calibration modal for past paper prediction
// Y12 students: HSC Band selection (1-6)
// Y7-11 students: Raw score prediction

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Target, SkipForward } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { cn } from '@/shared/lib/cn'

interface SelfCalibrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  maxScore: number // e.g., 100 for percentage, or actual max marks
  onSubmit: (prediction: { score?: number; band?: number }) => void
  onSkip: () => void
}

const HSC_BANDS = [
  { value: 6, label: 'Band 6', range: '90-100%', color: 'bg-green-500' },
  { value: 5, label: 'Band 5', range: '80-89%', color: 'bg-blue-500' },
  { value: 4, label: 'Band 4', range: '70-79%', color: 'bg-yellow-500' },
  { value: 3, label: 'Band 3', range: '60-69%', color: 'bg-orange-500' },
  { value: 2, label: 'Band 2', range: '50-59%', color: 'bg-red-400' },
  { value: 1, label: 'Band 1', range: '0-49%', color: 'bg-red-600' },
]

export function SelfCalibrationModal({
  open,
  onOpenChange,
  maxScore,
  onSubmit,
  onSkip,
}: SelfCalibrationModalProps) {
  const { student } = useAuth()
  const [selectedBand, setSelectedBand] = useState<number | null>(null)
  const [predictedScore, setPredictedScore] = useState<string>('')

  // Determine if Y12 (use bands) or Y7-11 (use scores)
  // year_level is TEXT like "12", "11", "9-10"
  const isYear12 = student?.year_level === '12'

  const handleSubmit = () => {
    if (isYear12 && selectedBand) {
      onSubmit({ band: selectedBand })
    } else if (!isYear12 && predictedScore) {
      const score = parseInt(predictedScore, 10)
      if (!isNaN(score) && score >= 0 && score <= maxScore) {
        onSubmit({ score })
      }
    }
    // Reset state and close
    setSelectedBand(null)
    setPredictedScore('')
    onOpenChange(false)
  }

  const handleSkip = () => {
    // Reset state and close
    setSelectedBand(null)
    setPredictedScore('')
    onSkip()
    onOpenChange(false)
  }

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedBand(null)
      setPredictedScore('')
    }
    onOpenChange(newOpen)
  }

  const isValid = isYear12
    ? !!selectedBand
    : !!predictedScore && !isNaN(parseInt(predictedScore, 10))

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-p-500" />
            Predict Your Result
          </DialogTitle>
          <DialogDescription>
            {isYear12
              ? 'What HSC band do you think you achieved on this paper?'
              : 'What mark do you think you got on this paper?'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isYear12 ? (
            // Band selector for Y12
            <div className="grid grid-cols-2 gap-3">
              {HSC_BANDS.map((band) => (
                <button
                  key={band.value}
                  onClick={() => setSelectedBand(band.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-3 transition-colors',
                    selectedBand === band.value
                      ? 'border-p-500 bg-p-50 dark:bg-p-700/30'
                      : 'border-g-200 hover:border-g-300 dark:border-g-300 dark:hover:border-g-600'
                  )}
                >
                  <div className={cn('h-4 w-4 rounded-full', band.color)} />
                  <div className="text-left">
                    <p className="font-medium text-g-900 dark:text-white">{band.label}</p>
                    <p className="text-xs text-g-500 dark:text-g-600">{band.range}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Score input for Y7-11
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="self-calibration-predicted-score"
                  className="mb-2 block text-sm font-medium text-g-700 dark:text-g-600"
                >
                  Your predicted mark (out of {maxScore})
                </label>
                <input
                  id="self-calibration-predicted-score"
                  type="number"
                  min="0"
                  max={maxScore}
                  value={predictedScore}
                  onChange={(e) => setPredictedScore(e.target.value)}
                  placeholder={`0-${maxScore}`}
                  className="w-full rounded-lg border border-g-300 bg-white px-4 py-3 text-center text-2xl font-semibold text-g-900 focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500 dark:border-g-300 dark:bg-g-100 dark:text-white"
                />
              </div>
              {predictedScore && !isNaN(parseInt(predictedScore, 10)) && (
                <p className="text-center text-sm text-g-500 dark:text-g-600">
                  {Math.round((parseInt(predictedScore, 10) / maxScore) * 100)}% predicted
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-g-400 dark:text-g-500">
          This helps you track your prediction accuracy over time
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
            <SkipForward className="mr-2 h-4 w-4" />
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="w-full sm:w-auto">
            Submit Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

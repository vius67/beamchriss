// Calibration result display showing prediction accuracy after grading
// Shows whether student predicted higher, lower, or accurately

import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface CalibrationResultProps {
  predicted: number // Raw score or band
  actual: number // Raw score or band
  isBand?: boolean // True if using band scale (Y12)
  maxScore?: number // For percentage calculation (Y7-11)
}

export function CalibrationResult({
  predicted,
  actual,
  isBand = false,
  maxScore = 100,
}: CalibrationResultProps) {
  const difference = actual - predicted
  const percentDiff = isBand ? difference : Math.round((difference / maxScore) * 100)

  // For bands: exact match = accurate
  // For scores: within 5% = accurate
  const isAccurate = isBand ? difference === 0 : Math.abs(percentDiff) <= 5
  const isUnder = difference > 0 // Predicted lower than actual (good news!)
  const isOver = difference < 0 // Predicted higher than actual

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        isAccurate ? 'bg-green-50 dark:bg-green-900/20' : 'bg-g-50 dark:bg-g-100/50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-p-500" />
          <span className="font-medium text-g-700 dark:text-g-600">Your Prediction</span>
        </div>
        {isAccurate ? (
          <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
            <Minus className="h-4 w-4" />
            Spot on!
          </span>
        ) : isUnder ? (
          <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" />
            {isBand
              ? `${difference} band${difference !== 1 ? 's' : ''} better!`
              : `${Math.abs(percentDiff)}% better!`}
          </span>
        ) : isOver ? (
          <span className="flex items-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400">
            <TrendingDown className="h-4 w-4" />
            {isBand
              ? `${Math.abs(difference)} band${Math.abs(difference) !== 1 ? 's' : ''} off`
              : `${Math.abs(percentDiff)}% off`}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-g-600">
            {isBand ? `Band ${predicted}` : predicted}
          </p>
          <p className="text-xs text-g-500 dark:text-g-600">Predicted</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-p-600 dark:text-p-400">
            {isBand ? `Band ${actual}` : actual}
          </p>
          <p className="text-xs text-g-500 dark:text-g-600">Actual</p>
        </div>
      </div>
    </div>
  )
}

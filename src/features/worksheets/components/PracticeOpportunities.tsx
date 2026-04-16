import { Target, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { useWeaknessDetection, type WeaknessOpportunity } from '../hooks'
import { cn } from '@/shared/lib/cn'

interface PracticeOpportunitiesProps {
  onRequestPractice: (skill: WeaknessOpportunity) => void
  className?: string
}

/**
 * Passive worksheet suggestion card
 *
 * 
 * - Shows "Extra practice" (asset-framed)
 * - Passive display, NOT push notification
 * - Student can click to request practice for any topic
 *
 *  
 * - "Request" implies human fulfillment
 * - Never "Generate" or instant language
 */
export function PracticeOpportunities({
  onRequestPractice,
  className,
}: PracticeOpportunitiesProps) {
  const { weaknesses, hasPracticeOpportunities, isLoading } = useWeaknessDetection()

  // Don't show if no weaknesses or loading
  if (!hasPracticeOpportunities || isLoading) {
    return null
  }

  return (
    <Card className={cn('border-l-4 border-l-p-500', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-p-500" />
          Extra Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-g-600 dark:text-g-400">Topics worth another look</p>

        <div className="space-y-2">
          {weaknesses.slice(0, 3).map((skill) => (
            <div
              key={skill.skillId || skill.skillName}
              className="flex items-center justify-between rounded-lg bg-g-50 p-2 dark:bg-g-100"
            >
              <div>
                <p className="text-sm font-medium">
                  {skill.topicName ? (
                    <>
                      <span className="font-normal text-g-500 dark:text-g-400">
                        {skill.topicName}
                      </span>
                      <span className="mx-1 text-g-400 dark:text-g-500">&gt;</span>
                      {skill.skillName}
                    </>
                  ) : (
                    skill.skillName
                  )}
                </p>
                <p className="text-xs text-g-500">{skill.displayLabel}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestPractice(skill)}
                className="text-p-600 hover:bg-p-50 hover:text-p-700 dark:hover:bg-p-700/20"
              >
                Request
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {weaknesses.length > 3 && (
          <p className="text-center text-xs text-g-500">
            +{weaknesses.length - 3} more topics to practise
          </p>
        )}
      </CardContent>
    </Card>
  )
}

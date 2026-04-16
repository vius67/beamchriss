import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { TrendingUp, Minus, ChevronDown, ChevronRight, Dumbbell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useTopicPerformance, type TopicPerformance } from '../hooks/use-topic-performance'

/**
 * Topic Breakdown Component
 *
 * Shows performance by topic with expandable skill details.
 * Displays average score, attempts, and trend indicators.
 *
 * NOTE: For MVP, skill_id in submission_answers will be NULL.
 * This means the component will show an empty state until
 * skill mapping is implemented in a future phase.
 */
export function TopicBreakdown() {
  const { data: topics, isLoading, error } = useTopicPerformance()
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Topic Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Topic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-err">Failed to load topic performance</p>
        </CardContent>
      </Card>
    )
  }

  if (!topics || topics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-g-900 dark:text-white">
            Topic Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-g-500 dark:text-g-600">
            Complete some assignments to see your topic breakdown.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group by topic
  const groupedByTopic = topics.reduce(
    (acc, skill) => {
      const topic = skill.topicName
      if (!acc[topic]) {
        acc[topic] = []
      }
      acc[topic].push(skill)
      return acc
    },
    {} as Record<string, TopicPerformance[]>
  )

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) {
        next.delete(topic)
      } else {
        next.add(topic)
      }
      return next
    })
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Topic Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-g-200 dark:divide-g-300">
          {Object.entries(groupedByTopic).map(([topicName, skills]) => {
            const isExpanded = expandedTopics.has(topicName)

            // Calculate topic-level averages
            const topicAverage = Math.round(
              skills.reduce((sum, s) => sum + s.averageScore, 0) / skills.length
            )
            const totalAttempts = skills.reduce((sum, s) => sum + s.attempts, 0)

            return (
              <div key={topicName}>
                {/* Topic header (clickable) */}
                <button
                  onClick={() => toggleTopic(topicName)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-g-50 dark:hover:bg-g-200/50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-g-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-g-400" />
                    )}
                    <div>
                      <p className="font-medium text-g-800 dark:text-white">{topicName}</p>
                      <p className="text-sm text-g-500">
                        {skills.length} skill{skills.length !== 1 ? 's' : ''} - {totalAttempts}{' '}
                        attempt{totalAttempts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ScoreBadge score={topicAverage} />
                </button>

                {/* Expanded skills */}
                {isExpanded && (
                  <div className="bg-g-50 px-4 pb-4 dark:bg-g-200/30">
                    <div className="space-y-1">
                      {skills.map((skill) => (
                        <SkillRow key={skill.skillId} skill={skill} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface SkillRowProps {
  skill: TopicPerformance
}

function SkillRow({ skill }: SkillRowProps) {
  const navigate = useNavigate()

  const TrendIcon = skill.trend === 'improving' ? TrendingUp : Minus

  const trendColor = skill.trend === 'improving' ? 'text-ok' : 'text-g-400'

  const trendLabel = skill.trend === 'improving' ? 'Improving' : 'Steady'

  const handlePractice = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Navigate with subskillId if available, otherwise just go to worksheets
    if (skill.subskillId) {
      navigate({
        to: '/worksheets',
        search: { subskillId: skill.subskillId } as Record<string, unknown>,
      })
    } else {
      navigate({ to: '/worksheets' })
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-g-100">
      <div className="flex items-center gap-3">
        <div className={cn('flex items-center gap-1', trendColor)}>
          <TrendIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-g-700 dark:text-g-600">{skill.skillName}</p>
          <div className="flex items-center gap-2 text-xs text-g-500">
            <span>
              {skill.attempts} attempt{skill.attempts !== 1 ? 's' : ''}
            </span>
            <span className={cn(trendColor)}>({trendLabel})</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePractice}
          className="flex flex-shrink-0 items-center gap-1 text-xs text-p-500 transition-colors hover:text-p-600"
          title="Request practice worksheet for this skill"
          aria-label={`Request practice worksheet for ${skill.skillName}`}
        >
          <Dumbbell className="h-3 w-3" />
          <span className="hidden sm:inline">Practice</span>
        </button>
        <ScoreBadge score={skill.averageScore} size="sm" />
      </div>
    </div>
  )
}

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md'
}

function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const bgColor =
    score >= 80
      ? 'bg-ok/20 text-ok'
      : score >= 60
        ? 'bg-warn/20 text-warn-text'
        : 'bg-err/20 text-err'

  return (
    <span
      className={cn(
        'rounded-full font-semibold',
        bgColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {score}%
    </span>
  )
}

// Full curriculum tree component
// Renders three-level collapsible hierarchy: Topic > Subtopic > Subskill
// Shows ALL subskills including ungraded ones as "Not yet attempted"
// Reuses mastery badge patterns from SubjectMasteryDrilldown

import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ChevronRight, ChevronDown, BookOpen, Dumbbell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import {
  useFullCurriculumTree,
  type CurriculumTopic,
  type CurriculumSubtopic,
  type CurriculumSubskill,
} from '../hooks/use-full-curriculum-tree'

// ─── Props ─────────────────────────────────────────────────────────

interface CurriculumTreeProps {
  subject: string
  yearLevels: number[] | null // Post Phase 21-D: integer years (was "Y9" strings)
  studentId?: string // Optional: for parent portal viewing a child's data
}

// ─── Mastery Badges ────────────────────────────────────────────────

const MASTERY_BADGES: Record<string, { label: string; className: string }> = {
  mastered: { label: 'Mastered', className: 'bg-ok/15 text-ok' },
  strong: {
    label: 'Strong',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  developing: {
    label: 'Building',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  growing: {
    label: 'Growing',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  just_starting: { label: 'Getting Started', className: 'bg-err/15 text-err' },
}

function getMasteryBadge(level: string): { label: string; className: string } {
  return (
    MASTERY_BADGES[level] ?? {
      label: 'Building',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    }
  )
}

function getProgressColor(score: number): string {
  if (score >= 0.85) return 'bg-ok'
  if (score >= 0.7) return 'bg-blue-500'
  if (score >= 0.5) return 'bg-yellow-500'
  if (score >= 0.3) return 'bg-orange-500'
  return 'bg-err'
}

// ─── Main Component ────────────────────────────────────────────────

/**
 * Full Curriculum Tree
 *
 * Renders all topics, subtopics, and subskills for a subject + year level.
 * Graded subskills show mastery badges; ungraded ones show "Not yet attempted".
 * First 2 topics with mastery data auto-expand on load.
 */
export function CurriculumTree({ subject, yearLevels, studentId }: CurriculumTreeProps) {
  const { data: topics, isLoading, error } = useFullCurriculumTree(subject, yearLevels, studentId)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set())

  // Auto-expand first 2 topics that have mastery data
  useEffect(() => {
    if (!topics || topics.length === 0) return
    const topicsWithData = topics.filter((t) => t.attemptedCount > 0)
    const toExpand = topicsWithData.slice(0, 2).map((t) => t.id)
    if (toExpand.length > 0) {
      setExpandedTopics(new Set(toExpand))
    }
  }, [topics])

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }
      return next
    })
  }

  const toggleSubtopic = (subtopicId: string) => {
    setExpandedSubtopics((prev) => {
      const next = new Set(prev)
      if (next.has(subtopicId)) {
        next.delete(subtopicId)
      } else {
        next.add(subtopicId)
      }
      return next
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-g-900 dark:text-white">
          Full Curriculum
        </CardTitle>
        <p className="text-xs text-g-500 dark:text-g-600">All topics and skills for {subject}</p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3 p-6 pt-0">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6 pt-0">
            <p className="text-center text-sm text-err">Failed to load curriculum data</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && (!topics || topics.length === 0) && (
          <div className="flex flex-col items-center gap-3 p-8">
            <BookOpen className="h-10 w-10 text-g-300 dark:text-g-500" />
            <p className="text-center text-sm text-g-500 dark:text-g-600">
              Curriculum data not yet available for {subject}
            </p>
          </div>
        )}

        {/* Topic hierarchy */}
        {!isLoading && !error && topics && topics.length > 0 && (
          <div className="divide-y divide-g-200 dark:divide-g-300">
            {topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                isExpanded={expandedTopics.has(topic.id)}
                onToggle={() => toggleTopic(topic.id)}
                expandedSubtopics={expandedSubtopics}
                onToggleSubtopic={toggleSubtopic}
                isParentView={!!studentId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Topic Row ─────────────────────────────────────────────────────

interface TopicRowProps {
  topic: CurriculumTopic
  isExpanded: boolean
  onToggle: () => void
  expandedSubtopics: Set<string>
  onToggleSubtopic: (id: string) => void
  isParentView: boolean
}

function TopicRow({
  topic,
  isExpanded,
  onToggle,
  expandedSubtopics,
  onToggleSubtopic,
  isParentView,
}: TopicRowProps) {
  const hasData = topic.averageScore !== null
  const pct = hasData ? Math.round(topic.averageScore! * 100) : null

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-g-50 dark:hover:bg-g-200/50"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 flex-shrink-0 text-g-400" />
          ) : (
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-g-400" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-g-800 dark:text-white">{topic.name}</p>
            <p className="text-xs text-g-500">
              {topic.attemptedCount}/{topic.totalCount} skills practised
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasData ? (
            <>
              <div className="hidden w-24 sm:block">
                <ProgressBar score={topic.averageScore!} />
              </div>
              <span className="text-sm font-semibold text-g-700 dark:text-g-500">{pct}%</span>
            </>
          ) : (
            <span className="text-xs text-g-400 dark:text-g-600">No data yet</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="bg-g-50 pb-2 pl-6 pr-4 dark:bg-g-200/30">
          {topic.subtopics.map((subtopic) => (
            <SubtopicRow
              key={subtopic.id}
              subtopic={subtopic}
              isExpanded={expandedSubtopics.has(subtopic.id)}
              onToggle={() => onToggleSubtopic(subtopic.id)}
              isParentView={isParentView}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Subtopic Row ──────────────────────────────────────────────────

interface SubtopicRowProps {
  subtopic: CurriculumSubtopic
  isExpanded: boolean
  onToggle: () => void
  isParentView: boolean
}

function SubtopicRow({ subtopic, isExpanded, onToggle, isParentView }: SubtopicRowProps) {
  const hasData = subtopic.averageScore !== null
  const pct = hasData ? Math.round(subtopic.averageScore! * 100) : null

  return (
    <div className="mt-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-white dark:hover:bg-g-100"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-g-400" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-g-400" />
          )}
          <p className="text-sm font-medium text-g-700 dark:text-g-500">{subtopic.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasData ? (
            <>
              <div className="hidden w-20 sm:block">
                <ProgressBar score={subtopic.averageScore!} />
              </div>
              <span className="text-xs font-semibold text-g-600 dark:text-g-500">{pct}%</span>
            </>
          ) : (
            <span className="text-xs text-g-400 dark:text-g-600">
              {subtopic.attemptedCount}/{subtopic.subskills.length}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-1 pb-2 pl-6">
          {subtopic.subskills.map((subskill) => (
            <SubskillRow key={subskill.id} subskill={subskill} isParentView={isParentView} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Subskill Row ──────────────────────────────────────────────────

function SubskillRow({
  subskill,
  isParentView,
}: {
  subskill: CurriculumSubskill
  isParentView: boolean
}) {
  const navigate = useNavigate()

  const handlePractice = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate({
      to: '/worksheets',
      search: { subskillId: subskill.id } as Record<string, unknown>,
    })
  }

  const practiceButton = !isParentView ? (
    <button
      onClick={handlePractice}
      className="flex flex-shrink-0 items-center gap-1 text-xs text-p-500 transition-colors hover:text-p-600"
      title="Request practice worksheet for this skill"
      aria-label={`Request practice worksheet for ${subskill.name}`}
    >
      <Dumbbell className="h-3 w-3" />
      <span className="hidden sm:inline">Practice</span>
    </button>
  ) : null

  if (subskill.status === 'not_attempted') {
    return (
      <div className="flex items-center justify-between rounded-lg bg-white p-2.5 dark:bg-g-100">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-g-400 dark:text-g-600">{subskill.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {practiceButton}
          {/* Dashed progress bar placeholder */}
          <div className="hidden w-16 sm:block">
            <div className="h-2 w-full rounded-full border border-dashed border-g-300 dark:border-g-500" />
          </div>
          <span className="whitespace-nowrap rounded-full bg-g-100 px-2 py-0.5 text-xs font-medium text-g-400 dark:bg-g-200 dark:text-g-600">
            Not yet attempted
          </span>
        </div>
      </div>
    )
  }

  // Attempted subskill with mastery data
  const mastery = subskill.mastery!
  const badge = getMasteryBadge(mastery.level)
  const pct = Math.round(mastery.score * 100)

  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-2.5 dark:bg-g-100">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-g-700 dark:text-g-500">{subskill.name}</p>
        <p className="text-xs text-g-400">
          {mastery.attempts} attempt{mastery.attempts !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {practiceButton}
        <span className="text-xs font-medium text-g-600 dark:text-g-500">{pct}%</span>
        <span
          className={cn(
            'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────

function ProgressBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)))

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-g-200 dark:bg-g-300">
      <div
        className={cn('h-full rounded-full transition-all', getProgressColor(score))}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

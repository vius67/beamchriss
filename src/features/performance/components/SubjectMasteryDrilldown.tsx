// Subject mastery drilldown component
// Displays collapsible topic -> subtopic -> subskill hierarchy with mastery scores
// Color-coded mastery level badges with student-friendly labels

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import {
  useSubjectMastery,
  type TopicMastery,
  type SubtopicMastery,
  type SubskillMastery,
} from '../hooks/use-subject-mastery'

interface SubjectMasteryDrilldownProps {
  subjects: string[]
}

/**
 * Mastery level badge configuration
 * Student-friendly labels (no negative framing)
 */
const MASTERY_BADGES: Record<string, { label: string; className: string }> = {
  mastered: { label: 'Mastered', className: 'bg-ok/15 text-ok' },
  strong: { label: 'Strong', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  developing: { label: 'Building', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  growing: { label: 'Growing', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  just_starting: { label: 'Getting Started', className: 'bg-err/15 text-err' },
}

function getMasteryBadge(level: string): { label: string; className: string } {
  return MASTERY_BADGES[level] ?? { label: 'Building', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
}

/**
 * Progress bar color based on mastery score (0-1)
 */
function getProgressColor(score: number): string {
  if (score >= 0.85) return 'bg-ok'
  if (score >= 0.70) return 'bg-blue-500'
  if (score >= 0.50) return 'bg-yellow-500'
  if (score >= 0.30) return 'bg-orange-500'
  return 'bg-err'
}

/**
 * Subject Mastery Drilldown
 *
 * Shows topic -> subtopic -> subskill hierarchy for the selected subject.
 * Each level shows a progress bar and mastery percentage.
 * Subskill level shows mastery badge and attempts count.
 */
export function SubjectMasteryDrilldown({ subjects }: SubjectMasteryDrilldownProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] ?? '')
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set())

  const { data: topics, isLoading, error } = useSubjectMastery(selectedSubject || null)

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
          Subject Mastery
        </CardTitle>
        {/* Subject selector tabs */}
        {subjects.length > 1 && (
          <div className="flex gap-1 pt-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  setSelectedSubject(subject)
                  setExpandedTopics(new Set())
                  setExpandedSubtopics(new Set())
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  selectedSubject === subject
                    ? 'bg-p-100 text-p-700 dark:bg-p-700/30 dark:text-p-300'
                    : 'text-g-500 hover:bg-g-100 dark:text-g-600 dark:hover:bg-g-200/50'
                )}
              >
                {subject}
              </button>
            ))}
          </div>
        )}
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
            <p className="text-center text-sm text-err">Failed to load mastery data</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && (!topics || topics.length === 0) && (
          <div className="p-6 pt-0">
            <p className="text-sm text-g-500 dark:text-g-600">
              Complete some assignments to see your mastery breakdown.
            </p>
          </div>
        )}

        {/* Topic hierarchy */}
        {!isLoading && !error && topics && topics.length > 0 && (
          <div className="divide-y divide-g-200 dark:divide-g-300">
            {topics.map((topic) => (
              <TopicRow
                key={topic.topicId}
                topic={topic}
                isExpanded={expandedTopics.has(topic.topicId)}
                onToggle={() => toggleTopic(topic.topicId)}
                expandedSubtopics={expandedSubtopics}
                onToggleSubtopic={toggleSubtopic}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Topic Row ---

interface TopicRowProps {
  topic: TopicMastery
  isExpanded: boolean
  onToggle: () => void
  expandedSubtopics: Set<string>
  onToggleSubtopic: (id: string) => void
}

function TopicRow({ topic, isExpanded, onToggle, expandedSubtopics, onToggleSubtopic }: TopicRowProps) {
  const pct = Math.round(topic.averageScore * 100)

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
            <p className="font-medium text-g-800 dark:text-white">{topic.topicName}</p>
            <p className="text-xs text-g-500">
              {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden w-24 sm:block">
            <ProgressBar score={topic.averageScore} />
          </div>
          <span className="text-sm font-semibold text-g-700 dark:text-g-500">{pct}%</span>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-g-50 pb-2 pl-6 pr-4 dark:bg-g-200/30">
          {topic.subtopics.map((subtopic) => (
            <SubtopicRow
              key={subtopic.subtopicId}
              subtopic={subtopic}
              isExpanded={expandedSubtopics.has(subtopic.subtopicId)}
              onToggle={() => onToggleSubtopic(subtopic.subtopicId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Subtopic Row ---

interface SubtopicRowProps {
  subtopic: SubtopicMastery
  isExpanded: boolean
  onToggle: () => void
}

function SubtopicRow({ subtopic, isExpanded, onToggle }: SubtopicRowProps) {
  const pct = Math.round(subtopic.averageScore * 100)

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
          <p className="text-sm font-medium text-g-700 dark:text-g-500">{subtopic.subtopicName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden w-20 sm:block">
            <ProgressBar score={subtopic.averageScore} />
          </div>
          <span className="text-xs font-semibold text-g-600 dark:text-g-500">{pct}%</span>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-1 pb-2 pl-6">
          {subtopic.subskills.map((subskill) => (
            <SubskillRow key={subskill.subskillId} subskill={subskill} />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Subskill Row ---

function SubskillRow({ subskill }: { subskill: SubskillMastery }) {
  const badge = getMasteryBadge(subskill.masteryLevel)
  const pct = Math.round(subskill.masteryScore * 100)

  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-2.5 dark:bg-g-100">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-g-700 dark:text-g-500">{subskill.subskillName}</p>
        <p className="text-xs text-g-400">
          {subskill.attemptsCount} attempt{subskill.attemptsCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
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

// --- Progress Bar ---

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

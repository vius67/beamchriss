import { useState, useEffect, useRef } from 'react'
import { FileText, Clock, CheckCircle, Search, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/components/ui/card'
import { useTopicsForSubject } from '../hooks/use-topics-for-subject'
import { useSubtopicsForTopic } from '../hooks/use-subtopics-for-topic'
import { useSubskillsForSubtopic } from '../hooks/use-subskills-for-subtopic'
import { useSubskillAncestry } from '../hooks/use-subskill-ancestry'
import { useRequestWorksheet } from '../hooks/use-request-worksheet'
import { useSearchCurriculum, type CurriculumSearchResult } from '../hooks/use-search-curriculum'
import { cn } from '@/shared/lib/cn'

interface WorksheetRequestFormProps {
  /** Pre-selected subskill from PracticeOpportunities click */
  initialSubskillId?: string | null
  initialSubject?: string
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

const SUBJECTS = ['Maths', 'Physics', 'Chemistry']
const QUESTION_COUNTS = [10, 15, 20]

/**
 * Manual worksheet request form with cascading topic/subtopic/subskill dropdowns
 *
 *  
 * - "Request custom worksheet" NOT "Generate worksheet"
 * - "Your worksheet is being prepared" NOT "Generating..."
 * - Delay 30min-2hr (handled by backend)
 */
export function WorksheetRequestForm({
  initialSubskillId,
  initialSubject,
  onSuccess,
  onCancel,
  className,
}: WorksheetRequestFormProps) {
  const [subject, setSubject] = useState(initialSubject || 'Maths')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null)
  const [selectedSubskillId, setSelectedSubskillId] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(20)
  const [submitted, setSubmitted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isSearchFilling = useRef(false)

  // Resolve ancestry for initialSubskillId to pre-populate the cascade
  const { data: ancestry } = useSubskillAncestry(initialSubskillId ?? null)
  const hasAppliedAncestry = useRef(false)

  const { data: topics, isLoading: topicsLoading } = useTopicsForSubject(subject)
  const { data: subtopics, isLoading: subtopicsLoading } = useSubtopicsForTopic(selectedTopicId)
  const { data: subskills, isLoading: subskillsLoading } =
    useSubskillsForSubtopic(selectedSubtopicId)
  const { mutate: requestWorksheet, isPending } = useRequestWorksheet()
  const { data: searchResults } = useSearchCurriculum(searchQuery, subject)

  // Pre-populate cascade from ancestry (runs once when ancestry resolves)
  useEffect(() => {
    if (!ancestry || hasAppliedAncestry.current) return
    hasAppliedAncestry.current = true
    setSubject(ancestry.subject)
    setSelectedTopicId(ancestry.topicId)
    setSelectedSubtopicId(ancestry.subtopicId)
    setSelectedSubskillId(ancestry.subskillId)
  }, [ancestry])

  // Reset downstream selections when parent changes (skip during ancestry init or search fill)
  useEffect(() => {
    if (isSearchFilling.current) return
    if (hasAppliedAncestry.current && ancestry) {
      if (subject !== ancestry.subject) {
        setSelectedTopicId(null)
        setSelectedSubtopicId(null)
        setSelectedSubskillId(null)
      }
      return
    }
    setSelectedTopicId(null)
    setSelectedSubtopicId(null)
    setSelectedSubskillId(null)
  }, [subject]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isSearchFilling.current) return
    if (hasAppliedAncestry.current && ancestry && selectedTopicId === ancestry.topicId) return
    setSelectedSubtopicId(null)
    setSelectedSubskillId(null)
  }, [selectedTopicId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isSearchFilling.current) return
    if (hasAppliedAncestry.current && ancestry && selectedSubtopicId === ancestry.subtopicId) return
    setSelectedSubskillId(null)
  }, [selectedSubtopicId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear search-filling guard after all cascade effects have run
  useEffect(() => {
    if (isSearchFilling.current) {
      isSearchFilling.current = false
    }
  })

  // Close search dropdown on click-outside
  useEffect(() => {
    if (!isSearchOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isSearchOpen])

  // Close search dropdown on Escape
  useEffect(() => {
    if (!isSearchOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsSearchOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen])

  // Clear search when subject changes
  useEffect(() => {
    setSearchQuery('')
    setIsSearchOpen(false)
  }, [subject])

  const handleSearchSelect = (result: CurriculumSearchResult) => {
    isSearchFilling.current = true
    setSelectedTopicId(result.topic_id)
    setSelectedSubtopicId(result.subtopic_id)
    setSelectedSubskillId(result.subskill_id)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const handleSubmit = () => {
    // Build focusSubskillIds based on the most specific selection
    let focusSubskillIds: string[] = []

    if (selectedSubskillId) {
      // Specific subskill selected (includes ancestry pre-selection)
      focusSubskillIds = [selectedSubskillId]
    } else if (initialSubskillId && !hasAppliedAncestry.current) {
      // Ancestry not yet resolved but we have the ID — use it as fallback
      focusSubskillIds = [initialSubskillId]
    } else if (selectedSubtopicId && subskills?.length) {
      // Subtopic selected — use all subskills under it (already loaded)
      focusSubskillIds = subskills.map((s) => s.id)
    } else if (selectedTopicId && subtopics?.length) {
      // Topic selected but no subtopic — leave empty, will use unfocused selection
      // (resolving all subskills for a whole year level would be too broad)
    }

    const input =
      focusSubskillIds.length > 0
        ? { subject, focusSubskillIds, questionCount }
        : { subject, questionCount }

    requestWorksheet(input, {
      onSuccess: () => {
        setSubmitted(true)
        onSuccess?.()
      },
    })
  }

  // Success state
  if (submitted) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="pb-6 pt-8">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-ok" />
          <h3 className="mb-2 text-lg font-semibold">Request Received</h3>
          <p className="mb-4 text-g-600 dark:text-g-400">
            Your worksheet is being prepared by our team.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-g-500">
            <Clock className="h-4 w-4" />
            <span>Usually ready by next day</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Request Custom Worksheet
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick find search */}
        <div ref={searchRef} className="relative">
          <label htmlFor="worksheet-quick-find" className="mb-1.5 block text-sm font-medium">
            Quick find
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-g-500" />
            <input
              id="worksheet-quick-find"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(e.target.value.length >= 2)
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) setIsSearchOpen(true)
              }}
              placeholder="Search topics, subtopics, skills..."
              className={cn(
                'w-full rounded-md border py-2 pl-9 pr-9 text-sm transition-colors',
                'border-g-200 bg-white dark:border-g-300 dark:bg-g-100',
                'focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500',
                'placeholder:text-g-400'
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                  searchInputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-g-400 hover:text-g-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {isSearchOpen && searchResults && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-g-200 bg-card shadow-lg">
              {searchResults.map((result) => (
                <button
                  key={`${result.result_type}-${result.result_id}`}
                  type="button"
                  onClick={() => handleSearchSelect(result)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-g-50"
                >
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                      result.result_type === 'topic' &&
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                      result.result_type === 'subtopic' &&
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                      result.result_type === 'subskill' &&
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    )}
                  >
                    {result.result_type === 'topic'
                      ? 'Topic'
                      : result.result_type === 'subtopic'
                        ? 'Subtopic'
                        : 'Skill'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium">{result.result_name}</div>
                    {result.result_type !== 'topic' && (
                      <div className="truncate text-xs text-g-500">
                        {result.topic_name}
                        {result.result_type === 'subskill' &&
                          result.subtopic_name &&
                          ` › ${result.subtopic_name}`}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {isSearchOpen &&
            searchQuery.length >= 2 &&
            searchResults &&
            searchResults.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-g-200 bg-card p-3 text-center text-sm text-g-500 shadow-lg">
                No results for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
        </div>

        {/* Subject selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Subject</label>
          <div className="flex gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  subject === s ? 'bg-p-500 text-white' : 'bg-g-100 hover:bg-g-200'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Topic dropdown (optional) */}
        <div>
          <label htmlFor="topic-select" className="mb-1.5 block text-sm font-medium">
            Topic <span className="font-normal text-g-500">(optional)</span>
          </label>
          <select
            id="topic-select"
            value={selectedTopicId ?? ''}
            onChange={(e) => setSelectedTopicId(e.target.value || null)}
            disabled={topicsLoading}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm transition-colors',
              'border-g-200 bg-white dark:border-g-300 dark:bg-g-100',
              'focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <option value="">
              {topicsLoading
                ? 'Loading...'
                : topics && topics.length > 0
                  ? 'All topics'
                  : 'No topics available'}
            </option>
            {topics?.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subtopic dropdown (only appears after topic selected) */}
        {selectedTopicId && (
          <div>
            <label htmlFor="subtopic-select" className="mb-1.5 block text-sm font-medium">
              Subtopic <span className="font-normal text-g-500">(optional)</span>
            </label>
            <select
              id="subtopic-select"
              value={selectedSubtopicId ?? ''}
              onChange={(e) => setSelectedSubtopicId(e.target.value || null)}
              disabled={subtopicsLoading}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm transition-colors',
                'border-g-200 bg-white dark:border-g-300 dark:bg-g-100',
                'focus:border-p-500 focus:outline-none focus:ring-1 focus:ring-p-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <option value="">
                {subtopicsLoading
                  ? 'Loading...'
                  : subtopics && subtopics.length > 0
                    ? 'All subtopics'
                    : 'No subtopics available'}
              </option>
              {subtopics?.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>
                  {subtopic.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subskill picker (only appears after subtopic selected) */}
        {selectedSubtopicId && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Focus area <span className="font-normal text-g-500">(optional)</span>
            </label>
            {subskillsLoading ? (
              <p className="py-2 text-sm text-g-500">Loading...</p>
            ) : subskills && subskills.length > 0 ? (
              <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-g-200 p-2">
                {/* "All focus areas" option */}
                <button
                  type="button"
                  onClick={() => setSelectedSubskillId(null)}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    selectedSubskillId === null
                      ? 'border-p-500 bg-p-50 font-medium text-p-700 dark:bg-p-100/20 dark:text-p-300'
                      : 'border-g-200 hover:bg-g-50'
                  )}
                >
                  All focus areas
                </button>
                {subskills.map((subskill) => (
                  <button
                    key={subskill.id}
                    type="button"
                    onClick={() => setSelectedSubskillId(subskill.id)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left transition-colors',
                      selectedSubskillId === subskill.id
                        ? 'border-p-500 bg-p-50 dark:bg-p-100/20'
                        : 'border-g-200 hover:bg-g-50'
                    )}
                  >
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        selectedSubskillId === subskill.id ? 'text-p-700 dark:text-p-300' : ''
                      )}
                    >
                      {subskill.name}
                    </span>
                    {subskill.description && (
                      <span className="mt-0.5 block text-xs text-g-500">
                        {subskill.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-2 text-sm text-g-500">No focus areas available</p>
            )}
          </div>
        )}

        {/* Question count */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Questions</label>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  questionCount === count ? 'bg-p-500 text-white' : 'bg-g-100 hover:bg-g-200'
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
          {isPending ? 'Sending request...' : 'Request Worksheet'}
        </Button>
      </CardFooter>
    </Card>
  )
}

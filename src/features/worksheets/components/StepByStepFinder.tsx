import { useState } from 'react'
import { Search, Eye, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useFindStepByStep, type StepByStepMatch } from '../hooks/use-find-stepbystep'
import { PDFViewer } from '@/shared/components/PDFViewer'
import { usePDFViewer } from '@/shared/hooks/use-pdf-viewer'
import { sanitiseErrorMessage } from '@/shared/lib/sanitise-error'

interface StepByStepFinderProps {
  initialQuery?: string
  onCancel?: () => void
}

export function StepByStepFinder({ initialQuery = '', onCancel }: StepByStepFinderProps) {
  const [query, setQuery] = useState(initialQuery)
  const {
    mutate: findWorksheets,
    data: matches,
    isPending,
    isError,
    error,
    reset,
  } = useFindStepByStep()

  const { open, signedUrl, title: viewerTitle, openPDFWithUrl, closePDF } = usePDFViewer()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim().length < 5) return
    findWorksheets({ query: query.trim() })
  }

  const handleView = (pdfUrl: string, title: string) => {
    openPDFWithUrl(pdfUrl, title)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="stepbystep-query" className="mb-1 block text-sm font-medium">
            What do you need help with?
          </label>
          <input
            id="stepbystep-query"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (matches || isError) reset()
            }}
            placeholder="e.g. trigonometry bearings, polynomial long division..."
            autoFocus
            className="w-full rounded-md border border-g-300 bg-white px-3 py-2 text-sm outline-none focus:border-p-500 focus:ring-1 focus:ring-p-500 dark:border-g-600 dark:bg-g-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={query.trim().length < 5 || isPending} className="flex-1">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding worksheets...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Find Worksheets
              </>
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Error state */}
      {isError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {error instanceof Error
              ? sanitiseErrorMessage(error.message, 'Try describing the topic differently.')
              : 'Try describing the topic differently.'}
          </p>
        </div>
      )}

      {/* Empty state */}
      {matches && matches.length === 0 && (
        <p className="text-sm text-g-500 dark:text-g-400">
          No worksheets found. Try describing the topic differently.
        </p>
      )}

      {/* Results */}
      {matches && matches.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-g-500 dark:text-g-400">
            Found {matches.length} worksheet{matches.length !== 1 ? 's' : ''} for you:
          </p>
          {matches.map((match) => (
            <MatchCard
              key={`${match.yearLevel}-${match.title}`}
              match={match}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <PDFViewer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePDF()
        }}
        title={viewerTitle}
        signedUrl={signedUrl}
      />
    </div>
  )
}

function MatchCard({
  match,
  onView,
}: {
  match: StepByStepMatch
  onView: (url: string, title: string) => void
}) {
  const yearLabel =
    match.course === 'Standard'
      ? `Year ${match.yearLevel}`
      : `Year ${match.yearLevel} ${match.course}`

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-g-200 p-3 dark:border-g-700">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{match.title}</h4>
          <span className="dark:bg-p-900/30 shrink-0 rounded-full bg-p-100 px-2 py-0.5 text-xs font-medium text-p-700 dark:text-p-300">
            {yearLabel}
          </span>
        </div>
        <p className="mt-1 text-sm text-g-500 dark:text-g-400">{match.reason}</p>
      </div>
      {match.pdfUrl && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(match.pdfUrl!, match.title)}
          className="shrink-0"
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          View
        </Button>
      )}
    </div>
  )
}

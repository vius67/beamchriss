import { useState } from 'react'
import { FileText, Eye, Clock, CheckCircle, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { useWorksheetHistory } from '../hooks/use-worksheet-history'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/shared/lib/cn'
import { PDFViewer } from '@/shared/components/PDFViewer'
import { usePDFViewer } from '@/shared/hooks/use-pdf-viewer'
import { EmptyState } from '@/shared/components/EmptyState'

interface WorksheetHistoryProps {
  limit?: number
  className?: string
}

type WorksheetStatus = 'requested' | 'generating' | 'ready' | 'downloaded' | 'expired'

/**
 * Status configuration with icon, label, and color
 *
 *  
 * - "Being prepared" NOT "Processing" or "Generating"
 */
const STATUS_CONFIG: Record<WorksheetStatus, { icon: typeof Clock; label: string; color: string }> =
  {
    requested: { icon: Clock, label: 'Being prepared', color: 'text-g-500' },
    generating: { icon: Clock, label: 'Being prepared', color: 'text-g-500' },
    ready: { icon: CheckCircle, label: 'Ready', color: 'text-ok' },
    downloaded: { icon: CheckCircle, label: 'Downloaded', color: 'text-g-500' },
    expired: { icon: Clock, label: 'Expired', color: 'text-g-400' },
  }

/**
 * Worksheet history list
 *
 * 
 * - "Being prepared" shown until visible
 * 
 */
export function WorksheetHistory({ limit = 5, className }: WorksheetHistoryProps) {
  const { data: worksheets, isLoading } = useWorksheetHistory(limit)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { open, bucket, storagePath, title: viewerTitle, openPDF, closePDF } = usePDFViewer()

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Your Worksheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-g-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!worksheets?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Your Worksheets</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="no worksheets yet"
            description="request practice above to get started."
            size="sm"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Your Worksheets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {worksheets.map((worksheet) => {
            const status = worksheet.status as WorksheetStatus
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.requested
            const StatusIcon = config.icon
            const isReady = status === 'ready' || status === 'downloaded'
            const isExpanded = expandedId === worksheet.id

            const viewLinks = [
              { label: 'Worksheet', storagePath: worksheet.worksheetPdfPath },
              { label: 'Solutions', storagePath: worksheet.solutionsPdfPath },
              { label: 'Answer Key', storagePath: worksheet.answerKeyPdfPath },
            ].filter((link) => !!link.storagePath)

            return (
              <div key={worksheet.id} className="rounded-lg bg-g-50 dark:bg-g-100">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-p-500" />
                    <div>
                      <p className="text-sm font-medium">{worksheet.title}</p>
                      <div className="flex items-center gap-2 text-xs text-g-500">
                        <StatusIcon className={cn('h-3 w-3', config.color)} />
                        <span className={config.color}>{config.label}</span>
                        <span>·</span>
                        <span>
                          {formatDistanceToNow(new Date(worksheet.requestedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isReady && viewLinks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : worksheet.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Collapse documents' : 'Show documents'}
                    >
                      <Eye className="h-4 w-4" />
                      <ChevronDown
                        className={cn(
                          'ml-1 h-3 w-3 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </Button>
                  )}
                </div>

                {isExpanded && isReady && (
                  <div className="border-t border-g-200 px-3 pb-2 pt-1 dark:border-g-300">
                    <div className="space-y-1">
                      {viewLinks.map((link) => (
                        <button
                          key={link.label}
                          onClick={() =>
                            openPDF(
                              'worksheets',
                              link.storagePath!,
                              `${worksheet.title} - ${link.label}`
                            )
                          }
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-g-600 hover:bg-g-100 dark:text-g-400 dark:hover:bg-g-200"
                        >
                          <Eye className="h-3 w-3" />
                          View {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <PDFViewer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePDF()
        }}
        title={viewerTitle}
        bucket={bucket}
        storagePath={storagePath}
      />
    </>
  )
}

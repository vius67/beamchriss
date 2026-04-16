// Document card for the Branded Document Pack grid
// Opens PDFs in canvas-based viewer modal (no downloads)

import type { LucideIcon } from 'lucide-react'
import { Eye } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { PDFViewer } from '@/shared/components/PDFViewer'
import { usePDFViewer } from '@/shared/hooks/use-pdf-viewer'

interface DocumentCardProps {
  icon: LucideIcon
  title: string
  description: string
  storagePath: string | null // null = not yet generated
  filename: string // branded filename (kept for backwards compat, no longer used for download)
  highlighted?: boolean
  highlightMessage?: string | undefined // e.g. "Recommended for you"
}

/**
 * A single document card in the 2x2 Document Pack grid.
 *
 * - Opens PDF in canvas-based viewer modal (no raw downloads)
 * - Shows disabled/generating state when storagePath is null
 * - Highlight ring + message for the smart-recommended card
 */
export function DocumentCard({
  icon: Icon,
  title,
  description,
  storagePath,
  highlighted = false,
  highlightMessage,
}: DocumentCardProps) {
  const available = storagePath !== null
  const {
    open,
    bucket,
    storagePath: viewerPath,
    title: viewerTitle,
    openPDF,
    closePDF,
  } = usePDFViewer()

  return (
    <>
      <Card
        className={cn(
          'flex flex-col p-4 transition-shadow',
          highlighted && 'ring-2 ring-p-400 dark:ring-p-600',
          !available && 'opacity-50'
        )}
      >
        {/* Highlight badge */}
        {highlighted && highlightMessage && (
          <span className="mb-2 inline-block self-start rounded-full bg-p-100 px-2.5 py-0.5 text-xs font-medium text-p-700 dark:bg-p-100/40 dark:text-p-300">
            {highlightMessage}
          </span>
        )}

        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-p-50 p-2 dark:bg-p-100/30">
            <Icon className="h-5 w-5 text-p-500 dark:text-p-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-g-900 dark:text-g-100">{title}</h3>
            <p className="mt-0.5 text-xs text-g-500 dark:text-g-400">{description}</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => storagePath && openPDF('worksheets', storagePath, title)}
            disabled={!available}
          >
            <Eye className="mr-2 h-3.5 w-3.5" />
            {!available ? 'Coming soon' : 'View'}
          </Button>
        </div>
      </Card>

      <PDFViewer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePDF()
        }}
        title={viewerTitle}
        bucket={bucket}
        storagePath={viewerPath}
      />
    </>
  )
}

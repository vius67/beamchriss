/**
 * Canvas-based PDF viewer modal
 *
 * Security:
 * - PDFs rendered to <canvas> (no <iframe>/<embed>/<object>)
 * - Right-click disabled on viewer
 * - user-select: none prevents text selection
 * - @media print hides content
 * - Signed URLs consumed by fetch(), never exposed in DOM
 *
 * Watermarking:
 * - Every PDF is watermarked client-side with the student's name before rendering
 *
 * Input modes:
 * - bucket + storagePath: viewer generates signed URL internally
 * - signedUrl: for pre-computed URLs (StepByStepFinder)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { Loader2, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { supabase } from '../lib/supabase-client'
import { sanitiseErrorMessage } from '../lib/sanitise-error'
import { watermarkPdf } from '../lib/watermark-pdf'
import { useAuth } from '@/features/auth'

// Configure worker — use CDN URL matching installed version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Mode 1: storage bucket name */
  bucket?: string
  /** Mode 1: path within the bucket */
  storagePath?: string
  /** Mode 2: pre-computed signed URL */
  signedUrl?: string
}

type ViewerStatus = 'idle' | 'loading' | 'rendering' | 'ready' | 'error'

const MIN_SCALE = 0.5
const MAX_SCALE = 3.0
const SCALE_STEP = 0.25
const DEFAULT_SCALE = 1.0

export function PDFViewer({
  open,
  onOpenChange,
  title,
  bucket,
  storagePath,
  signedUrl,
}: PDFViewerProps) {
  const { student } = useAuth()
  const [status, setStatus] = useState<ViewerStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const pageCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderingRef = useRef(false)
  const watermarkedBytesRef = useRef<Uint8Array | null>(null)

  /** Fetch the PDF bytes from Supabase storage or signed URL */
  const fetchPdfBytes = useCallback(async (): Promise<ArrayBuffer> => {
    if (signedUrl) {
      const response = await fetch(signedUrl)
      if (!response.ok) throw new Error('Failed to fetch PDF')
      return response.arrayBuffer()
    }

    if (bucket && storagePath) {
      // Handle lesson-plans prefix: strip prefix, use lesson-plans bucket
      let actualBucket = bucket
      let actualPath = storagePath
      if (storagePath.startsWith('lesson-plans/') && bucket !== 'lesson-plans') {
        actualBucket = 'lesson-plans'
        actualPath = storagePath.slice('lesson-plans/'.length)
      }

      const { data, error } = await supabase.storage
        .from(actualBucket)
        .createSignedUrl(actualPath, 300) // 5-min expiry

      if (error || !data?.signedUrl) {
        throw new Error('Failed to generate signed URL')
      }

      const response = await fetch(data.signedUrl)
      if (!response.ok) throw new Error('Failed to fetch PDF')
      return response.arrayBuffer()
    }

    throw new Error('No PDF source provided')
  }, [bucket, storagePath, signedUrl])

  /** Render a single page to a canvas */
  const renderPage = useCallback(
    async (pdf: pdfjs.PDFDocumentProxy, pageNum: number, container: HTMLDivElement) => {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      let canvas = pageCanvasesRef.current.get(pageNum)
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.className = 'pdf-viewer-canvas mx-auto shadow-lg'
        canvas.style.marginBottom = '16px'
        canvas.style.display = 'block'
        pageCanvasesRef.current.set(pageNum, canvas)
      }

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      await page.render({ canvas, canvasContext: ctx, viewport }).promise

      if (!canvas.parentElement) {
        container.appendChild(canvas)
      }
    },
    [scale]
  )

  /** Load and render the full PDF */
  const loadPdf = useCallback(async () => {
    if (renderingRef.current) return
    renderingRef.current = true

    try {
      setStatus('loading')
      setErrorMessage('')

      // 1. Fetch raw PDF bytes
      const rawBytes = await fetchPdfBytes()

      // 2. Watermark with student name
      const studentName = student?.name || 'Student'
      const watermarkedBytes = await watermarkPdf(rawBytes, studentName)
      watermarkedBytesRef.current = watermarkedBytes

      // 3. Load into pdfjs (copy bytes — getDocument transfers the ArrayBuffer)
      setStatus('rendering')
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(watermarkedBytes) }).promise
      pdfDocRef.current = pdf
      setTotalPages(pdf.numPages)

      // 4. Clear old canvases
      const container = canvasContainerRef.current
      if (!container) return
      container.innerHTML = ''
      pageCanvasesRef.current.clear()

      // 5. Render all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        await renderPage(pdf, i, container)
      }

      setCurrentPage(1)
      setStatus('ready')
    } catch (err) {
      console.error('[PDFViewer] Load failed:', err)
      setErrorMessage(
        err instanceof Error
          ? sanitiseErrorMessage(err.message, 'Failed to load PDF')
          : 'Failed to load PDF'
      )
      setStatus('error')
    } finally {
      renderingRef.current = false
    }
  }, [fetchPdfBytes, renderPage, student?.name])

  // Load PDF when dialog opens
  useEffect(() => {
    if (open) {
      setScale(DEFAULT_SCALE)
      void loadPdf()
    } else {
      // Cleanup on close
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }
      pageCanvasesRef.current.clear()
      watermarkedBytesRef.current = null
      setStatus('idle')
      setTotalPages(0)
      setCurrentPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Re-render when scale changes (only when already loaded)
  useEffect(() => {
    if (status !== 'ready' || !pdfDocRef.current || !canvasContainerRef.current) return

    const pdf = pdfDocRef.current
    const container = canvasContainerRef.current

    const rerender = async () => {
      if (renderingRef.current) return
      renderingRef.current = true
      try {
        container.innerHTML = ''
        pageCanvasesRef.current.clear()
        for (let i = 1; i <= pdf.numPages; i++) {
          await renderPage(pdf, i, container)
        }
      } finally {
        renderingRef.current = false
      }
    }

    void rerender()
  }, [scale, renderPage, status])

  // Track current visible page via scroll
  useEffect(() => {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl || status !== 'ready') return

    const handleScroll = () => {
      const canvases = pageCanvasesRef.current
      const containerTop = scrollEl.getBoundingClientRect().top

      let closest = 1
      let closestDist = Infinity

      canvases.forEach((canvas, pageNum) => {
        const rect = canvas.getBoundingClientRect()
        const dist = Math.abs(rect.top - containerTop)
        if (dist < closestDist) {
          closestDist = dist
          closest = pageNum
        }
      })

      setCurrentPage(closest)
    }

    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [status])

  const zoomIn = () => setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE))
  const zoomOut = () => setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE))
  const resetZoom = () => setScale(DEFAULT_SCALE)

  const handleDownload = () => {
    const bytes = watermarkedBytesRef.current
    if (!bytes) return
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const retry = () => {
    setStatus('idle')
    void loadPdf()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="pdf-viewer-overlay flex h-[90vh] max-w-4xl flex-col gap-0 p-0"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm font-semibold">{title}</DialogTitle>
            <DialogDescription className="sr-only">PDF viewer for {title}</DialogDescription>
          </div>

          {/* Zoom controls */}
          {status === 'ready' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 min-w-[3rem] text-xs"
                onClick={resetZoom}
                aria-label="Reset zoom"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                {Math.round(scale * 100)}%
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Content area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-g-100 dark:bg-g-900">
          {/* Loading state */}
          {(status === 'loading' || status === 'rendering') && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-p-500" />
              <p className="text-sm text-g-500">
                {status === 'loading' ? 'Loading document...' : 'Rendering pages...'}
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
              <AlertCircle className="h-8 w-8 text-err" />
              <p className="text-center text-sm text-g-600">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          )}

          {/* Canvas container — pages rendered here */}
          <div
            ref={canvasContainerRef}
            className="py-4"
            style={{ display: status === 'ready' ? 'block' : 'none' }}
          />
        </div>

        {/* Footer — page counter */}
        {status === 'ready' && totalPages > 0 && (
          <div className="flex items-center border-t px-4 py-2">
            {student?.can_download ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-g-500 hover:text-g-700"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            ) : (
              <div />
            )}
            <span className="flex-1 text-center text-xs text-g-500">
              Page {currentPage} of {totalPages}
            </span>
            {student?.can_download ? <div className="w-[90px]" /> : <div />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

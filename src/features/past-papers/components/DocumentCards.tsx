// Branded Document Pack — 2x2 card grid for downloading 4 PDFs from a graded past paper
// Smart highlight recommends the most relevant document based on score percentage

import { useQuery } from '@tanstack/react-query'
import { BarChart3, Pencil, BookOpen, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase-client'
import { DocumentCard } from './DocumentCard'

function buildBrandedFilename(opts: {
  documentType: string
  subject: string
  paperName: string
  date: Date
}): string {
  const datePart = opts.date.toISOString().slice(0, 10)
  const safePaper = opts.paperName.replace(/[^\w]+/g, '-')
  return `BEAM_${opts.subject}_${safePaper}_${opts.documentType}_${datePart}.pdf`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

interface DocumentCardsProps {
  submissionId: string
  subject: string
  paperTitle: string
  mark: number | null
  maxMark: number | null
  autoWorksheetId: string | null
  statisticsPdfPath: string | null
  skipWorksheet?: boolean
}

/**
 * Worksheet PDF paths from the worksheets table.
 */
interface WorksheetPaths {
  worksheet_pdf_path: string | null
  solutions_pdf_path: string | null
  answer_key_pdf_path: string | null
}

/**
 * Compute which card to highlight based on score percentage.
 *
 * - 90%+: Highlight "Practice Questions" (challenge yourself)
 * - 60-89%: Highlight "Your Results" (review where marks went)
 * - <60%: Highlight "Step-by-Step Solutions" (start with solutions)
 */
function getHighlightIndex(mark: number | null, maxMark: number | null): number {
  if (mark === null || maxMark === null || maxMark === 0) return 0
  const pct = (mark / maxMark) * 100
  if (pct >= 90) return 1 // Practice Questions
  if (pct >= 60) return 0 // Your Results
  return 2 // Step-by-Step Solutions
}

function getHighlightMessage(mark: number | null, maxMark: number | null): string {
  if (mark === null || maxMark === null || maxMark === 0) return 'Recommended for you'
  const pct = (mark / maxMark) * 100
  if (pct >= 90) return 'Challenge yourself with these'
  if (pct >= 60) return 'Check where those marks went'
  return 'Start with the step-by-step solutions'
}

/**
 * Branded Document Pack grid.
 *
 * Displays 4 downloadable PDF cards:
 * 1. Your Results (statistics PDF)
 * 2. Practice Questions (worksheet PDF)
 * 3. Step-by-Step Solutions (solutions PDF)
 * 4. Quick Answers (answer key PDF)
 *
 * Smart highlight recommends the most relevant card based on score.
 */
export function DocumentCards({
  submissionId: _submissionId,
  subject,
  paperTitle,
  mark,
  maxMark,
  autoWorksheetId,
  statisticsPdfPath,
  skipWorksheet = false,
}: DocumentCardsProps) {
  // Fetch worksheet PDF paths when auto_worksheet_id exists
  const { data: worksheetPaths } = useQuery({
    queryKey: ['worksheet-paths', autoWorksheetId],
    queryFn: async (): Promise<WorksheetPaths | null> => {
      if (!autoWorksheetId) return null

      const { data, error } = await (supabase as SupabaseAny)
        .from('worksheets')
        .select('worksheet_pdf_path, solutions_pdf_path, answer_key_pdf_path')
        .eq('id', autoWorksheetId)
        .single()

      if (error) {
        console.warn('[DocumentCards] Failed to fetch worksheet paths:', error)
        return null
      }
      return data as WorksheetPaths
    },
    enabled: !!autoWorksheetId && !skipWorksheet,
    staleTime: 60 * 1000,
  })

  // Build storage paths
  const statisticsPath = statisticsPdfPath ?? null

  const practiceQuestionsPath = worksheetPaths?.worksheet_pdf_path ?? null
  const solutionsPath = worksheetPaths?.solutions_pdf_path ?? null
  const answerKeyPath = worksheetPaths?.answer_key_pdf_path ?? null

  // Smart highlight
  const highlightIndex = skipWorksheet ? 0 : getHighlightIndex(mark, maxMark)
  const highlightMsg = skipWorksheet ? 'Your detailed results' : getHighlightMessage(mark, maxMark)

  // Branded filenames for download
  const now = new Date()
  const brandedName = (
    docType: 'ProgressReport' | 'PracticeQuestions' | 'Solutions' | 'AnswerKey'
  ) => buildBrandedFilename({ documentType: docType, subject, paperName: paperTitle, date: now })

  // Card definitions
  const cards = [
    {
      icon: BarChart3,
      title: 'Your Results',
      description: 'Marks breakdown for each question',
      storagePath: statisticsPath,
      filename: brandedName('ProgressReport'),
    },
    {
      icon: Pencil,
      title: 'Practice Questions',
      description: 'Extra practice on the tricky bits',
      storagePath: practiceQuestionsPath,
      filename: brandedName('PracticeQuestions'),
    },
    {
      icon: BookOpen,
      title: 'Step-by-Step Solutions',
      description: 'Detailed worked solutions for every question',
      storagePath: solutionsPath,
      filename: brandedName('Solutions'),
    },
    {
      icon: CheckCircle2,
      title: 'Quick Answers',
      description: 'Answer key for quick reference',
      storagePath: answerKeyPath,
      filename: brandedName('AnswerKey'),
    },
  ]

  // When student opted out of worksheets, only show statistics card
  const visibleCards = skipWorksheet ? cards.filter((c) => c.title === 'Your Results') : cards

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {visibleCards.map((card, index) => (
        <DocumentCard
          key={card.title}
          icon={card.icon}
          title={card.title}
          description={card.description}
          storagePath={card.storagePath}
          filename={card.filename}
          highlighted={index === highlightIndex}
          highlightMessage={index === highlightIndex ? highlightMsg : undefined}
        />
      ))}
    </div>
  )
}

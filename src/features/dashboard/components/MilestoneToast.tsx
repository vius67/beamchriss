import { useEffect, useRef } from 'react'
import { useToast } from '@/shared/hooks/use-toast'
import { useStudentStats } from '@/features/dashboard'
import { useAuth } from '@/features/auth'
import { triggerMilestoneConfetti } from '@/shared/lib/confetti'
import { getMilestoneMessage, getPersonalizedSuffix } from '@/shared/lib/microcopy'

// Milestones to track
const MILESTONES = {
  fiveSubmissions: 5,
  tenSubmissions: 10,
  twentyFiveSubmissions: 25,
  fiftySubmissions: 50,
} as const

const MILESTONE_KEY = 'beam-portal-milestones'

/**
 * Component that watches for milestones and shows celebration toasts
 *  Soft milestone celebrations, not anxiety-inducing
 */
export function MilestoneToast() {
  const { toast } = useToast()
  const { data: stats } = useStudentStats()
  const { student } = useAuth()
  const celebratedRef = useRef<Set<string>>(new Set())

  // Load already celebrated milestones
  useEffect(() => {
    if (!student?.id) return
    const key = `${MILESTONE_KEY}-${student.id}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        celebratedRef.current = new Set(JSON.parse(stored))
      } catch {
        // Invalid JSON, reset
        celebratedRef.current = new Set()
      }
    }
  }, [student?.id])

  // Check for new milestones
  useEffect(() => {
    if (!stats || !student?.id) return

    const total = stats.total_submissions

    Object.entries(MILESTONES).forEach(([key, threshold]) => {
      if (total >= threshold && !celebratedRef.current.has(key)) {
        // Mark as celebrated
        celebratedRef.current.add(key)
        localStorage.setItem(
          `${MILESTONE_KEY}-${student.id}`,
          JSON.stringify([...celebratedRef.current])
        )

        // Show toast with small delay for better UX
        setTimeout(() => {
          const milestoneKey = key as keyof typeof MILESTONES
          let message = ''

          switch (milestoneKey) {
            case 'fiveSubmissions':
              message = getMilestoneMessage('fiveSubmissions')
              break
            case 'tenSubmissions':
              message = getMilestoneMessage('tenSubmissions')
              break
            default:
              message = `${threshold} submissions! Amazing progress!`
          }

          message += getPersonalizedSuffix(student.name)

          toast({
            title: 'Milestone reached!',
            description: message,
            variant: 'success',
          })

          triggerMilestoneConfetti()
        }, 500)
      }
    })
  }, [stats?.total_submissions, student, toast])

  // This component doesn't render anything
  return null
}

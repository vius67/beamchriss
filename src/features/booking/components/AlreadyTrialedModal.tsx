/**
 * Modal for students who have already trialed a subject
 *
 * 
 * - Already-trialed students see "Interested?" button
 * - Clicking "Contact Us" sends instant email to admin@beamacademy.info
 * - Shows success toast after email sent
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { supabase } from '@/shared/lib/supabase-client'

interface AlreadyTrialedModalProps {
  isOpen: boolean
  onClose: () => void
  subject: string
  studentName: string
  studentId: string
  studentEmail?: string
}

interface SendInterestPayload {
  studentId: string
  studentName: string
  studentEmail: string
  subject: string
}

/**
 * Send enrollment interest email to admin
 */
async function sendTrialInterestEmail(payload: SendInterestPayload): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trial-interest-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send interest email' }))
    throw new Error(error.error || 'Failed to send interest email')
  }
}

/**
 * Modal for students who've already completed a trial
 *
 * Displays enrollment options and sends interest email to admin.
 *  instant admin notification.
 */
export function AlreadyTrialedModal({
  isOpen,
  onClose,
  subject,
  studentName,
  studentId,
  studentEmail = '',
}: AlreadyTrialedModalProps) {
  const [emailSent, setEmailSent] = useState(false)

  const sendInterestMutation = useMutation({
    mutationFn: sendTrialInterestEmail,
    onSuccess: () => {
      setEmailSent(true)
    },
    onError: (error) => {
      console.error('Failed to send interest email:', error)
    },
  })

  const handleContactUs = () => {
    sendInterestMutation.mutate({
      studentId,
      studentName,
      studentEmail,
      subject,
    })
  }

  const handleClose = () => {
    // Reset state when closing
    setEmailSent(false)
    sendInterestMutation.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {emailSent ? (
          // Success state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle className="h-5 w-5" />
                We've Got Your Interest!
              </DialogTitle>
              <DialogDescription>
                Thanks for letting us know you're interested in {subject}. We'll be in touch soon to
                discuss enrollment options.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-sm text-green-800 dark:text-green-300">
                  A member of our team will reach out within 24 hours to help you get started with{' '}
                  {subject}.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          // Initial state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-p-600" />
                Interested in {subject}?
              </DialogTitle>
              <DialogDescription>
                You've already completed a trial for {subject}. Let us know you're interested in
                enrolling and we'll be in touch.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-g-200 bg-g-50 p-4 dark:border-g-700 dark:bg-g-800">
                <h4 className="mb-2 font-medium text-g-900 dark:text-white">What happens next?</h4>
                <ul className="space-y-2 text-sm text-g-700 dark:text-g-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-p-600">1.</span>
                    <span>Click "Contact Us" below to let us know you're interested</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-p-600">2.</span>
                    <span>Our team will reach out within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-p-600">3.</span>
                    <span>We'll discuss class times and enrollment options that work for you</span>
                  </li>
                </ul>
              </div>

              {sendInterestMutation.isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Something went wrong. Please try again or email us directly at{' '}
                    <a
                      href={`mailto:admin@beamacademy.info?subject=Enrollment%20Interest%20-%20${encodeURIComponent(subject)}`}
                      className="underline"
                    >
                      admin@beamacademy.info
                    </a>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Maybe Later
              </Button>
              <Button onClick={handleContactUs} disabled={sendInterestMutation.isPending}>
                {sendInterestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Contact Us'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

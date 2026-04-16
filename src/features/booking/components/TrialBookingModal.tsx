/**
 * Modal for students who have never trialed a subject
 *
 * 
 * - Never-trialed students see "Sign Up for Trial" button
 * - This modal explains the trial process and directs to trial pipeline
 */

import { format } from 'date-fns'
import { Calendar, Clock, GraduationCap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'

interface TrialBookingModalProps {
  isOpen: boolean
  onClose: () => void
  subject: string
  slotDate?: string
  slotTime?: string
}

/**
 * Modal directing never-trialed students to the trial signup flow
 *
 * Shows slot details and explains the trial process.
 * The actual trial booking is handled by existing trial pipeline.
 */
export function TrialBookingModal({
  isOpen,
  onClose,
  subject,
  slotDate,
  slotTime,
}: TrialBookingModalProps) {
  const handleTrialSignup = () => {
    // Direct to trial contact flow
    //  trial pipeline handles actual booking
    window.location.href = `mailto:admin@beamacademy.info?subject=Trial%20Request%20-%20${encodeURIComponent(subject)}&body=Hi%2C%0A%0AI%27d%20like%20to%20book%20a%20trial%20lesson%20for%20${encodeURIComponent(subject)}.%0A%0AThanks`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-p-600" />
            Try a {subject} Class
          </DialogTitle>
          <DialogDescription>
            Start with a free trial lesson to see if BEAM is right for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slot details if available */}
          {slotDate && (
            <div className="rounded-lg border border-g-200 bg-g-50 p-4 dark:border-g-700 dark:bg-g-800">
              <p className="mb-2 text-sm font-medium text-g-700 dark:text-g-400">
                You're interested in:
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-g-900 dark:text-white">
                  <Calendar className="h-4 w-4 text-g-500" />
                  <span>{format(new Date(slotDate), 'EEEE, d MMMM yyyy')}</span>
                </div>
                {slotTime && (
                  <div className="flex items-center gap-2 text-g-900 dark:text-white">
                    <Clock className="h-4 w-4 text-g-500" />
                    <span>{slotTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trial info */}
          <div className="space-y-3">
            <h4 className="font-medium text-g-900 dark:text-white">
              What's included in your trial:
            </h4>
            <ul className="space-y-2 text-sm text-g-700 dark:text-g-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-p-500" />
                <span>A full-length {subject} lesson with our tutors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-p-500" />
                <span>Experience our small group learning environment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-p-500" />
                <span>No obligation - just come and see if it's a good fit</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={handleTrialSignup}>Sign Up for Trial</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

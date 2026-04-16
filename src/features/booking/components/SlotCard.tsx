/**
 * Card component for displaying a single holiday class slot
 *
 * Shows slot details, capacity, roster, and book/cancel actions.
 * Uses date-fns for date formatting (per RESEARCH.md standard stack).
 *
 * Trial flow ( Decision 3):
 * - Enrolled students: Book/Cancel buttons
 * - Not enrolled, never trialed: "Sign Up for Trial" -> TrialBookingModal
 * - Not enrolled, already trialed: "Interested?" -> AlreadyTrialedModal
 */

import { useState } from 'react'
import { Clock, MapPin, User, Users } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { formatSydney } from '@/shared/lib/tz-utils'
import { RosterDisplay } from './RosterDisplay'
import { TrialBookingModal } from './TrialBookingModal'
import { AlreadyTrialedModal } from './AlreadyTrialedModal'
import { useTrialStatus } from '../hooks/use-trial-status'
import { useAuth } from '@/features/auth'
import type { HolidayClassSlot } from '../hooks/use-available-slots'

interface SlotCardProps {
  slot: HolidayClassSlot
  isEnrolled: boolean
  onBook: (slotId: string, subject: string) => void
  onCancel: (signupId: string, slotId: string, slotStartTime: string) => void
  isBooking?: boolean
  isCancelling?: boolean
}

/**
 * Render a single holiday class slot card
 *
 * Features:
 * - Date/time formatting with date-fns
 * - Capacity indicator (X/Y filled)
 * - Realtime roster via RosterDisplay
 * - Book button (disabled if full or not enrolled)
 * - Cancel button (if student is signed up)
 * - Trial flow for non-enrolled students (Plan 16-05)
 */
export function SlotCard({
  slot,
  isEnrolled,
  onBook,
  onCancel,
  isBooking = false,
  isCancelling = false,
}: SlotCardProps) {
  const { student } = useAuth()
  const startTime = new Date(slot.start_time)
  const endTime = new Date(slot.end_time)

  // Trial status for non-enrolled students
  const { hasTried, isLoading: isTrialStatusLoading } = useTrialStatus(
    isEnrolled ? '' : slot.subject
  )

  // Modal states
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [showAlreadyTrialedModal, setShowAlreadyTrialedModal] = useState(false)

  const isFull = slot.current_signups >= slot.max_capacity
  const canBook = isEnrolled && !isFull && !slot.is_booked_by_me
  const canCancel = slot.is_booked_by_me && slot.my_signup_id

  // Check 24hr cancellation window
  const hoursUntilSlot = (startTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const withinCancelWindow = hoursUntilSlot >= 24

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        slot.is_booked_by_me && 'ring-2 ring-p-500 dark:ring-p-400'
      )}
    >
      <CardContent className="p-4">
        {/* Header: Subject + Time */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-g-900 dark:text-white">{slot.subject}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-g-600 dark:text-g-500">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {formatSydney(startTime, 'time')} - {formatSydney(endTime, 'time')}
              </span>
            </div>
          </div>

          {/* Capacity badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              isFull
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-g-100 text-g-700 dark:bg-g-800 dark:text-g-400'
            )}
          >
            <Users className="h-3 w-3" />
            {slot.current_signups}/{slot.max_capacity}
          </span>
        </div>

        {/* Details: Tutor + Room */}
        <div className="mb-3 space-y-1 text-sm text-g-600 dark:text-g-500">
          {slot.tutor_name && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{slot.tutor_name}</span>
            </div>
          )}
          {slot.room && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{slot.room}</span>
            </div>
          )}
        </div>

        {/* Roster */}
        <div className="mb-4 border-t border-g-200 pt-3 dark:border-g-700">
          <RosterDisplay slotId={slot.id} maxCapacity={slot.max_capacity} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {slot.is_booked_by_me ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (canCancel && slot.my_signup_id) {
                  onCancel(slot.my_signup_id, slot.id, slot.start_time)
                }
              }}
              disabled={!withinCancelWindow || isCancelling}
              className="flex-1"
            >
              {isCancelling
                ? 'Cancelling...'
                : !withinCancelWindow
                  ? 'Cannot cancel (<24hr)'
                  : 'Cancel Booking'}
            </Button>
          ) : isEnrolled ? (
            <Button
              size="sm"
              onClick={() => onBook(slot.id, slot.subject)}
              disabled={!canBook || isBooking}
              className="flex-1"
            >
              {isBooking ? 'Booking...' : isFull ? 'Full' : 'Book Slot'}
            </Button>
          ) : isTrialStatusLoading ? (
            <Button variant="outline" size="sm" disabled className="flex-1">
              Loading...
            </Button>
          ) : hasTried ? (
            // Already trialed: show "Interested?" -> AlreadyTrialedModal
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlreadyTrialedModal(true)}
              className="flex-1"
            >
              Interested?
            </Button>
          ) : (
            // Never trialed: show "Sign Up for Trial" -> TrialBookingModal
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrialModal(true)}
              className="dark:hover:bg-p-900/20 flex-1 border-p-300 text-p-600 hover:bg-p-50 dark:border-p-700 dark:text-p-400"
            >
              Sign Up for Trial
            </Button>
          )}
        </div>

        {/* Trial Booking Modal (never-trialed students) */}
        <TrialBookingModal
          isOpen={showTrialModal}
          onClose={() => setShowTrialModal(false)}
          subject={slot.subject}
          slotDate={slot.start_time}
          slotTime={`${formatSydney(startTime, 'time')} - ${formatSydney(endTime, 'time')}`}
        />

        {/* Already Trialed Modal */}
        <AlreadyTrialedModal
          isOpen={showAlreadyTrialedModal}
          onClose={() => setShowAlreadyTrialedModal(false)}
          subject={slot.subject}
          studentName={student?.name ?? 'Student'}
          studentId={student?.id ?? ''}
        />
      </CardContent>
    </Card>
  )
}

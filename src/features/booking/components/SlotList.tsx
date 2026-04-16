/**
 * List of holiday class slots grouped by date
 *
 * Renders SlotCards in a responsive grid with date headers.
 */

import { format, isSameDay, parseISO } from 'date-fns'
import { Calendar } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { SlotCard } from './SlotCard'
import type { HolidayClassSlot } from '../hooks/use-available-slots'

interface SlotListProps {
  slots: HolidayClassSlot[]
  isLoading?: boolean
  isEnrolled: (subject: string) => boolean
  onBook: (slotId: string, subject: string) => void
  onCancel: (signupId: string, slotId: string, slotStartTime: string) => void
  bookingSlotId?: string | null
  cancellingSignupId?: string | null
}

/**
 * Group slots by date and render with date headers
 *
 * Features:
 * - Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
 * - Date headers (e.g., "Monday 15 April")
 * - Empty state when no slots available
 * - Loading skeleton
 */
export function SlotList({
  slots,
  isLoading = false,
  isEnrolled,
  onBook,
  onCancel,
  bookingSlotId,
  cancellingSignupId,
}: SlotListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((group) => (
          <div key={group}>
            <Skeleton className="mb-3 h-6 w-40" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((card) => (
                <Skeleton key={card} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-g-300 py-12 dark:border-g-700">
        <Calendar className="mb-3 h-10 w-10 text-g-400 dark:text-g-600" />
        <h3 className="text-lg font-medium text-g-900 dark:text-white">No slots available</h3>
        <p className="mt-1 text-sm text-g-500 dark:text-g-600">
          Check back later for upcoming holiday classes
        </p>
      </div>
    )
  }

  // Group slots by date
  const groupedSlots = slots.reduce<Record<string, HolidayClassSlot[]>>((groups, slot) => {
    const date = format(parseISO(slot.start_time), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(slot)
    return groups
  }, {})

  // Sort dates
  const sortedDates = Object.keys(groupedSlots).sort()

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => {
        const date = parseISO(dateKey)
        const slotsForDate = groupedSlots[dateKey] ?? []

        // Format date header
        const isToday = isSameDay(date, new Date())
        const dateLabel = isToday ? 'Today' : format(date, 'EEEE d MMMM')

        return (
          <div key={dateKey}>
            {/* Date header */}
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-g-900 dark:text-white">
              <Calendar className="h-5 w-5 text-p-500" />
              {dateLabel}
            </h3>

            {/* Slots grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slotsForDate.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isEnrolled={isEnrolled(slot.subject)}
                  onBook={onBook}
                  onCancel={onCancel}
                  isBooking={bookingSlotId === slot.id}
                  isCancelling={cancellingSignupId === slot.my_signup_id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

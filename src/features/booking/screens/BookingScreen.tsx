/**
 * Main booking screen for holiday classes
 *
 * Features:
 * - My Bookings section at top
 * - Subject filter tabs
 * - Date range selector (native input, NOT custom calendar picker per prohibition)
 * - Available slots grouped by date
 */

import { useState, useMemo } from 'react'
import { format, addDays, startOfDay, endOfDay } from 'date-fns'
import { CalendarDays, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { useAvailableSlots } from '../hooks/use-available-slots'
import { useMyBookings } from '../hooks/use-my-bookings'
import type { MyBooking } from '../hooks/use-my-bookings'
import { useBookSlot } from '../hooks/use-book-slot'
import { useCancelBooking } from '../hooks/use-cancel-booking'
import { useStudentSubjects, ALL_SUBJECTS } from '@/features/dashboard/hooks/use-student-subjects'
import { SlotList } from '../components/SlotList'

// Date range presets
const DATE_PRESETS = [
  { label: 'This week', getDates: () => ({ from: new Date(), to: addDays(new Date(), 7) }) },
  {
    label: 'Next week',
    getDates: () => ({ from: addDays(new Date(), 7), to: addDays(new Date(), 14) }),
  },
  { label: 'This month', getDates: () => ({ from: new Date(), to: addDays(new Date(), 30) }) },
] as const

/**
 * Holiday Class Booking Screen
 *
 * Layout:
 * - Header with title
 * - My Bookings section (if any)
 * - Filters row: subject tabs + date range
 * - Available Slots grid grouped by date
 */
export function BookingScreen() {
  // State
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: addDays(new Date(), 14), // Default: 2 weeks
  })

  // Hooks
  const { isEnrolled, enrolled } = useStudentSubjects()
  const bookSlot = useBookSlot()
  const cancelBooking = useCancelBooking()

  // Fetch data
  const {
    data: slots = [],
    isLoading: slotsLoading,
    error: slotsError,
  } = useAvailableSlots({
    ...(selectedSubject && { subject: selectedSubject }),
    dateFrom: startOfDay(dateRange.from),
    dateTo: endOfDay(dateRange.to),
  })

  const { data: myBookings = [], isLoading: bookingsLoading } = useMyBookings()

  // Filter slots by subject if selected
  const filteredSlots = useMemo(() => {
    if (!selectedSubject) return slots
    return slots.filter((slot) => slot.subject === selectedSubject)
  }, [slots, selectedSubject])

  // Handlers
  const handleBook = (slotId: string, subject: string) => {
    bookSlot.mutate({ slotId, subject })
  }

  const handleCancel = (signupId: string, slotId: string, slotStartTime: string) => {
    cancelBooking.mutate({ signupId, slotId, slotStartTime })
  }

  const handleDatePreset = (preset: (typeof DATE_PRESETS)[number]) => {
    setDateRange(preset.getDates())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-g-900 dark:text-white">Holiday Classes</h1>
        <p className="mt-1 text-sm text-g-500 dark:text-g-600">Book your holiday class sessions</p>
      </div>

      {/* My Bookings Section */}
      {(myBookings.length > 0 || bookingsLoading) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">My Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-48 flex-shrink-0 animate-pulse rounded-lg bg-g-100 dark:bg-g-800"
                  />
                ))}
              </div>
            ) : myBookings.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {myBookings.map((booking: MyBooking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancel}
                    isCancelling={cancelBooking.isPending}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Subject tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedSubject === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSubject(null)}
          >
            All Subjects
          </Button>
          {ALL_SUBJECTS.map((subject) => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSubject(subject)}
              className={cn(!enrolled.includes(subject) && 'opacity-50')}
            >
              {subject}
              {!enrolled.includes(subject) && <span className="ml-1 text-xs">(trial)</span>}
            </Button>
          ))}
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-g-500" />
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              onClick={() => handleDatePreset(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {slotsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Failed to load slots. Please try again.
        </div>
      )}

      {/* Available Slots */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-g-900 dark:text-white">
          <CalendarDays className="h-5 w-5 text-p-500" />
          Available Slots
          <span className="text-sm font-normal text-g-500 dark:text-g-600">
            ({format(dateRange.from, 'd MMM')} - {format(dateRange.to, 'd MMM')})
          </span>
        </h2>

        <SlotList
          slots={filteredSlots}
          isLoading={slotsLoading}
          isEnrolled={isEnrolled}
          onBook={handleBook}
          onCancel={handleCancel}
          bookingSlotId={bookSlot.isPending ? bookSlot.variables?.slotId : null}
          cancellingSignupId={cancelBooking.isPending ? cancelBooking.variables?.signupId : null}
        />
      </div>
    </div>
  )
}

// Internal component for My Bookings cards
interface BookingCardProps {
  booking: MyBooking
  onCancel: (signupId: string, slotId: string, slotStartTime: string) => void
  isCancelling: boolean
}

function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const startTime = new Date(booking.start_time)

  return (
    <div className="flex-shrink-0 rounded-lg border border-g-200 bg-card p-3 dark:border-g-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-g-900 dark:text-white">{booking.subject}</p>
          <p className="text-sm text-g-500 dark:text-g-600">
            {format(startTime, 'EEE d MMM, h:mm a')}
          </p>
          {booking.room && <p className="text-xs text-g-400 dark:text-g-700">{booking.room}</p>}
        </div>
        {booking.can_cancel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => onCancel(booking.id, booking.slot_id, booking.start_time)}
            disabled={isCancelling}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

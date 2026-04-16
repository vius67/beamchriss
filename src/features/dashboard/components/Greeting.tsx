// Time-aware greeting component

import { useAuth } from '@/features/auth'

type TimeOfDay = 'morning' | 'afternoon' | 'evening'

/**
 * Get current time of day
 * - Morning: 12am - 11:59am
 * - Afternoon: 12pm - 4:59pm
 * - Evening: 5pm - 11:59pm
 */
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

/**
 * Get greeting text for time of day
 */
function getGreetingText(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'morning':
      return 'Good morning'
    case 'afternoon':
      return 'Good afternoon'
    case 'evening':
      return 'Good evening'
  }
}

/**
 * Greeting component with time-aware message and student name
 *
 * @example
 * <Greeting /> // "Good morning, Andy!"
 */
export function Greeting() {
  const { student } = useAuth()
  const timeOfDay = getTimeOfDay()
  const greeting = getGreetingText(timeOfDay)
  const firstName = student?.name?.split(' ')[0]

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-semibold text-g-800 dark:text-white">
        {greeting}
        {firstName ? `, ${firstName}` : ''}!
      </h1>
      <p className="mt-1 text-sm text-g-500 dark:text-g-600">
        Here's what's happening with your studies
      </p>
    </div>
  )
}

// Main dashboard layout wrapper
// Provides header, greeting, content area, and toast notifications

import { ReactNode } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { Greeting } from './Greeting'
import { Toaster } from '@/shared/components/ui/toaster'

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * Dashboard layout component
 *
 * Provides the structural foundation for all dashboard content:
 * - Sticky header with BEAM branding
 * - Time-aware greeting section
 * - Content area for dashboard cards
 * - Toast notifications
 *
 * Uses #121212 dark background per research findings (reduces eye strain).
 *
 * @example
 * <DashboardLayout>
 *   <HomeworkCard />
 *   <StatsCard />
 * </DashboardLayout>
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        {/* Greeting section */}
        <div className="mb-6 lg:mb-8">
          <Greeting />
        </div>

        {/* Dashboard content */}
        <div className="space-y-6">{children}</div>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

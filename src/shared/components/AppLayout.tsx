// App layout wrapper with sidebar and content area
// Combines Sidebar (desktop) + MobileNav (mobile) + content area

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Greeting } from '@/features/dashboard/components/Greeting'
import { Toaster } from '@/shared/components/ui/toaster'
import { DemoBanner } from '@/shared/components/DemoBanner'

interface AppLayoutProps {
  /**
   * Page content to render in main area
   */
  children: ReactNode

  /**
   * Whether to show the time-aware greeting in the header
   * @default true
   */
  showGreeting?: boolean

  /**
   * Custom title to show instead of greeting (when showGreeting is false)
   */
  title?: string
}

/**
 * AppLayout component
 *
 * Provides the main application shell:
 * - Fixed sidebar on desktop (lg: breakpoint)
 * - Hamburger menu with nav + settings on mobile
 * - Header with greeting/title and overflow menu
 * - Main content area with max-width constraint
 *
 * @example
 * <AppLayout>
 *   <DashboardContent />
 * </AppLayout>
 *
 * <AppLayout showGreeting={false} title="Submissions">
 *   <SubmissionsTable />
 * </AppLayout>
 */
export function AppLayout({ children, showGreeting = true, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        {/* Mobile header only - desktop has no header bar */}
        <header className="sticky top-0 z-40 bg-background lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            {/* Mobile: hamburger nav (left) */}
            <MobileNav />

            {/* Mobile: BEAM logo (center) */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-p-500">
                <span className="text-sm font-bold text-white">B</span>
              </div>
              <span className="font-semibold text-g-900 dark:text-white">BEAM</span>
            </div>

            {/* Mobile spacer for layout symmetry */}
            <div className="w-10" aria-hidden="true" />
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
          <DemoBanner />
          {/* Greeting or title - part of content flow (matches HTML mockup) */}
          {showGreeting ? (
            <div className="mb-7">
              <Greeting />
            </div>
          ) : title ? (
            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-g-800 dark:text-white">{title}</h1>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  )
}

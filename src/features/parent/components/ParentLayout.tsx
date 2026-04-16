// Parent layout shell with parent-specific sidebar
// Separate from student AppLayout and AdminLayout

import { type ReactNode } from 'react'
import { Toaster } from '@/shared/components/ui/toaster'
import { ParentSidebar } from './ParentSidebar'
import { ParentMobileNav } from './ParentMobileNav'
import { ParentChildProvider } from '../context/ParentChildContext'

export function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <ParentChildProvider>
      <div className="min-h-screen bg-background">
        {/* Parent Sidebar - desktop only */}
        <ParentSidebar />

        {/* Main content area - offset by sidebar width on desktop */}
        <div className="lg:pl-64">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 bg-background lg:hidden">
            <div className="flex h-14 items-center justify-between px-4">
              {/* Mobile: hamburger nav (left) */}
              <ParentMobileNav />

              {/* Mobile: BEAM logo (center) */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-p-500">
                  <span className="text-sm font-bold text-white">B</span>
                </div>
                <span className="font-semibold text-g-900 dark:text-white">BEAM Parent</span>
              </div>

              {/* Mobile spacer for layout symmetry */}
              <div className="w-10" aria-hidden="true" />
            </div>
          </header>

          {/* Content */}
          <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>

        <Toaster />
      </div>
    </ParentChildProvider>
  )
}

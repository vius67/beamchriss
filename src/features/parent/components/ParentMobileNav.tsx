// Mobile hamburger navigation for parent screens
// Follows AdminMobileNav pattern with ChildPicker included

import { useState } from 'react'
import { Menu, X, LayoutDashboard, TrendingUp, FileText, BookOpen, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth'
import { ChildPicker } from './ChildPicker'

const parentNavItems = [
  { to: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/parent/performance', label: 'Performance', icon: TrendingUp },
  { to: '/parent/submissions', label: 'Homework', icon: FileText },
  { to: '/parent/past-papers', label: 'Past Papers', icon: BookOpen },
] as const

/**
 * Parent mobile navigation (hamburger menu)
 * Mobile-only, shown below lg: breakpoint
 */
export function ParentMobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname: currentPath } = useLocation()

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-g-600 hover:bg-g-100 dark:text-g-700 dark:hover:bg-g-200"
        aria-label="Open parent menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-g-200 px-4 dark:border-g-200">
          <span className="font-semibold text-g-900 dark:text-white">BEAM Parent</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-g-600 hover:bg-g-100 dark:text-g-700 dark:hover:bg-g-200"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Child picker in mobile drawer */}
        <ChildPicker />

        <nav className="space-y-1 px-3 py-4">
          {parentNavItems.map((item) => {
            const isActive = currentPath === item.to
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => {
                  e.preventDefault()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  navigate({ to: item.to as any })
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-p-100 text-p-700 dark:bg-p-500/20 dark:text-p-500'
                    : 'text-g-600 hover:bg-g-100 hover:text-g-900 dark:text-g-700 dark:hover:bg-g-200 dark:hover:text-white'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-g-200 px-3 py-4 dark:border-g-200">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-err transition-colors hover:bg-err-bg"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}

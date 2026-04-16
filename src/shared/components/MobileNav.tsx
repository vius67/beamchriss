// Mobile navigation with hamburger menu
// Contains BOTH navigation links AND settings (user info, theme toggle, logout)

import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  TrendingUp,
  // CalendarDays, // Hidden until slots are configured
  Moon,
  Sun,
  Monitor,
  LogOut,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth'
import { useTheme } from '@/shared/hooks/use-theme'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/submissions', label: 'Homework', icon: FileText },
  { to: '/past-papers', label: 'Past Papers', icon: BookOpen },
  { to: '/worksheets', label: 'Worksheets', icon: ClipboardList },
  { to: '/performance', label: 'Performance', icon: TrendingUp },
] as const

/**
 * Get first name from full name
 */
/**
 * MobileNav component
 *
 * Mobile hamburger that contains BOTH navigation AND settings:
 * - Slide-out panel from left
 * - Same nav items as Sidebar
 * - Settings section: user info, theme toggle, logout
 * - Backdrop click to close
 *
 * @example
 * <MobileNav />
 */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-g-600 hover:bg-g-100 dark:text-g-700 dark:hover:bg-g-200"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Slide-out menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-g-200 px-4 dark:border-g-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-p-500">
                  <span className="text-lg font-bold text-white">B</span>
                </div>
                <span className="font-semibold text-g-900 dark:text-white">BEAM Portal</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-g-600 hover:bg-g-100 dark:text-g-700 dark:hover:bg-g-200"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="px-3 py-4" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-p-100 text-p-700 dark:bg-p-700/50 dark:text-p-500'
                        : 'text-g-600 hover:bg-g-100 hover:text-g-900 dark:text-g-700 dark:hover:bg-g-200 dark:hover:text-white'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Divider */}
            <div className="mx-4 border-t border-g-200 dark:border-g-200" />

            {/* Settings section */}
            <div className="px-3 py-4">
              {/* User section - no name displayed for privacy */}

              {/* Theme selector */}
              <div className="mb-2 px-3">
                <p className="mb-2 text-xs font-medium uppercase text-g-500 dark:text-g-600">
                  Theme
                </p>
                <div className="flex gap-1">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        'flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs',
                        'transition-colors hover:bg-g-100 dark:hover:bg-g-200',
                        theme === value && 'bg-p-50 text-p-700 dark:bg-p-700/50 dark:text-p-500'
                      )}
                      aria-pressed={theme === value}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-err hover:bg-err-bg"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

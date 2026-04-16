// Fixed left sidebar for desktop navigation
// Shows BEAM logo, navigation items, and user section with logout

import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  TrendingUp,
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

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
]

/**
 * Sidebar navigation component
 *
 * Desktop-only fixed left sidebar with:
 * - BEAM logo at top
 * - 6 navigation items with icons
 * - Active state highlighting with bg-p-100
 * - User section at bottom (info, theme toggle, logout)
 * - Hidden on mobile (lg: breakpoint)
 *
 * Uses new p-* and g-* color utilities from Wave 1.
 *
 * @example
 * <Sidebar />
 */
export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-g-200 lg:bg-card lg:dark:border-g-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-g-200 px-6 dark:border-g-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-p-500">
          <span className="text-lg font-bold text-white">B</span>
        </div>
        <span className="font-semibold text-g-900 dark:text-white">BEAM Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-p-100 text-p-700 dark:bg-p-500/20 dark:text-p-500'
                  : 'text-g-600 hover:bg-g-100 hover:text-g-900 dark:text-g-700 dark:hover:bg-g-200 dark:hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-g-200 px-3 py-4 dark:border-g-200">
        {/* User info */}
        {/* User section - no name displayed for privacy */}

        {/* Theme selector */}
        <div className="mb-3 px-3">
          <p className="mb-2 text-xs font-medium uppercase text-g-500 dark:text-g-600">Theme</p>
          <div className="flex gap-1">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs',
                  'text-g-600 transition-colors hover:bg-g-100 dark:text-g-700 dark:hover:bg-g-200 dark:hover:text-white',
                  theme === value && 'bg-p-50 text-p-700 dark:bg-p-500/20 dark:text-p-500'
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
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-err transition-colors hover:bg-err-bg"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

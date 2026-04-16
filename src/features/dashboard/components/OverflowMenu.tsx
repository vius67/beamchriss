// Overflow menu component with user info, theme toggle, and logout
// Implements "Single Screen + Overflow Menu" navigation pattern

import { useState, useRef, useEffect } from 'react'
import { Menu, Moon, Sun, Monitor, LogOut } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useTheme } from '@/shared/hooks/use-theme'
import { useAuth } from '@/features/auth'
import { cn } from '@/shared/lib/cn'

/**
 * OverflowMenu component
 *
 * Provides:
 * - User profile info (name, year level)
 * - Theme selector (light/dark/system)
 * - Sign out button
 *
 * Accessibility:
 * - Closes on Escape key
 * - Closes when clicking outside
 * - ARIA attributes for menu semantics
 *
 * @example
 * <OverflowMenu />
 */
export function OverflowMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="h-10 w-10"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-lg border border-g-200 bg-card shadow-lg"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info */}
          {/* User section - no name displayed for privacy */}

          {/* Theme selector */}
          <div className="border-b border-g-200 p-2">
            <p className="px-2 py-1 text-xs font-medium uppercase text-g-500">Theme</p>
            <div className="flex gap-1">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs',
                    'transition-colors hover:bg-g-100',
                    theme === value &&
                      'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  )}
                  role="menuitemradio"
                  aria-checked={theme === value}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-g-700 transition-colors hover:bg-g-100"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

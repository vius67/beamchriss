import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from '../hooks/use-theme'
import type { Theme } from '../lib/theme'

/**
 * Theme toggle button that cycles through light -> dark -> system.
 *
 * Uses ghost button variant for subtle appearance.
 * Shows current mode with accessible icon and label.
 *
 * @example
 * <ThemeToggle />
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    }
    setTheme(nextTheme[theme])
  }

  // Icon and label based on current theme
  const themeConfig: Record<Theme, { icon: React.ReactNode; label: string; ariaLabel: string }> = {
    light: {
      icon: <Sun className="h-5 w-5" />,
      label: 'Light',
      ariaLabel: 'Switch to dark mode',
    },
    dark: {
      icon: <Moon className="h-5 w-5" />,
      label: 'Dark',
      ariaLabel: 'Switch to system mode',
    },
    system: {
      icon: <Monitor className="h-5 w-5" />,
      label: 'System',
      ariaLabel: 'Switch to light mode',
    },
  }

  const { icon, ariaLabel } = themeConfig[theme]

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {icon}
    </Button>
  )
}

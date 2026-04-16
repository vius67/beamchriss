// Login form component
// BEAM code input with auto-formatting + collapsible Staff Login section

import { useState, FormEvent, ChangeEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * LoginForm component
 *
 * Features:
 * - Auto-formats BEAM code as user types (BEAM-XXXX-XXXX)
 * - Shows loading state during authentication
 * - Displays user-friendly error messages
 * - BEAM purple themed styling
 * - Collapsible "Staff Login" section for admin email/password login
 */
export function LoginForm() {
  const { login, loginAsAdmin, isLoading, error, clearError } = useAuth()
  const [code, setCode] = useState('')

  // Staff login state
  const [showStaffLogin, setShowStaffLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [staffError, setStaffError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length < 14) return

    await login(code)
    // Navigation handled by auth state change in App.tsx
  }

  const handleStaffSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStaffError(null)

    if (!email.trim() || !password.trim()) {
      setStaffError('Please enter your email and password.')
      return
    }

    const result = await loginAsAdmin(email.trim(), password)
    if (!result.success) {
      setStaffError(result.error ?? 'Login failed.')
    }
    // Navigation handled by auth state change in App.tsx
  }

  /**
   * Format code as user types
   * Auto-inserts BEAM- prefix and hyphen separators
   */
  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    clearError()

    let value = e.target.value.toUpperCase()

    // Remove anything that's not alphanumeric or hyphen
    value = value.replace(/[^A-Z0-9-]/g, '')

    // If user deleted BEAM- prefix, let them clear it
    if (value === '' || value === 'B' || value === 'BE' || value === 'BEA') {
      setCode(value)
      return
    }

    // Auto-add BEAM- prefix if user starts typing without it
    if (value.length >= 4 && !value.startsWith('BEAM')) {
      // User started typing the code part directly
      value = 'BEAM-' + value.replace(/-/g, '')
    }

    // Remove all hyphens to reformat
    const withoutHyphens = value.replace(/-/g, '')

    // Reformat as BEAM-XXXX-XXXX
    let formatted = ''
    for (let i = 0; i < withoutHyphens.length && formatted.length < 14; i++) {
      // Add hyphen after BEAM (position 4)
      if (i === 4 && formatted.length === 4) {
        formatted += '-'
      }
      // Add hyphen after first code segment (position 8)
      if (i === 8 && formatted.length === 9) {
        formatted += '-'
      }
      formatted += withoutHyphens[i]
    }

    setCode(formatted)
  }

  const isValidLength = code.length === 14

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">BEAM Portal</h1>
          <p className="mt-2 text-g-600 dark:text-g-700">Enter your BEAM code to continue</p>
        </div>

        {/* Student Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="beam-code" className="sr-only">
              BEAM Code
            </label>
            <input
              id="beam-code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="BEAM-XXXX-XXXX"
              className="w-full rounded-lg border border-g-300 px-4 py-3 text-center font-mono text-2xl tracking-wider text-g-900 focus:border-transparent focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-g-300 dark:bg-g-100 dark:text-white"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={isLoading}
              maxLength={14}
            />
          </div>

          {/* Error message (student login) */}
          {error && (
            <div
              className="rounded-md bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !isValidLength}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Help text */}
        <p className="text-center text-sm text-g-500">
          Your BEAM code was sent to your parent&apos;s email.
          <br />
          Contact your tutor if you need help.
        </p>

        {/* Staff Login divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-g-200 dark:border-g-200" />
          </div>
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={() => {
                setShowStaffLogin(!showStaffLogin)
                setStaffError(null)
              }}
              className="bg-background px-3 text-sm text-g-400 transition-colors hover:text-g-600 dark:text-g-600 dark:hover:text-g-500"
            >
              Staff / Parent Login
            </button>
          </div>
        </div>

        {/* Staff Login form (collapsible) */}
        {showStaffLogin && (
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <div className="space-y-3 rounded-lg border border-g-200 p-4 dark:border-g-200">
              <div>
                <label
                  htmlFor="staff-email"
                  className="mb-1 block text-sm font-medium text-g-700 dark:text-g-600"
                >
                  Email
                </label>
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setStaffError(null)
                  }}
                  placeholder="Email"
                  className="w-full rounded-lg border border-g-300 px-4 py-2.5 text-g-900 focus:border-transparent focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-g-300 dark:bg-g-100 dark:text-white"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="staff-password"
                  className="mb-1 block text-sm font-medium text-g-700 dark:text-g-600"
                >
                  Password
                </label>
                <input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setStaffError(null)
                  }}
                  placeholder="Password"
                  className="w-full rounded-lg border border-g-300 px-4 py-2.5 text-g-900 focus:border-transparent focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-g-300 dark:bg-g-100 dark:text-white"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              {/* Staff login error */}
              {staffError && (
                <div
                  className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  role="alert"
                >
                  {staffError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-p-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-p-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Staff Sign In'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

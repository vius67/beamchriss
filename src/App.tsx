// Main App component
// Routes between login and authenticated app based on auth state

import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { useAuth, LoginForm } from '@/features/auth'
import { AccountPausedScreen } from '@/features/auth/screens/AccountPausedScreen'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { WelcomeModal } from '@/shared/components/WelcomeModal'
import { setUserContext, clearUserContext } from '@/shared/lib/sentry'
import { router } from './routes'

const ParentRoutes = lazy(() =>
  import('./parent-routes').then((m) => ({
    default: () => <RouterProvider router={m.parentRouter} key="parent" />,
  }))
)

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 animate-spin text-p-500"
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
        <p className="mt-4 text-g-600">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const {
    isAuthenticated,
    isLoading,
    role,
    student,
    parent,
    error,
    clearError,
  } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (student && role === 'student') {
      const key = `beam-onboarded-${student.id}`
      if (!localStorage.getItem(key)) {
        setShowWelcome(true)
      }
    }
  }, [student, role])

  const handleWelcomeComplete = useCallback(() => {
    if (student) {
      localStorage.setItem(`beam-onboarded-${student.id}`, 'true')
    }
    setShowWelcome(false)
  }, [student])

  useEffect(() => {
    if (student) {
      const yearLevel = student.year_level ?? undefined
      setUserContext(student.id, yearLevel)
    } else if (parent) {
      setUserContext(parent.id, undefined)
    } else {
      clearUserContext()
    }
  }, [student, parent])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated && error === 'account_paused') {
    return <AccountPausedScreen onBack={clearError} />
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  if (role === 'parent') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <ParentRoutes />
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      {showWelcome && student && (
        <WelcomeModal studentName={student.name} onComplete={handleWelcomeComplete} />
      )}
      <RouterProvider router={router} key="student" />
    </ErrorBoundary>
  )
}

export default App

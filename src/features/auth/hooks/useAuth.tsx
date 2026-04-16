// React Context-based authentication state management
// Provides isAuthenticated, role, student, admin, login, loginAsAdmin, logout - shared across all components

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase-client'
import {
  loginWithBeamCode,
  loginWithEmailPassword,
  identifyCurrentUser,
  logout,
  impersonateStudent as impersonateStudentService,
  exitImpersonation as exitImpersonationService,
  isImpersonating as isImpersonatingCheck,
} from '../services/auth-service'
import type { AuthState, AuthResult, Student, AdminUser, ParentUser } from '../types'

/**
 * Context value type - includes state and actions
 */
interface AuthContextValue extends AuthState {
  login: (code: string) => Promise<AuthResult>
  loginAsAdmin: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  clearError: () => void
  impersonateStudent: (portalCode: string) => Promise<AuthResult>
  exitImpersonation: () => Promise<
    { ok: true } | { ok: false; reason: 'session_expired' | 'no_saved_session' }
  >
  parent: ParentUser | null
}

/**
 * Auth context - null means not within provider
 */
const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provider component that manages shared auth state
 *
 * Features:
 * - Checks initial session on mount
 * - Listens for auth state changes
 * - Provides login/loginAsAdmin/logout handlers
 * - Session persists across browser refresh (7-day expiry)
 * - Single source of truth for all components
 * - Supports both student (BEAM code) and admin (email/password) roles
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    role: null,
    student: null,
    admin: null,
    parent: null,
    error: null,
    isImpersonating: false,
  })

  // Check session on mount and listen for changes
  useEffect(() => {
    let mounted = true

    // Check initial session - uses identifyCurrentUser for atomic role detection
    const checkSession = async () => {
      const identity = await identifyCurrentUser()
      if (mounted) {
        setState({
          isAuthenticated: identity.role !== null,
          isLoading: false,
          role: identity.role,
          student: identity.student,
          admin: identity.admin,
          parent: identity.parent,
          error: null,
          isImpersonating: isImpersonatingCheck(),
        })
      }
    }

    checkSession()

    // Listen for auth changes (login, logout, token refresh)
    // IMPORTANT: Do NOT await async operations directly in onAuthStateChange callback.
    // Supabase holds a Web Lock during the callback, and calling getSession() (via
    // identifyCurrentUser()) tries to acquire the same lock, causing a deadlock.
    // See: https://github.com/supabase/supabase-js/issues/762
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session) {
        // Flush all cached queries so no stale data from the previous session
        // leaks into the login screen or into a subsequent session.
        queryClient.clear()
        setState({
          isAuthenticated: false,
          isLoading: false,
          role: null,
          student: null,
          admin: null,
          parent: null,
          error: null,
          isImpersonating: false,
        })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Defer async operations using setTimeout to release the Web Lock first
        // IMPORTANT: Do NOT reset auth state to unauthenticated here - identifyCurrentUser
        // is atomic and will return full identity. Avoids login flash during token refresh.
        setTimeout(async () => {
          if (!mounted) return
          const identity = await identifyCurrentUser()
          if (mounted) {
            setState({
              isAuthenticated: identity.role !== null,
              isLoading: false,
              role: identity.role,
              student: identity.student,
              admin: identity.admin,
              parent: identity.parent,
              error: null,
              isImpersonating: isImpersonatingCheck(),
            })
          }
        }, 0)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  // Liveness probe — detect deactivated account
  // get_current_student_id() returns NULL for inactive students after mig-162
  useEffect(() => {
    if (state.role !== 'student') return

    let mounted = true

    const checkLiveness = async () => {
      if (!mounted || state.role !== 'student') return
      try {
        const { data } = await supabase.rpc('get_current_student_id')
        if (mounted && data === null && state.role === 'student') {
          console.log('[useAuth] liveness probe: student deactivated, signing out')
          await supabase.auth.signOut()
        }
      } catch {
        // Network error — don't sign out on transient failures
      }
    }

    const intervalId = setInterval(checkLiveness, 60_000)
    window.addEventListener('focus', checkLiveness)

    return () => {
      mounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', checkLiveness)
    }
  }, [state.role])

  /**
   * Login with BEAM code (student login)
   * Updates state based on result
   */
  const login = useCallback(async (code: string): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const result = await loginWithBeamCode(code)

    if (result.success && result.student) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        role: 'student',
        student: result.student as Student,
        admin: null,
        parent: null,
        error: null,
        isImpersonating: false,
      })
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Login failed',
      }))
    }

    return result
  }, [])

  /**
   * Login with email and password (admin or parent login)
   * Auto-detects role via identifyCurrentUser inside loginWithEmailPassword
   */
  const loginAsAdmin = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const result = await loginWithEmailPassword(email, password)

    if (result.success && result.admin) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        role: 'admin',
        student: null,
        admin: result.admin as AdminUser,
        parent: null,
        error: null,
        isImpersonating: false,
      })
    } else if (result.success && result.parent) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        role: 'parent',
        student: null,
        admin: null,
        parent: result.parent as ParentUser,
        error: null,
        isImpersonating: false,
      })
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Login failed',
      }))
    }

    return result
  }, [])

  /**
   * Logout current user
   * Clears session and redirects to login
   */
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    await logout()
    setState({
      isAuthenticated: false,
      isLoading: false,
      role: null,
      student: null,
      admin: null,
      parent: null,
      error: null,
      isImpersonating: false,
    })
  }, [])

  /**
   * Impersonate a student (admin only)
   * Saves admin session and switches to student view
   */
  const impersonateStudent = useCallback(async (portalCode: string): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const result = await impersonateStudentService(portalCode)

    if (result.success && result.student) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        role: 'student',
        student: result.student as Student,
        admin: null,
        parent: null,
        error: null,
        isImpersonating: true,
      })
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Impersonation failed',
      }))
    }

    return result
  }, [])

  /**
   * Exit impersonation and restore admin session.
   *
   * Returns a structured result so callers can router-navigate instead of
   * forcing a full page reload (H18):
   *  - { ok: true } → admin session restored, caller navigates to /admin
   *  - { ok: false, reason: 'session_expired' } → caller shows toast + routes
   *    to /login
   *  - { ok: false, reason: 'no_saved_session' } → caller treats as full logout
   */
  const exitImpersonation = useCallback(async (): Promise<
    { ok: true } | { ok: false; reason: 'session_expired' | 'no_saved_session' }
  > => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const result = await exitImpersonationService()

    if (result.ok) {
      // onAuthStateChange will fire TOKEN_REFRESHED (or SIGNED_IN) and
      // identifyCurrentUser will re-detect the admin role. isImpersonating()
      // returns false because sessionStorage was cleared.
      return { ok: true }
    }

    // Any non-ok path means we no longer have an admin session — clear state
    // without forcing a reload. The caller is responsible for navigating.
    setState({
      isAuthenticated: false,
      isLoading: false,
      role: null,
      student: null,
      admin: null,
      parent: null,
      error: null,
      isImpersonating: false,
    })
    return result
  }, [])

  /**
   * Clear any displayed error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    loginAsAdmin,
    logout: signOut,
    clearError,
    impersonateStudent,
    exitImpersonation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook for accessing authentication state
 *
 * Must be used within AuthProvider - throws if not
 * All components using this hook share the same auth state
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Parent route configuration using TanStack Router
// Completely separate from student routes.tsx and admin-routes.tsx
// Selected by App.tsx when role === 'parent'

import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  Navigate,
} from '@tanstack/react-router'
import { ParentLayout } from '@/features/parent/components/ParentLayout'
import { ParentDashboardScreen } from '@/features/parent/screens/ParentDashboardScreen'
import { ParentPerformanceScreen } from '@/features/parent/screens/ParentPerformanceScreen'
import { ParentSubmissionsScreen } from '@/features/parent/screens/ParentSubmissionsScreen'
import { ParentPastPapersScreen } from '@/features/parent/screens/ParentPastPapersScreen'

// Simple redirect component for parent router.
// Uses TanStack Router Navigate (not window.location.replace) so the parent
// router re-mounts without a full page reload — required for clean
// impersonation-exit flow (17-B-01, H18, hidden-landmines #2).
function ParentIndexRedirect() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Navigate to={'/parent/dashboard' as any} replace />
}

// =============================================================================
// Parent Route Definitions
// =============================================================================

// Parent root route with ParentLayout wrapper
const parentRootRoute = createRootRoute({
  component: () => (
    <ParentLayout>
      <Outlet />
    </ParentLayout>
  ),
})

// Index redirect to /parent/dashboard
const parentIndexRoute = createRoute({
  getParentRoute: () => parentRootRoute,
  path: '/',
  component: ParentIndexRedirect,
})

// /parent/dashboard - Dashboard screen
const parentDashboardRoute = createRoute({
  getParentRoute: () => parentRootRoute,
  path: '/parent/dashboard',
  component: ParentDashboardScreen,
})

// /parent/performance - Performance screen
const parentPerformanceRoute = createRoute({
  getParentRoute: () => parentRootRoute,
  path: '/parent/performance',
  component: ParentPerformanceScreen,
})

// /parent/submissions - Homework submissions screen
const parentSubmissionsRoute = createRoute({
  getParentRoute: () => parentRootRoute,
  path: '/parent/submissions',
  component: ParentSubmissionsScreen,
})

// /parent/past-papers - Past papers screen
const parentPastPapersRoute = createRoute({
  getParentRoute: () => parentRootRoute,
  path: '/parent/past-papers',
  component: ParentPastPapersScreen,
})

// =============================================================================
// Parent Route Tree and Router
// =============================================================================

const parentRouteTree = parentRootRoute.addChildren([
  parentIndexRoute,
  parentDashboardRoute,
  parentPerformanceRoute,
  parentSubmissionsRoute,
  parentPastPapersRoute,
])

export const parentRouter = createRouter({ routeTree: parentRouteTree })

// Note: We intentionally do NOT add a module augmentation `declare module '@tanstack/react-router'`
// here because the student routes.tsx already declares the Register interface for the student router.
// The parent router is used directly without type registration since parent routes are simpler.

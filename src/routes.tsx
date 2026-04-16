// Route configuration using TanStack Router
// Defines routes for all 6 screens with placeholder components

import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  Navigate,
} from '@tanstack/react-router'
import { AppLayout } from '@/shared/components/AppLayout'
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen'
import { SubmissionsScreen } from '@/features/submissions'
import { PastPapersScreen } from '@/features/past-papers'
import { PerformanceScreen } from '@/features/performance'
import { WorksheetsScreen } from '@/features/worksheets'
import { BookingScreen } from '@/features/booking'

// =============================================================================
// Route Definitions
// =============================================================================

// Root route with AppLayout wrapper
const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})

// Dashboard route (main landing page)
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardScreen,
})

// Submissions route (history table)
const submissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/submissions',
  component: SubmissionsScreen,
})

// Past Papers route (upload interface)
const pastPapersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/past-papers',
  component: PastPapersScreen,
})

// Performance route (score trends)
const performanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/performance',
  component: PerformanceScreen,
})

// Worksheets route (practice worksheets)
const worksheetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/worksheets',
  component: WorksheetsScreen,
})

// Booking route (holiday class booking)
const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/booking',
  component: BookingScreen,
})

// Index redirect to dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" />,
})

// =============================================================================
// Route Tree and Router
// =============================================================================

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  submissionsRoute,
  pastPapersRoute,
  worksheetsRoute,
  performanceRoute,
  bookingRoute,
])

export const router = createRouter({ routeTree })

// Type declaration for TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

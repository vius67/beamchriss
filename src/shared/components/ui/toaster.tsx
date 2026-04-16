import { useToast } from '../../hooks/use-toast'
import { Toast } from './toast'

/**
 * Toaster component - renders active toast notifications.
 *
 * Positioning:
 * - Desktop: bottom-right
 * - Mobile: bottom-center
 *
 * @example
 * // Add to your App component root
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <Toaster />
 *     </>
 *   )
 * }
 */
export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="pointer-events-none fixed bottom-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:flex-col sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full animate-slide-in-right sm:max-w-[420px]"
        >
          <Toast toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}

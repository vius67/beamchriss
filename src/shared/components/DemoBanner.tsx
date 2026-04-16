import { useIsDemo } from '@/shared/hooks/use-is-demo'

export function DemoBanner() {
  const isDemo = useIsDemo()
  if (!isDemo) return null

  return (
    <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
      Demo Mode — You're exploring BEAM Academy. Some features are view-only.
    </div>
  )
}

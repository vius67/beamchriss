// Account paused screen — shown when inactive student attempts login
// Phase 23: friendly UX for paused accounts

import { Button } from '@/shared/components/ui/button'

interface AccountPausedScreenProps {
  onBack?: () => void
}

export function AccountPausedScreen({ onBack }: AccountPausedScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Amber warning icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            className="h-8 w-8 text-amber-600 dark:text-amber-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Account Paused</h1>
          <p className="text-muted-foreground">
            Your account is currently paused. Your work is safe — nothing has been lost.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-left">
          <p className="text-sm text-muted-foreground">
            To reactivate your account, please message your tutor or contact us at{' '}
            <a
              href="mailto:admin@beamacademy.info"
              className="font-medium text-p-500 hover:underline"
            >
              admin@beamacademy.info
            </a>
          </p>
        </div>

        {onBack && (
          <Button variant="outline" onClick={onBack} className="w-full">
            Back to login
          </Button>
        )}
      </div>
    </div>
  )
}

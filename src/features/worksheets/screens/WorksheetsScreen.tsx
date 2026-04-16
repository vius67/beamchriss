import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  PracticeOpportunities,
  StepByStepFinder,
  WorksheetHistory,
  useWeaknessDetection,
  type WeaknessOpportunity,
} from '@/features/worksheets'
import { useIsDemo } from '@/shared/hooks/use-is-demo'

/**
 * Worksheets Screen
 *
 * Layout:
 * - Header with "Find Worksheet" button
 * - Two-column layout on desktop:
 *   - Left (2/3): Worksheet history with download buttons
 *   - Right (1/3): Extra practice + info card
 * - StepByStepFinder dialog for instant lookup of pre-made worksheets
 *
 * Supports navigation state from Dashboard (preSelectedSkill, openRequestDialog)
 */
export function WorksheetsScreen() {
  const isDemo = useIsDemo()
  const location = useLocation()
  const navState =
    (location.state as {
      preSelectedSkill?: WeaknessOpportunity
      openRequestDialog?: boolean
    }) || {}

  const [showFinderDialog, setShowFinderDialog] = useState(navState.openRequestDialog ?? false)
  const [initialQuery, setInitialQuery] = useState(navState.preSelectedSkill?.skillName ?? '')
  const { hasPracticeOpportunities } = useWeaknessDetection()

  // Clear navigation state after consuming it
  useEffect(() => {
    if (navState.openRequestDialog || navState.preSelectedSkill) {
      window.history.replaceState({}, '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRequestFromSuggestion = (skill: WeaknessOpportunity) => {
    setInitialQuery(skill.skillName)
    setShowFinderDialog(true)
  }

  const handleCloseDialog = () => {
    setShowFinderDialog(false)
    setInitialQuery('')
  }

  const handleOpenDialog = () => {
    setInitialQuery('')
    setShowFinderDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Practice Worksheets</h1>
          <p className="mt-1 text-g-500 dark:text-g-400">
            Custom practice to strengthen your skills
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          disabled={isDemo}
          title={isDemo ? 'Disabled in demo mode' : undefined}
        >
          <Search className="mr-2 h-4 w-4" />
          Find Worksheet
        </Button>
      </div>

      {/* Two column layout on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content: History */}
        <div className="lg:col-span-2">
          <WorksheetHistory limit={10} />
        </div>

        {/* Sidebar: Suggestions */}
        <div className="space-y-6">
          {hasPracticeOpportunities && (
            <PracticeOpportunities onRequestPractice={handleRequestFromSuggestion} />
          )}
        </div>
      </div>

      {/* Finder Dialog */}
      <Dialog open={showFinderDialog} onOpenChange={setShowFinderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find a Worksheet</DialogTitle>
            <DialogDescription className="sr-only">
              Search for a pre-made worksheet by topic.
            </DialogDescription>
          </DialogHeader>
          <StepByStepFinder initialQuery={initialQuery} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

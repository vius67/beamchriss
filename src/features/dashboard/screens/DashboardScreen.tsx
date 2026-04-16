import { useNavigate } from '@tanstack/react-router'
import { StatsBar } from '../components/StatsBar'
import { ProgressChart } from '../components/ProgressChart'
import { AssignmentGrid } from '../components/AssignmentGrid'
import { RecentSubmissions } from '../components/RecentSubmissions'
import { ClassScheduleCard } from '../components/ClassScheduleCard'
import { MilestoneToast } from '../components/MilestoneToast'
import {
  PracticeOpportunities,
  useShouldSuggestWorksheet,
  type WeaknessOpportunity,
} from '@/features/worksheets'

/**
 * Complete Dashboard screen per HTML mockup
 *
 * Layout (matches beam-portal-refined.html):
 * - Stats bar (top) - quick glance at counts
 * - Progress chart - score trend over time (HERO)
 * - Extra practice (if weaknesses detected) - passive suggestion
 * - Assignment cards grid - pending assignments with Submit buttons
 * - Recent submissions - history with status badges
 *
 * Note: NextTaskCard removed to match HTML mockup.
 * Upload is accessed via individual assignment Submit buttons.
 *
 * Per 02.1-DESIGN-SPEC.md:
 * - First thing users see - must be compelling and functional
 * 
 *
 * 
 * - Passive "Extra practice" card when weaknesses detected
 * - Asset-framed language (never deficit)
 * - Links to /worksheets for full request flow
 */
export function DashboardScreen() {
  const navigate = useNavigate()
  const { shouldSuggest } = useShouldSuggestWorksheet()

  const handleRequestPractice = (skill: WeaknessOpportunity) => {
    // Navigate to worksheets with pre-selected skill
    // Use type assertion for custom navigation state (TanStack Router doesn't type state)
    navigate({
      to: '/worksheets',
      state: {
        preSelectedSkill: skill,
        openRequestDialog: true,
      } as unknown as Record<string, unknown>,
    })
  }

  return (
    <>
      {/* Milestone celebration watcher (invisible) */}
      <MilestoneToast />

      {/* Stats bar */}
      <section aria-label="Your stats">
        <StatsBar />
      </section>

      {/* Progress chart - HERO section */}
      <section className="mt-6" aria-label="Your progress">
        <ProgressChart />
      </section>

      {/* Extra practice - passive suggestion when weaknesses detected */}
      {shouldSuggest && (
        <section className="mt-6" aria-label="Extra practice">
          <PracticeOpportunities onRequestPractice={handleRequestPractice} className="max-w-md" />
        </section>
      )}

      {/* Assignment grid */}
      <section className="mt-6" aria-label="Your assignments">
        <AssignmentGrid />
      </section>

      {/* Recent homework */}
      <section className="mt-6" aria-label="Recent homework">
        <RecentSubmissions />
      </section>

      {/* Class schedule with tutor names */}
      <section className="mt-6" aria-label="Your classes">
        <ClassScheduleCard />
      </section>
    </>
  )
}

import { NextTaskCard } from './NextTaskCard'
import { StatsBar } from './StatsBar'
import { AssignmentList } from './AssignmentList'
import { ProgressCard } from './ProgressCard'
import { MilestoneToast } from './MilestoneToast'

/**
 * Complete Dashboard composition
 * 
 * - Single scrollable page with everything on one screen
 * - Mobile-first responsive design (87% mobile usage)
 * - Zero-click philosophy: most important action visible immediately
 *
 * Layout:
 * Mobile: Single column, cards stacked vertically
 * Desktop (lg+): Next task full width, then 2:1 column split
 */
export function Dashboard() {
  return (
    <>
      {/* Milestone celebration watcher (renders nothing) */}
      <MilestoneToast />

      {/* Stats bar - quick glance at counts */}
      <section aria-label="Your stats">
        <StatsBar />
      </section>

      {/* Next Task - the "One Thing" hero card
          This is above the fold on all devices */}
      <section className="mt-6" aria-label="Next task">
        <NextTaskCard />
      </section>

      {/* Two-column layout on larger screens */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* More assignments - takes 2 columns */}
        <section className="lg:col-span-2" aria-label="More assignments">
          <AssignmentList skipFirst={1} limit={5} showHeader={true} />
        </section>

        {/* Progress card - sidebar on desktop */}
        <section className="lg:col-span-1" aria-label="Your progress">
          <ProgressCard />
        </section>
      </div>
    </>
  )
}

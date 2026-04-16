// Recharts RadarChart wrapper for topic-level mastery overview.
// Shows 3-8 radar spokes when ≥3 topics have data, falls back to a
// topic-qualified horizontal bar list when 1-2 topics have data, or a
// "complete more assignments" message when data is too sparse. Colors
// come from the CSS primary token for dark-mode support. See 17-A-01
// audit C4/C8.

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useRadarChartData } from '../hooks/use-radar-chart-data'

interface MasteryRadarChartProps {
  subject: string
}

/** Stroke/fill color for the radar polygon — uses the Tailwind primary token so dark mode works */
const MASTERY_STROKE = 'hsl(var(--primary))'

/**
 * Custom tooltip for the radar chart
 */
function RadarTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { topic: string; mastery: number } }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-sm"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      <span style={{ color: 'hsl(var(--foreground))' }}>
        {point.topic}: {point.mastery}% mastery
      </span>
    </div>
  )
}

/**
 * Radar/spider chart showing topic-level mastery overview for a subject.
 *
 * - 3-8 spokes, one per topic
 * - BEAM purple fill with 20% opacity
 * - Fallback message when fewer than 3 topics have data
 * - Loading skeleton while data fetches
 * - Dark mode compatible via CSS variables
 *
 * NOTE: Not yet integrated into PerformanceScreen (that's Plan 05)
 */
export function MasteryRadarChart({ subject }: MasteryRadarChartProps) {
  const { data, isLoading } = useRadarChartData(subject)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Strengths Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height: 320 }}>
          <Skeleton className="h-52 w-52 rounded-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Strengths Overview</CardTitle>
        </CardHeader>
        <CardContent
          className="flex flex-col items-center justify-center gap-3"
          style={{ height: 320 }}
        >
          <BarChart3 className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="max-w-[240px] text-center text-sm text-muted-foreground">
            Complete a few more assignments to see your strengths overview
          </p>
        </CardContent>
      </Card>
    )
  }

  // Fallback: 1-2 topics only → render a topic-qualified bar list instead
  // of misleading subtopic-as-spoke radar (audit C4).
  if (data.fallbackType === 'bar') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Strengths Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {data.points.map((point) => (
              <li key={point.qualifiedLabel} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{point.qualifiedLabel}</span>
                  <span className="tabular-nums text-muted-foreground">{point.mastery}%</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, point.mastery))}%`,
                      backgroundColor: MASTERY_STROKE,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }

  // ≥3 topics → standard radar
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Strengths Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={data.points} outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="topic"
              tick={{
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))',
              }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="mastery"
              stroke={MASTERY_STROKE}
              fill={MASTERY_STROKE}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip content={<RadarTooltipContent />} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

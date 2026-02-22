import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

interface VolumeChartProps {
  data: { week: string; volume: number }[]
  className?: string
  /** Weight unit for axis/tooltip (e.g. "lbs", "kg"). */
  unit?: string
  /** 'week' = one point per week (label "Week of M/D"); 'day' = one point per day (label "M/D"). */
  bucket?: 'week' | 'day'
}

/** Parse YYYY-MM-DD as local date. */
function parseLocalDate(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatBucketLabel(str: string, bucket: 'week' | 'day') {
  const date = parseLocalDate(str)
  const mdy = `${date.getMonth() + 1}/${date.getDate()}`
  return bucket === 'week' ? `Week of ${mdy}` : mdy
}

export function VolumeChart({ data, className, unit, bucket = 'week' }: VolumeChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatBucketLabel(d.week, bucket),
  }))
  const volumeLabel = unit ? `Volume (${unit})` : 'Volume'

  return (
    <div className={cn('w-full h-[200px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [value.toLocaleString(), volumeLabel]}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.week ? formatBucketLabel(payload[0].payload.week, bucket) : ''
            }
          />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

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
}

function formatWeekLabel(week: string) {
  const d = new Date(week)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function VolumeChart({ data, className }: VolumeChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatWeekLabel(d.week),
  }))

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
            formatter={(value: number) => [value.toLocaleString(), 'Volume']}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.week ? formatWeekLabel(payload[0].payload.week) : ''
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

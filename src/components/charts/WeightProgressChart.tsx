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

interface WeightProgressChartProps {
  data: { date: string; maxWeight: number }[]
  className?: string
}

function formatDateLabel(date: string) {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function WeightProgressChart({ data, className }: WeightProgressChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateLabel(d.date),
  }))

  return (
    <div className={cn('w-full h-[180px]', className)}>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [value, 'Max weight']}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.date ? formatDateLabel(payload[0].payload.date) : ''
            }
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

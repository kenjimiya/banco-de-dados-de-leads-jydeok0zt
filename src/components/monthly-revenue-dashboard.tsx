import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Calendar } from 'lucide-react'
import type { Purchase } from '@/services/api'

const monthLabels = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtAxis = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v}`
}

const chartConfig: ChartConfig = {
  revenue: {
    label: 'Faturamento',
    color: 'hsl(var(--primary))',
  },
}

export function MonthlyRevenueDashboard({ purchases }: { purchases: Purchase[] }) {
  const data = useMemo(() => {
    const year = new Date().getFullYear()
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: monthLabels[i],
      revenue: 0,
    }))
    purchases.forEach((p) => {
      if (!p.purchase_date) return
      const date = new Date(p.purchase_date)
      if (date.getFullYear() === year) {
        monthly[date.getMonth()].revenue += p.grand_total || p.total_price || 0
      }
    })
    return monthly
  }, [purchases])

  const total = data.reduce((s, d) => s + d.revenue, 0)
  const year = new Date().getFullYear()

  return (
    <Card className="border-none shadow-subtle">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary/20 p-3 rounded-xl text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tendência de Faturamento — {year}</p>
            <p className="text-2xl font-bold text-primary">{fmtCurrency(total)}</p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} barCategoryGap="15%">
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={fmtAxis}
              width={90}
              tickMargin={8}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => fmtCurrency(Number(value))} />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

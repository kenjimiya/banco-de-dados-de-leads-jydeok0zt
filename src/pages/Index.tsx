import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLeads, getPurchases, Lead, Purchase } from '@/services/api'
import { MonthlyRevenueDashboard } from '@/components/monthly-revenue-dashboard'
import { fmtCurrency } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Users, DollarSign, Activity, Percent } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { format, subDays, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export default function Index() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const loadData = async () => {
    const l = await getLeads()
    const p = await getPurchases()
    setLeads(l)
    setPurchases(p)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('leads', loadData)
  useRealtime('purchases', loadData)

  const totalLeads = leads.length
  const totalRevenue = purchases.reduce((acc, curr) => acc + curr.total_price, 0)
  const avgTicket = purchases.length > 0 ? totalRevenue / purchases.length : 0
  const clientsCount = leads.filter((l) => l.status === 'cliente').length
  const conversionRate = totalLeads > 0 ? (clientsCount / totalLeads) * 100 : 0

  // Chart Data (Last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentPurchases = purchases.filter((p) => isAfter(new Date(p.purchase_date), thirtyDaysAgo))

  const chartDataMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    chartDataMap.set(format(subDays(new Date(), i), 'MMM dd', { locale: ptBR }), 0)
  }
  recentPurchases.forEach((p) => {
    const d = format(new Date(p.purchase_date), 'MMM dd', { locale: ptBR })
    if (chartDataMap.has(d)) {
      chartDataMap.set(d, chartDataMap.get(d)! + p.total_price)
    }
  })
  const chartData = Array.from(chartDataMap).map(([date, revenue]) => ({ date, revenue }))

  // Hot Leads (High spend, old purchase)
  const hotLeads = leads
    .filter((l) => l.total_spent > 0)
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5)

  const stats = [
    { title: 'Total de Leads', value: totalLeads, icon: Users, color: 'text-blue-500' },
    {
      title: 'Receita Total',
      value: fmtCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Ticket Médio',
      value: fmtCurrency(avgTicket),
      icon: Activity,
      color: 'text-accent',
    },
    {
      title: 'Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover-scale border-none shadow-subtle">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-3 bg-secondary rounded-full ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-subtle flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Vendas (30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ChartContainer
              config={{ revenue: { label: 'Receita', color: 'hsl(var(--primary))' } }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-subtle flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" /> Radar de Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              {hotLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Últ. compra:{' '}
                      {lead.last_purchase_date
                        ? format(new Date(lead.last_purchase_date), 'dd/MM/yy')
                        : '-'}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-accent/10 text-accent font-semibold border-none"
                  >
                    {fmtCurrency(lead.total_spent)}
                  </Badge>
                </div>
              ))}
              {hotLeads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <MonthlyRevenueDashboard purchases={purchases} />
    </div>
  )
}

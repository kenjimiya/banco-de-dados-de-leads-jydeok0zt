import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getLeads,
  getPurchases,
  getProposals,
  getInternalOrders,
  getTechnicalProposals,
  type Lead,
  type Purchase,
  type Proposal,
  type InternalOrder,
  type TechnicalProposal,
} from '@/services/api'
import { MonthlyRevenueDashboard } from '@/components/monthly-revenue-dashboard'
import { fmtCurrency, cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Users,
  DollarSign,
  Activity,
  Percent,
  FileText,
  ClipboardList,
  Wrench,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react'
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
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [internalOrders, setInternalOrders] = useState<InternalOrder[]>([])
  const [techProposals, setTechProposals] = useState<TechnicalProposal[]>([])

  const loadData = async () => {
    const [l, p, pr, io, tp] = await Promise.all([
      getLeads(),
      getPurchases(),
      getProposals(),
      getInternalOrders(),
      getTechnicalProposals(),
    ])
    setLeads(l)
    setPurchases(p)
    setProposals(pr)
    setInternalOrders(io)
    setTechProposals(tp)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('leads', loadData)
  useRealtime('purchases', loadData)
  useRealtime('proposals', loadData)
  useRealtime('internal_orders', loadData)
  useRealtime('technical_proposals', loadData)

  const totalLeads = leads.length
  const totalRevenue = purchases.reduce((acc, curr) => acc + curr.total_price, 0)
  const avgTicket = purchases.length > 0 ? totalRevenue / purchases.length : 0
  const clientsCount = leads.filter((l) => l.status === 'cliente').length
  const conversionRate = totalLeads > 0 ? (clientsCount / totalLeads) * 100 : 0

  const acceptedProposals = proposals.filter((p) => p.status === 'aceito').length
  const pendingProposals = proposals.filter(
    (p) => p.status === 'rascunho' || p.status === 'enviado',
  ).length
  const acceptedTechProposals = techProposals.filter((t) => t.status === 'aceito').length
  const piTotalValue = internalOrders.reduce((acc, o) => acc + (o.total_value || 0), 0)

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

  const moduleCards = [
    {
      to: '/leads',
      icon: Users,
      label: 'Clientes',
      count: totalLeads,
      subtitle: `${clientsCount} clientes ativos`,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      to: '/vendas',
      icon: ShoppingCart,
      label: 'Vendas',
      count: purchases.length,
      subtitle: fmtCurrency(totalRevenue),
      color: 'text-primary bg-primary/10',
    },
    {
      to: '/pi',
      icon: ClipboardList,
      label: 'Pedidos Internos (PI)',
      count: internalOrders.length,
      subtitle: fmtCurrency(piTotalValue),
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      to: '/propostas',
      icon: FileText,
      label: 'Propostas Comerciais (PCS)',
      count: proposals.length,
      subtitle: `${acceptedProposals} aceitas`,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      to: '/pat',
      icon: Wrench,
      label: 'Assistência Técnica (PAT)',
      count: techProposals.length,
      subtitle: `${acceptedTechProposals} aceitas`,
      color: 'text-orange-500 bg-orange-500/10',
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
              <div className={cn('p-3 rounded-full', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Acesso Rápido aos Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {moduleCards.map((card) => (
            <Link key={card.to} to={card.to}>
              <Card className="hover-scale border-none shadow-subtle transition-all duration-200 hover:shadow-md h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={cn('p-2.5 rounded-xl w-fit', card.color)}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{card.count}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium mt-auto">
                    Acessar <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-subtle">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" /> Propostas Comerciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-green-500">{acceptedProposals}</p>
                <p className="text-xs text-muted-foreground mt-1">Aceitas</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-orange-500">{pendingProposals}</p>
                <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold">{proposals.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-subtle">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-500" /> Pedidos Internos (PI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-purple-500">{internalOrders.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total PIs</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-blue-500">
                  {internalOrders.filter((o) => o.operation_type === 'novo').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Novos</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-2xl font-bold text-orange-500">
                  {internalOrders.filter((o) => o.operation_type === 'conserto').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Consertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MonthlyRevenueDashboard purchases={purchases} />
    </div>
  )

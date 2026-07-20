import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, TrendingUp, Package, Percent } from 'lucide-react'
import type { Purchase } from '@/services/api'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function SalesKpiCards({ purchases }: { purchases: Purchase[] }) {
  const stats = useMemo(() => {
    const revenue = purchases.reduce((s, p) => s + (p.grand_total || p.total_price || 0), 0)
    const margin = purchases.reduce((s, p) => s + ((p.grand_total || 0) - (p.total_cost || 0)), 0)
    const avg = purchases.length > 0 ? revenue / purchases.length : 0
    return { count: purchases.length, revenue, margin, avg }
  }, [purchases])

  const cards = [
    {
      label: 'Total de Vendas',
      value: String(stats.count),
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Valor Total',
      value: fmtCurrency(stats.revenue),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Margem Total',
      value: fmtCurrency(stats.margin),
      icon: Percent,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Ticket Médio',
      value: fmtCurrency(stats.avg),
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-none shadow-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`${c.bg} p-2 rounded-lg ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

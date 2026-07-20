import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, TrendingUp } from 'lucide-react'
import type { Purchase } from '@/services/api'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function MonthlyRevenueDashboard({ purchases }: { purchases: Purchase[] }) {
  const { revenue, count, avgTicket } = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthly = purchases.filter((p) => {
      if (!p.purchase_date) return false
      const date = new Date(p.purchase_date)
      return date.getFullYear() === year && date.getMonth() === month
    })
    const rev = monthly.reduce((s, p) => s + (p.grand_total || p.total_price || 0), 0)
    return {
      revenue: rev,
      count: monthly.length,
      avgTicket: monthly.length > 0 ? rev / monthly.length : 0,
    }
  }, [purchases])

  const now = new Date()
  const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`

  return (
    <Card className="border-none shadow-subtle bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-xl text-primary">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Mensal — {monthLabel}</p>
              <p className="text-3xl font-bold text-primary">{fmtCurrency(revenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vendas no mês</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold">{fmtCurrency(avgTicket)}</p>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-primary hidden sm:block">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

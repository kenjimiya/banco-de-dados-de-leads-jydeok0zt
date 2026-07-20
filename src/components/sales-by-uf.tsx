import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import type { Purchase } from '@/services/api'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function SalesByUf({ purchases }: { purchases: Purchase[] }) {
  const ufData = useMemo(() => {
    const ufMap = new Map<string, number>()
    purchases.forEach((p) => {
      const uf = p.expand?.lead_id?.uf || 'N/A'
      ufMap.set(uf, (ufMap.get(uf) || 0) + (p.grand_total || p.total_price || 0))
    })
    const sorted = Array.from(ufMap.entries()).sort((a, b) => b[1] - a[1])
    const max = sorted.length > 0 ? sorted[0][1] : 1
    return { sorted, max }
  }, [purchases])

  return (
    <Card className="border-none shadow-subtle">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium">Vendas por UF</p>
        </div>
        <div className="space-y-2">
          {ufData.sorted.map(([uf, value]) => (
            <div key={uf} className="flex items-center gap-3">
              <span className="text-sm font-medium w-10">{uf}</span>
              <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-md transition-all duration-500"
                  style={{ width: `${(value / ufData.max) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-24 text-right">
                {fmtCurrency(value)}
              </span>
            </div>
          ))}
          {ufData.sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma venda registrada.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

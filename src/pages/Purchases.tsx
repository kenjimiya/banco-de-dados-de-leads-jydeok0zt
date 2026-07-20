import { useEffect, useState, useMemo } from 'react'
import { getPurchases, Purchase } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, isValid, parseISO } from 'date-fns'
import { ShoppingCart, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ExcelImportDialog } from '@/components/excel-import-dialog'
import { PurchaseRowActions } from '@/components/purchase-row-actions'
import { CreatePurchaseDialog } from '@/components/create-purchase-dialog'
import { SalesKpiCards } from '@/components/sales-kpi-cards'
import { SalesByUf } from '@/components/sales-by-uf'
import { AiInsightsPanel } from '@/components/ai-insights-panel'

const fmtCurrency = (v: number | undefined) =>
  `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  const parsed = parseISO(dateStr)
  return isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : '-'
}

type SortDirection = 'desc' | 'asc'

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const loadData = async () => setPurchases(await getPurchases())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('purchases', loadData)
  useRealtime('leads', loadData)

  const toggleSort = () => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const result = purchases.filter(
      (p) =>
        p.expand?.lead_id?.name?.toLowerCase().includes(q) ||
        p.product_name?.toLowerCase().includes(q) ||
        p.invoice_number?.toLowerCase().includes(q),
    )
    return result.sort((a, b) => {
      const dateA = a.purchase_date || ''
      const dateB = b.purchase_date || ''
      if (sortDir === 'desc') return dateB.localeCompare(dateA)
      return dateA.localeCompare(dateB)
    })
  }, [purchases, search, sortDir])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Todas as Vendas</h2>
        </div>
        <div className="flex gap-2">
          <ExcelImportDialog onImported={loadData} />
          <CreatePurchaseDialog onCreated={loadData} />
        </div>
      </div>

      <SalesKpiCards purchases={purchases} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesByUf purchases={purchases} />
        <AiInsightsPanel />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, produto ou NF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-none shadow-subtle rounded-xl"
        />
      </div>

      <Card className="border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">UF</TableHead>
                  <TableHead className="whitespace-nowrap">Cliente</TableHead>
                  <TableHead className="whitespace-nowrap">Atividade</TableHead>
                  <TableHead className="whitespace-nowrap">Tipo</TableHead>
                  <TableHead className="whitespace-nowrap">NF</TableHead>
                  <TableHead className="whitespace-nowrap">PI</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSort}
                      className="h-8 px-2 -ml-2 font-medium hover:bg-secondary/60"
                    >
                      Data da Venda
                      {sortDir === 'desc' ? (
                        <ArrowDown className="ml-1 w-3.5 h-3.5" />
                      ) : (
                        <ArrowUp className="ml-1 w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">Unid</TableHead>
                  <TableHead className="whitespace-nowrap">Produto</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Custo MP</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Custo Total</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Vlr Unid</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Frete</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Faturamento</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Última Compra</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Prazo</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{p.expand?.lead_id?.uf || '-'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {p.expand?.lead_id?.name || 'Lead Excluído'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.expand?.lead_id?.activity || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={p.sale_type === 'VENDA' ? 'default' : 'secondary'}>
                        {p.sale_type || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.invoice_number || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.pi_number || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fmtDate(p.purchase_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">{p.quantity}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.product_name}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {fmtCurrency(p.raw_material_cost)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {fmtCurrency(p.total_cost)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {fmtCurrency(p.unit_price)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {fmtCurrency(p.total_price)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {fmtCurrency(p.shipping_cost)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-bold text-primary">
                      {fmtCurrency(p.grand_total)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {fmtDate(p.expand?.lead_id?.last_purchase_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {p.payment_term || 0} dias
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-center">
                      <PurchaseRowActions purchase={p} />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma venda encontrada.</p>
                      <p className="text-sm">Importe um Excel ou registre uma venda manualmente.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

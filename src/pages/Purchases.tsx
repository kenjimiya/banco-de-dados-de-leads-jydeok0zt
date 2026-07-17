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
import { format } from 'date-fns'
import { ShoppingCart, Search, TrendingUp, DollarSign, Package } from 'lucide-react'
import { ExcelImportDialog } from '@/components/excel-import-dialog'

const fmtCurrency = (v: number | undefined) => `R$ ${(v || 0).toFixed(2)}`

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [search, setSearch] = useState('')

  const loadData = async () => setPurchases(await getPurchases())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('purchases', loadData)

  const filtered = purchases.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.expand?.lead_id?.name?.toLowerCase().includes(q) ||
      p.product_name?.toLowerCase().includes(q) ||
      p.invoice_number?.toLowerCase().includes(q)
    )
  })

  const stats = useMemo(() => {
    const revenue = purchases.reduce((s, p) => s + (p.grand_total || p.total_price || 0), 0)
    const avg = purchases.length > 0 ? revenue / purchases.length : 0
    return { count: purchases.length, revenue, avg }
  }, [purchases])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">Todas as Vendas</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
              <p className="text-xl font-bold">{stats.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold">{fmtCurrency(stats.revenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-lg text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold">{fmtCurrency(stats.avg)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, produto ou NF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-none shadow-subtle rounded-xl"
          />
        </div>
        <ExcelImportDialog onImported={loadData} />
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
                  <TableHead className="whitespace-nowrap">Data</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Unid</TableHead>
                  <TableHead className="whitespace-nowrap">Produto</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Custo MP</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Custo Total</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Vlr Unid</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Frete</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Total c/ Frete</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Prazo</TableHead>
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
                      {format(new Date(p.purchase_date), 'dd/MM/yyyy')}
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
                      {p.payment_term || 0} dias
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma venda encontrada.</p>
                      <p className="text-sm">Importe um arquivo Excel para começar.</p>
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

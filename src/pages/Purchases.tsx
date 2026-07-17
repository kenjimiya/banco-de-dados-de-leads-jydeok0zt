import { useEffect, useState } from 'react'
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
import { format } from 'date-fns'
import { ShoppingCart } from 'lucide-react'

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const loadData = async () => setPurchases(await getPurchases())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('purchases', loadData)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">Todas as Vendas</h2>
      </div>

      <Card className="border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-none">
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(p.purchase_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.expand?.lead_id?.name || 'Lead Excluído'}
                  </TableCell>
                  <TableCell>{p.product_name}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    R$ {p.total_price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

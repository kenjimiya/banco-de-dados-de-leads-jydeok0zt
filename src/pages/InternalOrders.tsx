import { useEffect, useState } from 'react'
import {
  getInternalOrders,
  deleteInternalOrder,
  sendPiToProduction,
  type InternalOrder,
} from '@/services/api'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ClipboardList, MoreVertical, Pencil, Trash2, FileDown, Factory } from 'lucide-react'
import { PiFormDialog } from '@/components/pi-form-dialog'
import { exportPiNovoPDF } from '@/lib/pi-pdf-novo'
import { exportPiConsertoPDF } from '@/lib/pi-pdf-conserto'
import { useToast } from '@/hooks/use-toast'
import { fmtCurrency } from '@/lib/utils'

export default function InternalOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<InternalOrder[]>([])
  const [editOrder, setEditOrder] = useState<InternalOrder | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [delTarget, setDelTarget] = useState<InternalOrder | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sendingPi, setSendingPi] = useState<string | null>(null)

  const loadData = async () => setOrders(await getInternalOrders())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('internal_orders', loadData)

  const handleDelete = async () => {
    if (!delTarget) return
    setDeleting(true)
    try {
      await deleteInternalOrder(delTarget.id)
      toast({ title: 'PI excluído com sucesso!' })
      setDelTarget(null)
    } catch {
      toast({ title: 'Erro ao excluir PI', variant: 'destructive' })
    }
    setDeleting(false)
  }

  const handleSendToProduction = async (order: InternalOrder) => {
    setSendingPi(order.id)
    try {
      await sendPiToProduction(order.id)
      toast({ title: 'PI enviado para Produção (Ivanildo e Rosmar) e Financeiro!' })
    } catch {
      toast({ title: 'Erro ao enviar PI', variant: 'destructive' })
    }
    setSendingPi(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Pedidos Internos (PI)</h2>
        </div>
        <PiFormDialog onSaved={loadData} />
      </div>

      <Card className="border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Nº PI</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <TableCell className="text-muted-foreground">
                      {format(new Date(o.created), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {o.pi_number || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {o.cliente_nome || o.expand?.lead_id?.name || 'Cliente excluído'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.expand?.pcs_id?.title || o.source_reference || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.operation_type === 'novo' ? 'default' : 'secondary'}>
                        {o.operation_type === 'novo' ? 'NOVO' : 'CONSERTO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.delivery_date ? format(new Date(o.delivery_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {fmtCurrency(o.total_value)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditOrder(o)
                              setEditOpen(true)
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              o.operation_type === 'conserto'
                                ? exportPiConsertoPDF(o, o.expand?.lead_id)
                                : exportPiNovoPDF(o, o.expand?.lead_id)
                            }
                          >
                            <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendToProduction(o)}
                            disabled={sendingPi === o.id}
                          >
                            <Factory className="w-4 h-4 mr-2" />
                            {sendingPi === o.id ? 'Enviando...' : 'Enviar para Produção'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDelTarget(o)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhum Pedido Interno gerado ainda.</p>
                      <p className="text-sm">Aceite uma Proposta Comercial (PCS) para iniciar.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PiFormDialog
        order={editOrder}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadData}
      />

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PI</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este Pedido Interno? Esta ação é permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

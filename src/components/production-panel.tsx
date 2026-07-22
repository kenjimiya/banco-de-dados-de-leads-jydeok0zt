import { useState, useEffect } from 'react'
import {
  getInternalOrders,
  updateInternalOrder,
  type InternalOrder,
  type InternalOrderItem,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductionItemsTable } from './production-items-table'
import { exportProductionPdfNovo } from '@/lib/pi-pdf-production-novo'
import { exportProductionPdfConserto } from '@/lib/pi-pdf-production-conserto'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { FileDown, Save, Loader2, ClipboardList, Truck, Package } from 'lucide-react'

export function ProductionPanel() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<InternalOrder[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [items, setItems] = useState<InternalOrderItem[]>([])
  const [productionNotes, setProductionNotes] = useState('')
  const [consertoNf, setConsertoNf] = useState('')
  const [consertoDate, setConsertoDate] = useState('')
  const [logistics, setLogistics] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const loadData = async () => setOrders(await getInternalOrders())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('internal_orders', loadData)

  const selected = orders.find((o) => o.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    const order = orders.find((o) => o.id === selectedId)
    if (!order) return
    setItems(
      order.items?.length
        ? order.items
        : [
            {
              description: '',
              quantity: 1,
              unit_price: 0,
              ncm: '',
              subtotal: 0,
              substitution: '',
              serial_number: '',
              equipment_date: '',
              delivery_date: '',
            },
          ],
    )
    setProductionNotes(order.production_notes || '')
    setConsertoNf(order.conserto_invoice_number || '')
    setConsertoDate(
      order.conserto_invoice_date
        ? format(new Date(order.conserto_invoice_date), 'yyyy-MM-dd')
        : '',
    )
    setLogistics({
      carrier_name: order.carrier_name || '',
      net_weight: String(order.net_weight || 0),
      gross_weight: String(order.gross_weight || 0),
      volumes_quantity: String(order.volumes_quantity || 1),
      packaging_type: order.packaging_type || 'papelao',
    })
  }, [selectedId]) // eslint-disable-line

  const setL = (k: string, v: string) => setLogistics((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await updateInternalOrder(selected.id, {
        items: items.filter((i) => i.description.trim()),
        production_notes: productionNotes,
        conserto_invoice_number: consertoNf,
        conserto_invoice_date: consertoDate ? new Date(consertoDate).toISOString() : '',
        carrier_name: logistics.carrier_name,
        net_weight: Number(logistics.net_weight) || 0,
        gross_weight: Number(logistics.gross_weight) || 0,
        volumes_quantity: Number(logistics.volumes_quantity) || 0,
        packaging_type: logistics.packaging_type as 'papelao' | 'madeira',
      })
      toast({ title: 'Produção atualizada com sucesso!' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
    setSaving(false)
  }

  const handlePdf = () => {
    if (!selected) return
    const updated: InternalOrder = {
      ...selected,
      items: items.filter((i) => i.description.trim()),
      production_notes: productionNotes,
      conserto_invoice_number: consertoNf,
      conserto_invoice_date: consertoDate,
      carrier_name: logistics.carrier_name,
      net_weight: Number(logistics.net_weight) || 0,
      gross_weight: Number(logistics.gross_weight) || 0,
      volumes_quantity: Number(logistics.volumes_quantity) || 0,
      packaging_type: logistics.packaging_type as 'papelao' | 'madeira',
    }
    if (selected.operation_type === 'conserto') {
      exportProductionPdfConserto(updated, selected.expand?.lead_id)
    } else {
      exportProductionPdfNovo(updated, selected.expand?.lead_id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Selecionar Pedido Interno (PI)</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um PI para editar..." />
          </SelectTrigger>
          <SelectContent>
            {orders.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.pi_number || 'Sem número'} —{' '}
                {o.cliente_nome || o.expand?.lead_id?.name || 'Cliente'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selected ? (
        <Card className="border-none shadow-subtle">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Selecione um PI para gerenciar a produção</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-none shadow-subtle">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary text-lg">
                  {selected.pi_number || 'Sem número'}
                </span>
                <Badge variant={selected.operation_type === 'novo' ? 'default' : 'secondary'}>
                  {selected.operation_type === 'novo' ? 'EQUIPAMENTO NOVO' : 'CONSERTO'}
                </Badge>
              </div>
              <div className="flex flex-col items-end text-sm text-muted-foreground">
                <span>{selected.cliente_nome || selected.expand?.lead_id?.name || '---'}</span>
                <span>Data: {format(new Date(selected.created), 'dd/MM/yyyy')}</span>
              </div>
            </CardContent>
          </Card>

          {selected.operation_type === 'conserto' && (
            <Card className="border-none shadow-subtle">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Dados da Remessa (Conserto)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Número da NF (Remessa)</Label>
                    <Input value={consertoNf} onChange={(e) => setConsertoNf(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data da NF</Label>
                    <Input
                      type="date"
                      value={consertoDate}
                      onChange={(e) => setConsertoDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-subtle">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Itens da Produção</h3>
              <ProductionItemsTable items={items} onChange={setItems} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-subtle">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" /> Logística
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Transportadora</Label>
                  <Input
                    value={logistics.carrier_name || ''}
                    onChange={(e) => setL('carrier_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peso Líquido (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={logistics.net_weight || ''}
                    onChange={(e) => setL('net_weight', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peso Bruto (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={logistics.gross_weight || ''}
                    onChange={(e) => setL('gross_weight', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Qtd Volumes</Label>
                  <Input
                    type="number"
                    min="1"
                    value={logistics.volumes_quantity || ''}
                    onChange={(e) => setL('volumes_quantity', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Embalagem</Label>
                  <Select
                    value={logistics.packaging_type || 'papelao'}
                    onValueChange={(v) => setL('packaging_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="papelao">Papelão</SelectItem>
                      <SelectItem value="madeira">Madeira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-subtle">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Package className="w-4 h-4" /> Observações de Produção
              </h3>
              <Textarea
                value={productionNotes}
                onChange={(e) => setProductionNotes(e.target.value)}
                placeholder="Observações para a equipe de produção (Ivanildo e Rosmar)..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Produção
            </Button>
            <Button variant="outline" onClick={handlePdf}>
              <FileDown className="w-4 h-4 mr-2" /> Gerar PDF Produção
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

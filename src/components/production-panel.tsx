import { useState, useEffect } from 'react'
import {
  getInternalOrders,
  updateInternalOrder,
  sendPiToProduction,
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
import { PiItemsTable } from './pi-items-table'
import { exportPiNovoPDF } from '@/lib/pi-pdf-novo'
import { exportPiConsertoPDF } from '@/lib/pi-pdf-conserto'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Factory, FileDown, Save, Loader2, ClipboardList } from 'lucide-react'

export function ProductionPanel() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<InternalOrder[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [items, setItems] = useState<InternalOrderItem[]>([])
  const [notes, setNotes] = useState('')
  const [consertoNf, setConsertoNf] = useState('')
  const [consertoDate, setConsertoDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingPi, setSendingPi] = useState(false)

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
        : [{ description: '', quantity: 1, unit_price: 0, ncm: '', subtotal: 0 }],
    )
    setNotes(order.notes || '')
    setConsertoNf(order.conserto_invoice_number || '')
    setConsertoDate(
      order.conserto_invoice_date
        ? format(new Date(order.conserto_invoice_date), 'yyyy-MM-dd')
        : '',
    )
  }, [selectedId]) // eslint-disable-line

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const itemsTotal = items.reduce((s, i) => s + (i.subtotal || 0), 0)
      const grandTotal =
        itemsTotal - (selected.discount_amount || 0) + (selected.shipping_cost || 0)
      await updateInternalOrder(selected.id, {
        items: items.filter((i) => i.description.trim()),
        notes,
        conserto_invoice_number: consertoNf,
        conserto_invoice_date: consertoDate ? new Date(consertoDate).toISOString() : '',
        total_value: grandTotal,
      })
      toast({ title: 'Produção atualizada com sucesso!' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleSendProduction = async () => {
    if (!selected) return
    setSendingPi(true)
    try {
      await sendPiToProduction(selected.id)
      toast({ title: 'PI enviado para Produção (Ivanildo e Rosmar) e Financeiro!' })
    } catch {
      toast({ title: 'Erro ao enviar PI', variant: 'destructive' })
    }
    setSendingPi(false)
  }

  const handlePdf = () => {
    if (!selected) return
    if (selected.operation_type === 'conserto') {
      exportPiConsertoPDF(selected, selected.expand?.lead_id)
    } else {
      exportPiNovoPDF(selected, selected.expand?.lead_id)
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
              <span className="text-sm text-muted-foreground">
                {selected.cliente_nome || selected.expand?.lead_id?.name || '---'}
              </span>
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
              <PiItemsTable items={items} onChange={setItems} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-subtle">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Observações de Produção</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações para a equipe de produção..."
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
              <FileDown className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
            <Button variant="secondary" onClick={handleSendProduction} disabled={sendingPi}>
              {sendingPi ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Factory className="w-4 h-4 mr-2" />
              )}
              {sendingPi ? 'Enviando...' : 'Enviar para Produção'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

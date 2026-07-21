import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createInternalOrder,
  updateInternalOrder,
  updateLead,
  getLead,
  getLeadProposals,
  type Lead,
  type Proposal,
  type InternalOrder,
  type InternalOrderItem,
} from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { LeadSelect } from './lead-select'
import { PiItemsTable } from './pi-items-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface PiFormDialogProps {
  order?: InternalOrder | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved: () => void
}

export function PiFormDialog({
  order,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: PiFormDialogProps) {
  const { toast } = useToast()
  const isEdit = !!order
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [saving, setSaving] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [items, setItems] = useState<InternalOrderItem[]>([])
  const [form, setForm] = useState<Record<string, any>>({})
  const [leadForm, setLeadForm] = useState<Record<string, string>>({})
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedProposalId, setSelectedProposalId] = useState('')

  useEffect(() => {
    if (!open) return
    if (order?.expand?.lead_id) setSelectedLead(order.expand.lead_id)
    else if (order?.lead_id)
      getLead(order.lead_id)
        .then(setSelectedLead)
        .catch(() => {})
    else setSelectedLead(null)

    setItems(
      order?.items
        ? order.items
        : [{ description: '', quantity: 1, unit_price: 0, ncm: '', subtotal: 0 }],
    )

    setForm({
      operation_type: order?.operation_type || 'novo',
      conserto_invoice_number: order?.conserto_invoice_number || '',
      conserto_invoice_date: order?.conserto_invoice_date
        ? format(new Date(order.conserto_invoice_date), 'yyyy-MM-dd')
        : '',
      discount_amount: order?.discount_amount || 0,
      shipping_cost: order?.shipping_cost || 0,
      shipping_type: order?.shipping_type || '',
      payment_condition: order?.payment_condition || '',
      delivery_date: order?.delivery_date
        ? format(new Date(order.delivery_date), 'yyyy-MM-dd')
        : '',
      carrier_name: order?.carrier_name || '',
      volumes_quantity: order?.volumes_quantity || 1,
      net_weight: order?.net_weight || 0,
      gross_weight: order?.gross_weight || 0,
      packaging_type: order?.packaging_type || 'papelao',
      pi_number: order?.pi_number || '',
      billing_date: order?.billing_date ? format(new Date(order.billing_date), 'yyyy-MM-dd') : '',
      source_reference: order?.source_reference || '',
      notes: order?.notes || '',
    })
  }, [open, order])

  useEffect(() => {
    if (selectedLead) {
      setLeadForm({
        name: selectedLead.name || '',
        contact_name: selectedLead.contact_name || '',
        cnpj: selectedLead.cnpj || '',
        ie: selectedLead.ie || '',
        cep: selectedLead.cep || '',
        address: selectedLead.address || '',
        neighborhood: selectedLead.neighborhood || '',
        city: selectedLead.city || '',
        uf: selectedLead.uf || '',
        email: selectedLead.email || '',
        phone: selectedLead.phone || '',
      })
    } else {
      setLeadForm({})
    }
  }, [selectedLead])

  useEffect(() => {
    if (selectedLead) {
      getLeadProposals(selectedLead.id)
        .then(setProposals)
        .catch(() => setProposals([]))
    } else {
      setProposals([])
    }
    setSelectedProposalId('')
  }, [selectedLead])

  const itemsTotal = useMemo(() => items.reduce((s, i) => s + (i.subtotal || 0), 0), [items])
  const grandTotal =
    itemsTotal - (Number(form.discount_amount) || 0) + (Number(form.shipping_cost) || 0)

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))
  const setL = (k: string, v: string) => setLeadForm((p) => ({ ...p, [k]: v }))

  const importProposalItems = (proposalId: string) => {
    setSelectedProposalId(proposalId)
    const proposal = proposals.find((p) => p.id === proposalId)
    if (!proposal?.items?.length) return
    setItems(
      proposal.items
        .filter((i) => i.description?.trim())
        .map((item) => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          ncm: '',
          subtotal: (item.quantity || 1) * (item.unit_price || 0),
        })),
    )
    set(
      'source_reference',
      `PCS: ${proposal.title}${proposal.revision ? ` Rev. ${proposal.revision}` : ''}`,
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await updateLead(selectedLead.id, leadForm)

      const data = {
        lead_id: selectedLead.id,
        operation_type: form.operation_type,
        conserto_invoice_number: form.conserto_invoice_number,
        conserto_invoice_date: form.conserto_invoice_date
          ? new Date(form.conserto_invoice_date).toISOString()
          : '',
        items: items.filter((i) => i.description.trim()),
        discount_amount: Number(form.discount_amount) || 0,
        shipping_cost: Number(form.shipping_cost) || 0,
        shipping_type: form.shipping_type || '',
        total_value: grandTotal,
        payment_condition: form.payment_condition || '',
        delivery_date: form.delivery_date ? new Date(form.delivery_date).toISOString() : '',
        carrier_name: form.carrier_name || '',
        volumes_quantity: Number(form.volumes_quantity) || 0,
        net_weight: Number(form.net_weight) || 0,
        gross_weight: Number(form.gross_weight) || 0,
        packaging_type: form.packaging_type,
        pi_number: form.pi_number || '',
        billing_date: form.billing_date ? new Date(form.billing_date).toISOString() : '',
        source_reference: form.source_reference || '',
        notes: form.notes || '',
      }
      if (isEdit && order) {
        await updateInternalOrder(order.id, data)
        toast({ title: 'PI atualizado com sucesso!' })
      } else {
        await createInternalOrder(data)
        toast({ title: 'PI criado com sucesso!' })
      }
      setOpen(false)
      onSaved()
    } catch {
      toast({ title: 'Erro ao salvar PI', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="rounded-xl shadow-elevation">
            <Plus className="w-4 h-4 mr-2" /> Novo Pedido Interno
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {isEdit ? 'Editar Pedido Interno (PI)' : 'Novo Pedido Interno (PI)'}
            {form.pi_number && (
              <span className="text-base font-bold text-primary tracking-wide bg-primary/10 px-2 py-0.5 rounded-md">
                # {form.pi_number}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="client">Cliente</TabsTrigger>
              <TabsTrigger value="items">Operação & Itens</TabsTrigger>
              <TabsTrigger value="finance">Financeiro & Logística</TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-4">
              <div className="space-y-1.5">
                <Label>Buscar / Selecionar Cliente *</Label>
                <LeadSelect value={selectedLead} onChange={setSelectedLead} />
              </div>
              {selectedLead && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-xl bg-secondary/10">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Razão Social / Nome</Label>
                    <Input
                      value={leadForm.name}
                      onChange={(e) => setL('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CNPJ</Label>
                    <Input value={leadForm.cnpj} onChange={(e) => setL('cnpj', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>I.E.</Label>
                    <Input value={leadForm.ie} onChange={(e) => setL('ie', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contato (Nome)</Label>
                    <Input
                      value={leadForm.contact_name}
                      onChange={(e) => setL('contact_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={leadForm.phone} onChange={(e) => setL('phone', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Email</Label>
                    <Input value={leadForm.email} onChange={(e) => setL('email', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2 grid grid-cols-12 gap-2">
                    <div className="col-span-3 space-y-1.5">
                      <Label>CEP</Label>
                      <Input value={leadForm.cep} onChange={(e) => setL('cep', e.target.value)} />
                    </div>
                    <div className="col-span-9 space-y-1.5">
                      <Label>Endereço</Label>
                      <Input
                        value={leadForm.address}
                        onChange={(e) => setL('address', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2 grid grid-cols-12 gap-2">
                    <div className="col-span-5 space-y-1.5">
                      <Label>Bairro</Label>
                      <Input
                        value={leadForm.neighborhood}
                        onChange={(e) => setL('neighborhood', e.target.value)}
                      />
                    </div>
                    <div className="col-span-5 space-y-1.5">
                      <Label>Cidade</Label>
                      <Input value={leadForm.city} onChange={(e) => setL('city', e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>UF</Label>
                      <Input value={leadForm.uf} onChange={(e) => setL('uf', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nº do PI</Label>
                  <Input
                    value={form.pi_number || ''}
                    onChange={(e) => set('pi_number', e.target.value)}
                    placeholder="Gerado automaticamente"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Faturamento</Label>
                  <Input
                    type="date"
                    value={form.billing_date || ''}
                    onChange={(e) => set('billing_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de Operação</Label>
                <Select value={form.operation_type} onValueChange={(v) => set('operation_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Equipamento Novo</SelectItem>
                    <SelectItem value="conserto">Retorno de Conserto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.operation_type === 'conserto' && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-xl bg-orange-500/5">
                  <div className="space-y-1.5">
                    <Label>Número da NF (Remessa)</Label>
                    <Input
                      value={form.conserto_invoice_number}
                      onChange={(e) => set('conserto_invoice_number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data da NF</Label>
                    <Input
                      type="date"
                      value={form.conserto_invoice_date}
                      onChange={(e) => set('conserto_invoice_date', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {proposals.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Importar Itens de Proposta Comercial (PCS)</Label>
                  <Select value={selectedProposalId} onValueChange={importProposalItems}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar proposta para importar itens..." />
                    </SelectTrigger>
                    <SelectContent>
                      {proposals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} {p.revision ? `— Rev. ${p.revision}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5 mt-4">
                <Label className="font-semibold">Itens do Pedido</Label>
                <PiItemsTable items={items} onChange={setItems} />
              </div>
            </TabsContent>

            <TabsContent value="finance" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">Financeiro</h3>
                  <div className="space-y-1.5">
                    <Label>Condição de Pagamento</Label>
                    <Input
                      value={form.payment_condition}
                      onChange={(e) => set('payment_condition', e.target.value)}
                      placeholder="Ex: 28 DDL"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Desconto (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discount_amount}
                        onChange={(e) => set('discount_amount', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Frete/SEDEX (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.shipping_cost}
                        onChange={(e) => set('shipping_cost', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de Frete</Label>
                    <Select
                      value={form.shipping_type || ''}
                      onValueChange={(v) => set('shipping_type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CIF">CIF</SelectItem>
                        <SelectItem value="FOB">FOB</SelectItem>
                        <SelectItem value="SEDEX/Correio">SEDEX/Correio</SelectItem>
                        <SelectItem value="Retirada">Retirada</SelectItem>
                        <SelectItem value="Transportadora">Transportadora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-primary/10 p-3 rounded-xl">
                    <div className="flex justify-between items-center font-semibold text-lg text-primary">
                      <span>Total Final:</span>
                      <span>R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">Logística</h3>
                  <div className="space-y-1.5">
                    <Label>Data de Entrega</Label>
                    <Input
                      type="date"
                      value={form.delivery_date}
                      onChange={(e) => set('delivery_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transportadora</Label>
                    <Input
                      value={form.carrier_name}
                      onChange={(e) => set('carrier_name', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label>Qtd Volumes</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.volumes_quantity}
                        onChange={(e) => set('volumes_quantity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peso Líq (kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.net_weight}
                        onChange={(e) => set('net_weight', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Peso Bruto (kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.gross_weight}
                        onChange={(e) => set('gross_weight', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Embalagem</Label>
                    <Select
                      value={form.packaging_type}
                      onValueChange={(v) => set('packaging_type', v)}
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
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label htmlFor="notes">OBS: (Observações)</Label>
            <Textarea
              id="notes"
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Observações gerais sobre o pedido..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Pedido Interno'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createProposal,
  updateProposal,
  getLead,
  type Lead,
  type Proposal,
  type ProposalItem,
} from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { LeadSelect } from './lead-select'
import { ProposalItemsTable } from './proposal-items-table'
import { LeadInfoCard } from './lead-info-card'

const DEFAULT_FREIGHT = 'FOB – Favor indicar a transportadora de sua preferência'

interface ProposalFormDialogProps {
  proposal?: Proposal | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved: () => void
}

export function ProposalFormDialog({
  proposal,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: ProposalFormDialogProps) {
  const { toast } = useToast()
  const isEdit = !!proposal
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [saving, setSaving] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [items, setItems] = useState<ProposalItem[]>([])
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (proposal?.expand?.lead_id) setSelectedLead(proposal.expand.lead_id)
    else if (proposal?.lead_id)
      getLead(proposal.lead_id)
        .then(setSelectedLead)
        .catch(() => {})
    else setSelectedLead(null)
    setItems(
      proposal?.items?.length
        ? proposal.items
        : [{ quantity: 1, description: '', unit_price: 0, total_price: 0 }],
    )
    setForm({
      title: proposal?.title || '',
      description: proposal?.description || '',
      status: proposal?.status || 'rascunho',
      expiry_date: proposal?.expiry_date
        ? format(new Date(proposal.expiry_date), 'yyyy-MM-dd')
        : '',
      payment_condition: proposal?.payment_condition || '28DDL',
      delivery_time: proposal?.delivery_time || 'A Combinar',
      composition: proposal?.composition || '',
      freight_info: proposal?.freight_info || DEFAULT_FREIGHT,
    })
  }, [open, proposal])

  const grandTotal = useMemo(() => items.reduce((s, i) => s + (i.total_price || 0), 0), [items])
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    if (!form.title?.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const data = {
        lead_id: selectedLead.id,
        title: form.title,
        description: form.description || '',
        status: form.status || 'rascunho',
        total_value: grandTotal,
        expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : '',
        items: items.filter((i) => i.description.trim()),
        payment_condition: form.payment_condition || '',
        delivery_time: form.delivery_time || '',
        composition: form.composition || '',
        freight_info: form.freight_info || DEFAULT_FREIGHT,
      }
      if (isEdit && proposal) {
        await updateProposal(proposal.id, data)
        toast({ title: 'Proposta atualizada com sucesso!' })
      } else {
        await createProposal(data)
        toast({ title: 'Proposta criada com sucesso!' })
      }
      setOpen(false)
      onSaved()
    } catch {
      toast({ title: 'Erro ao salvar proposta', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="rounded-xl shadow-elevation">
            <Plus className="w-4 h-4 mr-2" /> Nova Proposta
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <LeadSelect value={selectedLead} onChange={setSelectedLead} />
          </div>
          {selectedLead && <LeadInfoCard lead={selectedLead} />}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={form.title || ''}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Itens da Proposta</Label>
            <ProposalItemsTable items={items} onChange={setItems} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aceito">Aceito</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Validade</Label>
              <Input
                type="date"
                value={form.expiry_date || ''}
                onChange={(e) => set('expiry_date', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Condição de Pagamento</Label>
              <Input
                value={form.payment_condition || ''}
                onChange={(e) => set('payment_condition', e.target.value)}
                placeholder="Ex: 28DDL"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo de Entrega</Label>
              <Input
                value={form.delivery_time || ''}
                onChange={(e) => set('delivery_time', e.target.value)}
                placeholder="Ex: A Combinar"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Composição da Proposta</Label>
            <Textarea
              value={form.composition || ''}
              onChange={(e) => set('composition', e.target.value)}
              rows={3}
              placeholder="Descreva a composição técnica da proposta..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Frete</Label>
            <Input
              value={form.freight_info || ''}
              onChange={(e) => set('freight_info', e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Proposta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

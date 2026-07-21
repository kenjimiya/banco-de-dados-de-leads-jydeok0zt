import { useState, useEffect } from 'react'
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
  createTechnicalProposal,
  updateTechnicalProposal,
  getLead,
  type Lead,
  type TechnicalProposal,
  type TechnicalDiagnostic,
} from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { LeadSelect } from './lead-select'
import { PatItemsTable } from './pat-items-table'
import { LeadInfoCard } from './lead-info-card'

const DEFAULT_TERMS = {
  payment_condition: '28DDL',
  delivery_time: 'A combinar',
  validity: 'Proposta válida por 15 dias, a contar da data de emissão',
  guarantee:
    'Garantimos os equipamentos objetos desta proposta por um período de 06 meses, contra eventuais defeitos de fabricação, exceto materiais elétricos e pneumáticos (quando aplicado), por serem produtos de qualidade c/ garantia própria;',
}

interface PatFormDialogProps {
  proposal?: TechnicalProposal | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved: () => void
}

export function PatFormDialog({
  proposal,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: PatFormDialogProps) {
  const { toast } = useToast()
  const isEdit = !!proposal
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [saving, setSaving] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [items, setItems] = useState<TechnicalDiagnostic[]>([])
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
        ? (proposal.items as TechnicalDiagnostic[]).map((d) => ({
            equipment: d.equipment || '',
            serial_number: d.serial_number || '',
            manufacturing_date: d.manufacturing_date || '',
            defect: d.defect || '',
            solution: d.solution || '',
            parts: (d.parts || []).map((p) => ({
              description: p.description || '',
              quantity: p.quantity ?? 1,
              unit_price: p.unit_price ?? 0,
              total_price: (p.quantity ?? 1) * (p.unit_price ?? 0),
            })),
          }))
        : [
            {
              equipment: '',
              serial_number: '',
              manufacturing_date: '',
              defect: '',
              solution: '',
              parts: [{ description: '', quantity: 1, unit_price: 0, total_price: 0 }],
            },
          ],
    )
    setForm({
      proposal_number: proposal?.proposal_number || '',
      revision: proposal?.revision || '00',
      invoice_number: proposal?.invoice_number || '',
      date: proposal?.date
        ? format(new Date(proposal.date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      status: proposal?.status || 'rascunho',
      payment_condition: proposal?.payment_condition || DEFAULT_TERMS.payment_condition,
      delivery_time: proposal?.delivery_time || DEFAULT_TERMS.delivery_time,
      validity: proposal?.validity || DEFAULT_TERMS.validity,
      guarantee: proposal?.guarantee || DEFAULT_TERMS.guarantee,
    })
  }, [open, proposal])

  const grandTotal = items.reduce(
    (sum, item) => sum + (item.parts || []).reduce((s, p) => s + (p.total_price || 0), 0),
    0,
  )

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const data = {
        lead_id: selectedLead.id,
        proposal_number: form.proposal_number || '',
        revision: form.revision || '00',
        invoice_number: form.invoice_number || '',
        date: form.date ? new Date(form.date).toISOString() : '',
        total_price: grandTotal,
        status: form.status || 'rascunho',
        items: items,
        payment_condition: form.payment_condition || '',
        delivery_time: form.delivery_time || '',
        validity: form.validity || '',
        guarantee: form.guarantee || '',
      }
      if (isEdit && proposal) {
        await updateTechnicalProposal(proposal.id, data)
        toast({ title: 'PAT atualizada com sucesso!' })
      } else {
        await createTechnicalProposal(data)
        toast({ title: 'PAT criada com sucesso!' })
      }
      setOpen(false)
      onSaved()
    } catch {
      toast({ title: 'Erro ao salvar PAT', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="rounded-xl shadow-elevation">
            <Plus className="w-4 h-4 mr-2" /> Nova PAT
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar PAT' : 'Nova Proposta de Assistência Técnica'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <LeadSelect value={selectedLead} onChange={setSelectedLead} />
          </div>
          {selectedLead && <LeadInfoCard lead={selectedLead} />}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Nº Proposta</Label>
              <Input
                value={form.proposal_number || ''}
                onChange={(e) => set('proposal_number', e.target.value)}
                placeholder="Ex: 001/26"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Revisão</Label>
              <Input
                value={form.revision || ''}
                onChange={(e) => set('revision', e.target.value)}
                placeholder="Ex: 00"
              />
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nº Nota Fiscal (Remessa)</Label>
              <Input
                value={form.invoice_number || ''}
                onChange={(e) => set('invoice_number', e.target.value)}
                placeholder="Ex: 375928"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data da Nota Fiscal</Label>
              <Input
                type="date"
                value={form.date || ''}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <Label className="text-base font-semibold text-primary mb-2 block">
              1. Itens e Laudo Técnico
            </Label>
            <PatItemsTable items={items} onChange={setItems} />
          </div>

          <div className="pt-4 space-y-4">
            <Label className="text-base font-semibold text-primary block">
              2. Termos e Condições
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prazo de Entrega</Label>
                <Input
                  value={form.delivery_time || ''}
                  onChange={(e) => set('delivery_time', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Condição de Pagamento</Label>
                <Input
                  value={form.payment_condition || ''}
                  onChange={(e) => set('payment_condition', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Validade da Proposta</Label>
              <Input
                value={form.validity || ''}
                onChange={(e) => set('validity', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Garantia</Label>
              <Textarea
                value={form.guarantee || ''}
                onChange={(e) => set('guarantee', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Criar PAT'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

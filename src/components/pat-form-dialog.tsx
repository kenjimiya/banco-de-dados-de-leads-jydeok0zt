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
} from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { LeadSelect } from './lead-select'

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
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (proposal?.expand?.lead_id) setSelectedLead(proposal.expand.lead_id)
    else if (proposal?.lead_id)
      getLead(proposal.lead_id)
        .then(setSelectedLead)
        .catch(() => {})
    else setSelectedLead(null)
    setForm({
      proposal_number: proposal?.proposal_number || '',
      invoice_number: proposal?.invoice_number || '',
      date: proposal?.date
        ? format(new Date(proposal.date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      defect: proposal?.defect || '',
      solution: proposal?.solution || '',
      total_price: proposal?.total_price != null ? String(proposal.total_price) : '',
      status: proposal?.status || 'rascunho',
    })
  }, [open, proposal])

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
        invoice_number: form.invoice_number || '',
        date: form.date ? new Date(form.date).toISOString() : '',
        defect: form.defect || '',
        solution: form.solution || '',
        total_price: Number(form.total_price) || 0,
        status: form.status || 'rascunho',
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nº Proposta</Label>
              <Input
                value={form.proposal_number || ''}
                onChange={(e) => set('proposal_number', e.target.value)}
                placeholder="Ex: PAT-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº Nota Fiscal</Label>
              <Input
                value={form.invoice_number || ''}
                onChange={(e) => set('invoice_number', e.target.value)}
                placeholder="Ex: NF-12345"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date || ''}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.total_price || ''}
                onChange={(e) => set('total_price', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Defeito</Label>
            <Textarea
              value={form.defect || ''}
              onChange={(e) => set('defect', e.target.value)}
              rows={3}
              placeholder="Descreva o defeito apresentado..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Solução</Label>
            <Textarea
              value={form.solution || ''}
              onChange={(e) => set('solution', e.target.value)}
              rows={3}
              placeholder="Descreva a solução proposta..."
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
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Criar PAT'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

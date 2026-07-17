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
import { createProposal, updateProposal, getLead, type Lead, type Proposal } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { LeadSelect } from './lead-select'

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
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (proposal?.expand?.lead_id) {
      setSelectedLead(proposal.expand.lead_id)
    } else if (proposal?.lead_id) {
      getLead(proposal.lead_id)
        .then(setSelectedLead)
        .catch(() => {})
    } else {
      setSelectedLead(null)
    }
    setForm({
      title: proposal?.title || '',
      description: proposal?.description || '',
      status: proposal?.status || 'rascunho',
      total_value: String(proposal?.total_value ?? ''),
      expiry_date: proposal?.expiry_date
        ? format(new Date(proposal.expiry_date), 'yyyy-MM-dd')
        : '',
    })
  }, [open, proposal])

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
        total_value: Number(form.total_value) || 0,
        expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : '',
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <LeadSelect value={selectedLead} onChange={setSelectedLead} />
          </div>
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={form.title || ''}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
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
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.total_value || ''}
                onChange={(e) => set('total_value', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Validade</Label>
            <Input
              type="date"
              value={form.expiry_date || ''}
              onChange={(e) => set('expiry_date', e.target.value)}
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

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { updateLead, type Lead } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface LeadEditDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function LeadEditDialog({ lead, open, onOpenChange, onSaved }: LeadEditDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (lead && open) {
      setForm({
        name: lead.name || '',
        address: lead.address || '',
        cep: lead.cep || '',
        city: lead.city || '',
        uf: lead.uf || '',
        neighborhood: lead.neighborhood || '',
        phone: lead.phone || '',
        cnpj: lead.cnpj || '',
        ie: lead.ie || '',
        email: lead.email || '',
        contact_name: lead.contact_name || '',
        activity: lead.activity || '',
        status: lead.status || 'novo',
      })
    }
  }, [lead, open])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lead) return
    setSaving(true)
    try {
      await updateLead(lead.id, form)
      toast({ title: 'Cliente atualizado com sucesso!' })
      onOpenChange(false)
      onSaved?.()
    } catch {
      toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' })
    }
    setSaving(false)
  }

  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome do Cliente *</Label>
            <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CEP</Label>
            <Input value={form.cep || ''} onChange={(e) => set('cep', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Cidade</Label>
              <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Input
                value={form.uf || ''}
                onChange={(e) => set('uf', e.target.value)}
                maxLength={3}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Bairro</Label>
            <Input
              value={form.neighborhood || ''}
              onChange={(e) => set('neighborhood', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input value={form.cnpj || ''} onChange={(e) => set('cnpj', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>I.E.</Label>
            <Input value={form.ie || ''} onChange={(e) => set('ie', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pessoa de Contato</Label>
            <Input
              value={form.contact_name || ''}
              onChange={(e) => set('contact_name', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Atividade</Label>
            <Input
              value={form.activity || ''}
              onChange={(e) => set('activity', e.target.value)}
              placeholder="Ex: MOVELEIRO"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="morno">Morno</SelectItem>
                <SelectItem value="quente">Quente</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

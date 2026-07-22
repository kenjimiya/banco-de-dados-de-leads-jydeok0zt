import { useState } from 'react'
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
import { createLead, type Lead } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus } from 'lucide-react'

interface QuickCreateLeadDialogProps {
  onCreated: (lead: Lead) => void
  trigger?: React.ReactNode
}

export function QuickCreateLeadDialog({ onCreated, trigger }: QuickCreateLeadDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setSaving(true)
    try {
      const lead = (await createLead({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
        uf: fd.get('uf') as string,
        activity: fd.get('activity') as string,
        cnpj: fd.get('cnpj') as string,
        ie: fd.get('ie') as string,
        cep: fd.get('cep') as string,
        address: fd.get('address') as string,
        city: fd.get('city') as string,
        neighborhood: fd.get('neighborhood') as string,
        contact_name: fd.get('contact_name') as string,
        status: 'novo',
        notes: '',
        total_spent: 0,
      })) as Lead
      toast({ title: 'Cliente cadastrado com sucesso!' })
      onCreated(lead)
      setOpen(false)
    } catch {
      toast({ title: 'Erro ao cadastrar cliente', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome do Cliente *</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input name="address" />
          </div>
          <div className="space-y-1.5">
            <Label>CEP</Label>
            <Input name="cep" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Cidade</Label>
              <Input name="city" />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Input name="uf" maxLength={3} placeholder="Ex: SC" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Bairro</Label>
            <Input name="neighborhood" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input name="phone" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input name="cnpj" />
            </div>
            <div className="space-y-1.5">
              <Label>I.E.</Label>
              <Input name="ie" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label>Pessoa de Contato</Label>
            <Input name="contact_name" />
          </div>
          <div className="space-y-1.5">
            <Label>Atividade</Label>
            <Input name="activity" placeholder="Ex: MOVELEIRO" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cadastrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

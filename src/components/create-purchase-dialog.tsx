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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPurchase, getLeads, type Lead } from '@/services/api'
import { QuickCreateLeadDialog } from './quick-create-lead-dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const fmtCurrency = (v: number) => `R$ ${v.toFixed(2)}`

export function CreatePurchaseDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadOpen, setLeadOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      getLeads()
        .then(setLeads)
        .catch(() => {})
      setForm({
        product_name: '',
        quantity: '',
        unit_price: '',
        sale_type: 'VENDA',
        invoice_number: '',
        pi_number: '',
        raw_material_cost: '',
        shipping_cost: '',
        total_cost: '',
        payment_term: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
      })
      setSelectedLead(null)
    }
  }, [open])

  const totalPrice = useMemo(
    () => (Number(form.quantity) || 0) * (Number(form.unit_price) || 0),
    [form.quantity, form.unit_price],
  )
  const grandTotal = useMemo(
    () => totalPrice + (Number(form.shipping_cost) || 0),
    [totalPrice, form.shipping_cost],
  )

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    if (!form.product_name.trim()) {
      toast({ title: 'Produto é obrigatório', variant: 'destructive' })
      return
    }
    const qty = Number(form.quantity)
    if (!qty || qty <= 0) {
      toast({ title: 'Quantidade deve ser maior que zero', variant: 'destructive' })
      return
    }
    const unitPrice = Number(form.unit_price)
    if (unitPrice < 0) {
      toast({ title: 'Preço não pode ser negativo', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await createPurchase({
        lead_id: selectedLead.id,
        product_name: form.product_name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
        purchase_date: new Date(form.purchase_date).toISOString(),
        sale_type: form.sale_type,
        invoice_number: form.invoice_number,
        pi_number: form.pi_number,
        raw_material_cost: Number(form.raw_material_cost) || 0,
        shipping_cost: Number(form.shipping_cost) || 0,
        total_cost: Number(form.total_cost) || 0,
        grand_total: grandTotal,
        payment_term: Number(form.payment_term) || 0,
      })
      toast({ title: 'Venda registrada com sucesso!' })
      setOpen(false)
      onCreated()
    } catch {
      toast({ title: 'Erro ao registrar venda', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-elevation">
          <Plus className="w-4 h-4 mr-2" /> Nova Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nova Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Popover open={leadOpen} onOpenChange={setLeadOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedLead
                    ? `${selectedLead.name}${selectedLead.uf ? ` (${selectedLead.uf})` : ''}`
                    : 'Selecione um cliente...'}
                  <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                align="start"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
              >
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {leads.map((lead) => (
                        <CommandItem
                          key={lead.id}
                          onSelect={() => {
                            setSelectedLead(lead)
                            setLeadOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 w-4 h-4',
                              selectedLead?.id === lead.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {lead.name}
                          {lead.uf ? ` (${lead.uf})` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <QuickCreateLeadDialog
              onCreated={(lead) => {
                setLeads((prev) => [...prev, lead])
                setSelectedLead(lead)
              }}
              trigger={
                <Button type="button" variant="link" size="sm" className="p-0 h-auto">
                  + Cadastrar novo cliente
                </Button>
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Produto *</Label>
            <Input
              value={form.product_name || ''}
              onChange={(e) => set('product_name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity || ''}
                onChange={(e) => set('quantity', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Unit. (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unit_price || ''}
                onChange={(e) => set('unit_price', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.sale_type} onValueChange={(v) => set('sale_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENDA">Venda</SelectItem>
                  <SelectItem value="REPRESENTADA">Representada</SelectItem>
                  <SelectItem value="AMOSTRA">Amostra</SelectItem>
                  <SelectItem value="BONIFICACAO">Bonificação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.purchase_date || ''}
                onChange={(e) => set('purchase_date', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NF</Label>
              <Input
                value={form.invoice_number || ''}
                onChange={(e) => set('invoice_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>PI</Label>
              <Input
                value={form.pi_number || ''}
                onChange={(e) => set('pi_number', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo MP (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.raw_material_cost || ''}
                onChange={(e) => set('raw_material_cost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Custo Total (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.total_cost || ''}
                onChange={(e) => set('total_cost', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frete (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.shipping_cost || ''}
                onChange={(e) => set('shipping_cost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo (dias)</Label>
              <Input
                type="number"
                min="0"
                value={form.payment_term || ''}
                onChange={(e) => set('payment_term', e.target.value)}
              />
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total (qtd × unit):</span>
              <span className="font-medium">{fmtCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total c/ Frete:</span>
              <span className="font-bold text-primary">{fmtCurrency(grandTotal)}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar Venda
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

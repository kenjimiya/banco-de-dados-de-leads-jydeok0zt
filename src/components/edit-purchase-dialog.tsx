import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePurchase, type Purchase } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface EditPurchaseDialogProps {
  purchase: Purchase | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPurchaseDialog({ purchase, open, onOpenChange }: EditPurchaseDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (purchase && open) {
      setForm({
        product_name: purchase.product_name || '',
        quantity: String(purchase.quantity ?? ''),
        unit_price: String(purchase.unit_price ?? ''),
        purchase_date: purchase.purchase_date
          ? format(new Date(purchase.purchase_date), 'yyyy-MM-dd')
          : '',
        sale_type: purchase.sale_type || '',
        invoice_number: purchase.invoice_number || '',
        pi_number: purchase.pi_number || '',
        raw_material_cost: String(purchase.raw_material_cost ?? ''),
        shipping_cost: String(purchase.shipping_cost ?? ''),
        total_cost: String(purchase.total_cost ?? ''),
        grand_total: String(purchase.grand_total ?? ''),
        payment_term: String(purchase.payment_term ?? ''),
      })
    }
  }, [purchase, open])

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchase) return
    setSaving(true)
    try {
      const qty = Number(form.quantity) || 0
      const unitPrice = Number(form.unit_price) || 0
      await updatePurchase(purchase.id, {
        product_name: form.product_name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: qty * unitPrice,
        purchase_date: form.purchase_date
          ? new Date(form.purchase_date).toISOString()
          : new Date().toISOString(),
        sale_type: form.sale_type,
        invoice_number: form.invoice_number,
        pi_number: form.pi_number,
        raw_material_cost: Number(form.raw_material_cost) || 0,
        shipping_cost: Number(form.shipping_cost) || 0,
        total_cost: Number(form.total_cost) || 0,
        grand_total: Number(form.grand_total) || 0,
        payment_term: Number(form.payment_term) || 0,
      })
      toast({ title: 'Venda atualizada com sucesso!' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Erro ao atualizar venda', variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Input
              value={form.product_name || ''}
              onChange={(e) => set('product_name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={form.quantity || ''}
                onChange={(e) => set('quantity', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Unit. (R$)</Label>
              <Input
                type="number"
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
              <Input
                value={form.sale_type || ''}
                onChange={(e) => set('sale_type', e.target.value)}
                placeholder="Ex: VENDA"
              />
            </div>
            <div className="space-y-2">
              <Label>NF</Label>
              <Input
                value={form.invoice_number || ''}
                onChange={(e) => set('invoice_number', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>PI</Label>
              <Input
                value={form.pi_number || ''}
                onChange={(e) => set('pi_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
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
              <Label>Custo MP (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.raw_material_cost || ''}
                onChange={(e) => set('raw_material_cost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frete (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.shipping_cost || ''}
                onChange={(e) => set('shipping_cost', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.total_cost || ''}
                onChange={(e) => set('total_cost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total c/ Frete (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.grand_total || ''}
                onChange={(e) => set('grand_total', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prazo de Pagamento (dias)</Label>
            <Input
              type="number"
              value={form.payment_term || ''}
              onChange={(e) => set('payment_term', e.target.value)}
            />
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

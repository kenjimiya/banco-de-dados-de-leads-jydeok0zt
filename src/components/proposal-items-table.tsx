import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import type { ProposalItem } from '@/services/api'

const fmtCurrency = (v: number) => `R$ ${v.toFixed(2)}`

export function ProposalItemsTable({
  items,
  onChange,
}: {
  items: ProposalItem[]
  onChange: (items: ProposalItem[]) => void
}) {
  const addItem = () =>
    onChange([...items, { quantity: 1, description: '', unit_price: 0, total_price: 0 }])

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof ProposalItem, value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === 'quantity' || field === 'unit_price') {
      item[field] = Number(value) || 0
      item.total_price = item.quantity * item.unit_price
    } else if (field === 'description') {
      item.description = value
    }
    updated[index] = item
    onChange(updated)
  }

  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2 bg-secondary/20">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2 space-y-1">
                <span className="text-xs text-muted-foreground">Qtd</span>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  placeholder="Qtd"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <span className="text-xs text-muted-foreground">Preço Unit.</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price || ''}
                  onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                  placeholder="Preço Unit."
                />
              </div>
              <div className="col-span-3 space-y-1">
                <span className="text-xs text-muted-foreground">Total</span>
                <div className="flex items-center h-9 font-medium text-sm">
                  {fmtCurrency(item.total_price)}
                </div>
              </div>
              <div className="col-span-4 flex justify-end items-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItem(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Descrição do produto/serviço</span>
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                rows={7}
                className="min-h-[150px] resize-y"
                placeholder="Descreva detalhadamente o produto ou serviço..."
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Item
        </Button>
        <div className="text-right">
          <span className="text-muted-foreground text-sm">Total Geral: </span>
          <span className="font-bold text-primary text-lg">{fmtCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

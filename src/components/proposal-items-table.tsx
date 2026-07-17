import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input
              type="number"
              min="1"
              value={item.quantity || ''}
              onChange={(e) => updateItem(i, 'quantity', e.target.value)}
              className="col-span-2"
              placeholder="Qtd"
            />
            <Input
              value={item.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
              className="col-span-5"
              placeholder="Descrição do produto/serviço"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price || ''}
              onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
              className="col-span-2"
              placeholder="Preço Unit."
            />
            <div className="col-span-2 text-right font-medium text-sm">
              {fmtCurrency(item.total_price)}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1 h-8 w-8 text-destructive"
              onClick={() => removeItem(i)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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

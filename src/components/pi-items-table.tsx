import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import type { InternalOrderItem } from '@/services/api'
import { fmtCurrency } from '@/lib/utils'

export function PiItemsTable({
  items,
  onChange,
}: {
  items: InternalOrderItem[]
  onChange: (items: InternalOrderItem[]) => void
}) {
  const addItem = () =>
    onChange([...items, { description: '', quantity: 1, unit_price: 0, ncm: '', subtotal: 0 }])

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof InternalOrderItem, value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === 'quantity' || field === 'unit_price') {
      item[field] = Number(value) || 0
      item.subtotal = item.quantity * item.unit_price
    } else if (field === 'description' || field === 'ncm') {
      item[field] = value
    }
    updated[index] = item
    onChange(updated)
  }

  const grandTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input
              value={item.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
              className="col-span-3"
              placeholder="Descrição"
            />
            <Input
              value={item.ncm}
              onChange={(e) => updateItem(i, 'ncm', e.target.value)}
              className="col-span-2"
              placeholder="NCM"
            />
            <Input
              type="number"
              min="1"
              value={item.quantity || ''}
              onChange={(e) => updateItem(i, 'quantity', e.target.value)}
              className="col-span-3 min-w-[90px]"
              placeholder="Qtd"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price || ''}
              onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
              className="col-span-2"
              placeholder="R$ Unit"
            />
            <div className="col-span-1 text-right font-medium text-sm">
              {fmtCurrency(item.subtotal)}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1 h-8 w-8 text-destructive ml-auto"
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
          <span className="text-muted-foreground text-sm">Soma Itens: </span>
          <span className="font-bold text-primary text-lg">{fmtCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

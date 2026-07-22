import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import type { InternalOrderItem } from '@/services/api'

export function ProductionItemsTable({
  items,
  onChange,
}: {
  items: InternalOrderItem[]
  onChange: (items: InternalOrderItem[]) => void
}) {
  const addItem = () =>
    onChange([...items, { description: '', quantity: 1, unit_price: 0, ncm: '', subtotal: 0 }])

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateItem = (index: number, field: 'description' | 'quantity', value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === 'quantity') {
      item.quantity = Number(value) || 0
    } else {
      item.description = value
    }
    updated[index] = item
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input
              type="number"
              min="1"
              step="1"
              value={item.quantity || ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^\d+$/.test(val)) {
                  updateItem(i, 'quantity', val)
                }
              }}
              className="col-span-2 min-w-[80px]"
              placeholder="Qtd"
            />
            <Input
              value={item.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
              className="col-span-9"
              placeholder="Composição / Descrição técnica"
            />
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
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Item
      </Button>
    </div>
  )
}

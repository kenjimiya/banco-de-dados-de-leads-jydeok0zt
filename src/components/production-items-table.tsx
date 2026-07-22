import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import type { InternalOrderItem } from '@/services/api'

const NEW_ITEM = (): InternalOrderItem => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  ncm: '',
  subtotal: 0,
  substitution: '',
  serial_number: '',
  equipment_date: '',
  delivery_date: '',
})

export function ProductionItemsTable({
  items,
  onChange,
}: {
  items: InternalOrderItem[]
  onChange: (items: InternalOrderItem[]) => void
}) {
  const addItem = () => onChange([...items, NEW_ITEM()])

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof InternalOrderItem, value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === 'quantity') {
      item.quantity = Number(value) || 0
    } else {
      ;(item as Record<string, unknown>)[field] = value
    }
    updated[index] = item
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px] space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1 pb-1">
            <div className="col-span-1">Qtd</div>
            <div className="col-span-2">Equipamento</div>
            <div className="col-span-2">Subst.</div>
            <div className="col-span-2">Nº Série</div>
            <div className="col-span-2">Data Eq.</div>
            <div className="col-span-2">Entrega</div>
            <div className="col-span-1" />
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input
                type="number"
                min="1"
                value={item.quantity || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^\d+$/.test(val)) updateItem(i, 'quantity', val)
                }}
                className="col-span-1"
                placeholder="Qtd"
              />
              <Input
                value={item.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                className="col-span-2"
                placeholder="Equipamento"
              />
              <Input
                value={item.substitution || ''}
                onChange={(e) => updateItem(i, 'substitution', e.target.value)}
                className="col-span-2"
                placeholder="Substituição"
              />
              <Input
                value={item.serial_number || ''}
                onChange={(e) => updateItem(i, 'serial_number', e.target.value)}
                className="col-span-2"
                placeholder="Nº Série"
              />
              <Input
                type="date"
                value={item.equipment_date || ''}
                onChange={(e) => updateItem(i, 'equipment_date', e.target.value)}
                className="col-span-2 min-w-[150px]"
              />
              <Input
                type="date"
                value={item.delivery_date || ''}
                onChange={(e) => updateItem(i, 'delivery_date', e.target.value)}
                className="col-span-2 min-w-[150px]"
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
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Item
      </Button>
    </div>
  )
}

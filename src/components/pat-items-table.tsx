import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import type { TechnicalProposalItem } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtCurrency } from '@/lib/utils'

export function PatItemsTable({
  items,
  onChange,
}: {
  items: TechnicalProposalItem[]
  onChange: (items: TechnicalProposalItem[]) => void
}) {
  const addItem = () =>
    onChange([
      ...items,
      {
        description: '',
        serial_number: '',
        manufacture_date: '',
        defect: '',
        solution: '',
        unit_price: 0,
        quantity: 1,
        total_price: 0,
      },
    ])

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof TechnicalProposalItem, value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === 'quantity' || field === 'unit_price') {
      item[field] = Number(value) || 0
      item.total_price = item.quantity * item.unit_price
    } else {
      ;(item as any)[field] = value
    }
    updated[index] = item
    onChange(updated)
  }

  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <Card key={i} className="relative overflow-visible shadow-subtle border-border/50">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full z-10 shadow-sm"
            onClick={() => removeItem(i)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <CardHeader className="py-3 px-4 bg-secondary/30 border-b border-border/50">
            <CardTitle className="text-sm font-medium">Item {i + 1}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-3">
                <Label>Descrição</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="Ex: Transformador UV 10KVA/380V"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nº Série</Label>
                <Input
                  value={item.serial_number}
                  onChange={(e) => updateItem(i, 'serial_number', e.target.value)}
                  placeholder="Ex: 2004"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Fabricação</Label>
                <Input
                  type="date"
                  value={item.manufacture_date}
                  onChange={(e) => updateItem(i, 'manufacture_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Defeito</Label>
              <Textarea
                value={item.defect}
                onChange={(e) => updateItem(i, 'defect', e.target.value)}
                placeholder="Descreva os defeitos apresentados..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Solução</Label>
              <Textarea
                value={item.solution}
                onChange={(e) => updateItem(i, 'solution', e.target.value)}
                placeholder="Descreva a solução proposta..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor Unit. (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price || ''}
                  onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subtotal</Label>
                <div className="h-10 flex items-center px-3 bg-secondary/50 rounded-md font-semibold text-primary">
                  {fmtCurrency(item.total_price)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl border border-border/50">
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Item Técnico
        </Button>
        <div className="text-right">
          <span className="text-muted-foreground text-sm mr-2">Total Itens:</span>
          <span className="font-bold text-primary text-xl">{fmtCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

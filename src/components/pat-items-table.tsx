import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import type { TechnicalProposalItem } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtCurrency } from '@/lib/utils'

interface Diagnostic {
  defect: string
  solution: string
  price: number
}

function recalcItem(item: TechnicalProposalItem): TechnicalProposalItem {
  const diagnostics: Diagnostic[] = item.diagnostics || []
  const unitPrice = diagnostics.reduce((sum, d) => sum + (Number(d.price) || 0), 0)
  const qty = Number(item.quantity) || 1
  return { ...item, unit_price: unitPrice, total_price: unitPrice * qty }
}

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
        diagnostics: [{ defect: '', solution: '', price: 0 }],
        unit_price: 0,
        quantity: 1,
        total_price: 0,
      },
    ])

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof TechnicalProposalItem, value: string) => {
    const updated = [...items]
    const item = { ...updated[index] }
    if (field === 'quantity') {
      item.quantity = Number(value) || 1
    } else {
      ;(item as any)[field] = value
    }
    updated[index] = recalcItem(item)
    onChange(updated)
  }

  const addDiagnostic = (itemIndex: number) => {
    const updated = [...items]
    const item = { ...updated[itemIndex] }
    item.diagnostics = [...(item.diagnostics || []), { defect: '', solution: '', price: 0 }]
    updated[itemIndex] = item
    onChange(updated)
  }

  const removeDiagnostic = (itemIndex: number, diagIndex: number) => {
    const updated = [...items]
    const item = { ...updated[itemIndex] }
    item.diagnostics = (item.diagnostics || []).filter((_, i) => i !== diagIndex)
    updated[itemIndex] = recalcItem(item)
    onChange(updated)
  }

  const updateDiagnostic = (
    itemIndex: number,
    diagIndex: number,
    field: keyof Diagnostic,
    value: string,
  ) => {
    const updated = [...items]
    const item = { ...updated[itemIndex] }
    item.diagnostics = [...(item.diagnostics || [])]
    const diag = { ...item.diagnostics[diagIndex] }
    if (field === 'price') {
      diag.price = Number(value) || 0
    } else {
      ;(diag as any)[field] = value
    }
    item.diagnostics[diagIndex] = diag
    updated[itemIndex] = recalcItem(item)
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

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-primary">
                Laudo Técnico (Diagnósticos)
              </Label>
              <div className="space-y-3">
                {(item.diagnostics || []).map((diag: Diagnostic, di: number) => (
                  <div
                    key={di}
                    className="relative border border-border/50 rounded-lg p-3 space-y-3 bg-secondary/10"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 z-10"
                      onClick={() => removeDiagnostic(i, di)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Defeito {di + 1}</Label>
                      <Textarea
                        value={diag.defect}
                        onChange={(e) => updateDiagnostic(i, di, 'defect', e.target.value)}
                        placeholder="Descreva o defeito encontrado..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Solução {di + 1}</Label>
                      <Textarea
                        value={diag.solution}
                        onChange={(e) => updateDiagnostic(i, di, 'solution', e.target.value)}
                        placeholder="Descreva a solução técnica..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Preço (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={diag.price || ''}
                          onChange={(e) => updateDiagnostic(i, di, 'price', e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addDiagnostic(i)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Diagnóstico
              </Button>
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
                <div className="h-10 flex items-center px-3 bg-secondary/50 rounded-md font-semibold text-primary">
                  {fmtCurrency(item.unit_price || 0)}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subtotal</Label>
                <div className="h-10 flex items-center px-3 bg-secondary/50 rounded-md font-semibold text-primary">
                  {fmtCurrency(item.total_price || 0)}
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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import type { TechnicalDiagnostic, ReplacementPart } from '@/services/api'
import { fmtCurrency } from '@/lib/utils'

function recalcPart(part: ReplacementPart): ReplacementPart {
  const qty = Number(part.quantity) || 1
  const price = Number(part.unit_price) || 0
  return { ...part, total_price: qty * price }
}

function diagnosticTotal(diag: TechnicalDiagnostic): number {
  return (diag.parts || []).reduce((sum, p) => sum + (p.total_price || 0), 0)
}

export function PatItemsTable({
  items,
  onChange,
}: {
  items: TechnicalDiagnostic[]
  onChange: (items: TechnicalDiagnostic[]) => void
}) {
  const addDiagnostic = () =>
    onChange([
      ...items,
      {
        equipment: '',
        serial_number: '',
        manufacturing_date: '',
        defect: '',
        solution: '',
        parts: [{ description: '', quantity: 1, unit_price: 0, total_price: 0 }],
      },
    ])

  const removeDiagnostic = (index: number) => onChange(items.filter((_, i) => i !== index))

  const updateDiagnostic = (index: number, field: keyof TechnicalDiagnostic, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addPart = (diagIndex: number) => {
    const updated = [...items]
    updated[diagIndex] = {
      ...updated[diagIndex],
      parts: [
        ...(updated[diagIndex].parts || []),
        { description: '', quantity: 1, unit_price: 0, total_price: 0 },
      ],
    }
    onChange(updated)
  }

  const removePart = (diagIndex: number, partIndex: number) => {
    const updated = [...items]
    updated[diagIndex] = {
      ...updated[diagIndex],
      parts: (updated[diagIndex].parts || []).filter((_, i) => i !== partIndex),
    }
    onChange(updated)
  }

  const updatePart = (
    diagIndex: number,
    partIndex: number,
    field: keyof ReplacementPart,
    value: string,
  ) => {
    const updated = [...items]
    const parts = [...(updated[diagIndex].parts || [])]
    const part = { ...parts[partIndex] }
    if (field === 'quantity' || field === 'unit_price') {
      ;(part as any)[field] = Number(value) || 0
    } else {
      ;(part as any)[field] = value
    }
    parts[partIndex] = recalcPart(part)
    updated[diagIndex] = { ...updated[diagIndex], parts }
    onChange(updated)
  }

  const grandTotal = items.reduce((sum, d) => sum + diagnosticTotal(d), 0)

  return (
    <div className="space-y-4">
      {items.map((diag, i) => (
        <Card key={i} className="relative overflow-visible shadow-subtle border-border/50">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full z-10 shadow-sm"
            onClick={() => removeDiagnostic(i)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <CardHeader className="py-3 px-4 bg-secondary/30 border-b border-border/50">
            <CardTitle className="text-sm font-medium">Laudo Técnico {i + 1}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-primary">Equipamento</Label>
                <Input
                  value={diag.equipment || ''}
                  onChange={(e) => updateDiagnostic(i, 'equipment', e.target.value)}
                  placeholder="Nome do equipamento"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-primary">Número de Série</Label>
                <Input
                  value={diag.serial_number || ''}
                  onChange={(e) => updateDiagnostic(i, 'serial_number', e.target.value)}
                  placeholder="Ex: SN-001234"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-primary">Data de Fabricação</Label>
                <Input
                  type="date"
                  value={diag.manufacturing_date || ''}
                  onChange={(e) => updateDiagnostic(i, 'manufacturing_date', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-primary">Defeito {i + 1}</Label>
                <Textarea
                  value={diag.defect}
                  onChange={(e) => updateDiagnostic(i, 'defect', e.target.value)}
                  placeholder="Descreva o defeito identificado..."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-primary">Solução {i + 1}</Label>
                <Textarea
                  value={diag.solution}
                  onChange={(e) => updateDiagnostic(i, 'solution', e.target.value)}
                  placeholder="Descreva a solução técnica aplicada..."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-primary">Itens a Substituir</Label>
              <div className="space-y-2">
                {(diag.parts || []).map((part: ReplacementPart, pi: number) => (
                  <div
                    key={pi}
                    className="relative grid grid-cols-12 gap-2 items-end border border-border/50 rounded-lg p-3 bg-secondary/10"
                  >
                    <div className="col-span-5 space-y-1.5">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={part.description}
                        onChange={(e) => updatePart(i, pi, 'description', e.target.value)}
                        placeholder="Descrição do item de substituição"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity || ''}
                        onChange={(e) => updatePart(i, pi, 'quantity', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Valor Unit. (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={part.unit_price || ''}
                        onChange={(e) => updatePart(i, pi, 'unit_price', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="h-10 flex items-center px-3 bg-secondary/50 rounded-md font-semibold text-primary text-sm">
                        {fmtCurrency(part.total_price || 0)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-10 w-10 text-destructive"
                      onClick={() => removePart(i, pi)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addPart(i)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Item
              </Button>
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <span className="text-muted-foreground text-sm mr-2">Subtotal Laudo {i + 1}:</span>
                <span className="font-bold text-primary">{fmtCurrency(diagnosticTotal(diag))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl border border-border/50">
        <Button type="button" variant="outline" size="sm" onClick={addDiagnostic}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Laudo Técnico
        </Button>
        <div className="text-right">
          <span className="text-muted-foreground text-sm mr-2">Total Geral:</span>
          <span className="font-bold text-primary text-xl">{fmtCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

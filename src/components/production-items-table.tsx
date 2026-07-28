import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Paperclip, ChevronDown, ChevronRight } from 'lucide-react'
import type { ProductionEquipment, ReplacementItem } from '@/services/api'
import { fmtCurrency } from '@/lib/utils'

const NEW_REPLACEMENT = (): ReplacementItem => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
})

const NEW_EQUIPMENT = (): ProductionEquipment => ({
  serialNumber: '',
  equipmentDate: '',
  deliveryDate: '',
  fileUrl: '',
  fileName: '',
  replacementItems: [NEW_REPLACEMENT()],
})

export function ProductionItemsTable({
  items,
  onChange,
}: {
  items: ProductionEquipment[]
  onChange: (items: ProductionEquipment[]) => void
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const addEquipment = () => {
    const newItems = [...items, NEW_EQUIPMENT()]
    onChange(newItems)
    setExpanded(new Set([...expanded, newItems.length - 1]))
  }

  const removeEquipment = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
    const newExpanded = new Set<number>()
    expanded.forEach((idx) => {
      if (idx < index) newExpanded.add(idx)
      else if (idx > index) newExpanded.add(idx - 1)
    })
    setExpanded(newExpanded)
  }

  const updateEquipment = (index: number, field: keyof ProductionEquipment, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addReplacement = (eqIndex: number) => {
    const updated = [...items]
    updated[eqIndex] = {
      ...updated[eqIndex],
      replacementItems: [...updated[eqIndex].replacementItems, NEW_REPLACEMENT()],
    }
    onChange(updated)
  }

  const removeReplacement = (eqIndex: number, riIndex: number) => {
    const updated = [...items]
    updated[eqIndex] = {
      ...updated[eqIndex],
      replacementItems: updated[eqIndex].replacementItems.filter((_, i) => i !== riIndex),
    }
    onChange(updated)
  }

  const updateReplacement = (
    eqIndex: number,
    riIndex: number,
    field: keyof ReplacementItem,
    value: string,
  ) => {
    const updated = [...items]
    const item = { ...updated[eqIndex].replacementItems[riIndex] }
    if (field === 'quantity' || field === 'unitPrice') {
      ;(item as Record<string, unknown>)[field] = Number(value) || 0
      item.total = item.quantity * item.unitPrice
    } else {
      ;(item as Record<string, unknown>)[field] = value
    }
    updated[eqIndex] = {
      ...updated[eqIndex],
      replacementItems: [
        ...updated[eqIndex].replacementItems.slice(0, riIndex),
        item,
        ...updated[eqIndex].replacementItems.slice(riIndex + 1),
      ],
    }
    onChange(updated)
  }

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(index)) newExpanded.delete(index)
    else newExpanded.add(index)
    setExpanded(newExpanded)
  }

  const handleFileSelect = (eqIndex: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      const updated = [...items]
      updated[eqIndex] = { ...updated[eqIndex], fileName: file.name, fileUrl: '' }
      onChange(updated)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const updated = [...items]
      updated[eqIndex] = {
        ...updated[eqIndex],
        fileUrl: reader.result as string,
        fileName: file.name,
      }
      onChange(updated)
    }
    reader.readAsDataURL(file)
  }

  const grandTotal = items.reduce(
    (sum, eq) => sum + (eq.replacementItems?.reduce((s, ri) => s + (ri.total || 0), 0) || 0),
    0,
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1 pb-1">
        <div className="col-span-1" />
        <div className="col-span-3">Nº Série *</div>
        <div className="col-span-2">Data Eq.</div>
        <div className="col-span-2">Entrega</div>
        <div className="col-span-1 text-center">Anexo</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1" />
      </div>
      <div className="space-y-3">
        {items.map((equipment, eqIndex) => {
          const isExpanded = expanded.has(eqIndex)
          const equipmentTotal =
            equipment.replacementItems?.reduce((s, ri) => s + (ri.total || 0), 0) || 0
          return (
            <div key={eqIndex} className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center bg-secondary/30 p-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(eqIndex)}
                  className="col-span-1 flex items-center justify-center"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <Input
                  value={equipment.serialNumber}
                  onChange={(e) => updateEquipment(eqIndex, 'serialNumber', e.target.value)}
                  className="col-span-3"
                  placeholder="Nº Série *"
                />
                <Input
                  type="date"
                  value={equipment.equipmentDate || ''}
                  onChange={(e) => updateEquipment(eqIndex, 'equipmentDate', e.target.value)}
                  className="col-span-2 min-w-[130px]"
                />
                <Input
                  type="date"
                  value={equipment.deliveryDate || ''}
                  onChange={(e) => updateEquipment(eqIndex, 'deliveryDate', e.target.value)}
                  className="col-span-2 min-w-[130px]"
                />
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[eqIndex] = el
                    }}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(eqIndex, file)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[eqIndex]?.click()}
                    className={`p-1 rounded hover:bg-secondary transition-colors ${
                      equipment.fileName ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    title={equipment.fileName || 'Anexar arquivo'}
                  >
                    <Paperclip
                      className="w-4 h-4"
                      fill={equipment.fileName ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
                <div className="col-span-2 text-right font-medium text-sm">
                  {fmtCurrency(equipmentTotal)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-1 h-8 w-8 text-destructive ml-auto"
                  onClick={() => removeEquipment(eqIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {isExpanded && (
                <div className="p-2 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1 pb-1">
                    <div className="col-span-5">Descrição</div>
                    <div className="col-span-2">Qtd</div>
                    <div className="col-span-2">R$ Unit</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-1" />
                  </div>
                  {equipment.replacementItems?.map((ri, riIndex) => (
                    <div key={riIndex} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        value={ri.description}
                        onChange={(e) =>
                          updateReplacement(eqIndex, riIndex, 'description', e.target.value)
                        }
                        className="col-span-5"
                        placeholder="Descrição do item"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={ri.quantity || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || /^\d+$/.test(val))
                            updateReplacement(eqIndex, riIndex, 'quantity', val)
                        }}
                        className="col-span-2"
                        placeholder="Qtd"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ri.unitPrice || ''}
                        onChange={(e) =>
                          updateReplacement(eqIndex, riIndex, 'unitPrice', e.target.value)
                        }
                        className="col-span-2"
                        placeholder="R$"
                      />
                      <div className="col-span-2 text-right font-medium text-sm">
                        {fmtCurrency(ri.total)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-1 h-8 w-8 text-destructive ml-auto"
                        onClick={() => removeReplacement(eqIndex, riIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addReplacement(eqIndex)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={addEquipment}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
        </Button>
        <div className="text-right">
          <span className="text-muted-foreground text-sm">Total: </span>
          <span className="font-bold text-primary text-lg">{fmtCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

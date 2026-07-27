import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getProposals,
  getTechnicalProposals,
  createProposal,
  createTechnicalProposal,
  type Proposal,
  type TechnicalProposal,
} from '@/services/api'
import { format } from 'date-fns'
import { Search, Loader2, FileText, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ImportDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'pcs' | 'pat'
  onImported: () => void
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aceito', label: 'Aceito' },
  { value: 'recusado', label: 'Recusado' },
]

export function ImportDocumentDialog({
  open,
  onOpenChange,
  mode,
  onImported,
}: ImportDocumentDialogProps) {
  const { toast } = useToast()
  const [records, setRecords] = useState<(Proposal | TechnicalProposal)[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const isPcs = mode === 'pcs'

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const fetcher = isPcs ? getProposals : getTechnicalProposals
    fetcher()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
    setSelectedIds(new Set())
    setSearch('')
    setStatusFilter('all')
  }, [open, isPcs])

  const filtered = useMemo(() => {
    return records.filter((r: any) => {
      const leadName = r.expand?.lead_id?.name || ''
      const dateField = isPcs ? r.expiry_date : r.date
      const dateStr = dateField ? format(new Date(dateField), 'dd/MM/yyyy') : ''
      const searchText = isPcs
        ? `${r.title || ''} ${leadName} ${dateStr} ${r.status || ''}`.toLowerCase()
        : `${r.proposal_number || ''} ${r.defect || ''} ${leadName} ${dateStr} ${r.status || ''}`.toLowerCase()
      if (search && !searchText.includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [records, search, statusFilter, isPcs])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((r) => r.id)))
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const selected = records.filter((r) => selectedIds.has(r.id))
      if (isPcs) {
        await Promise.all(
          selected.map(async (r) => {
            const p = r as Proposal
            await createProposal({
              lead_id: p.lead_id,
              title: `${p.title} (Cópia)`,
              revision: '00',
              description: p.description || '',
              status: 'rascunho',
              total_value: p.total_value || 0,
              items: p.items || [],
              payment_condition: p.payment_condition || '',
              delivery_time: p.delivery_time || '',
              composition: p.composition || '',
              freight_info: p.freight_info || '',
            })
          }),
        )
      } else {
        await Promise.all(
          selected.map(async (r) => {
            const t = r as TechnicalProposal
            await createTechnicalProposal({
              lead_id: t.lead_id,
              proposal_number: t.proposal_number || '',
              revision: '00',
              invoice_number: t.invoice_number || '',
              date: t.date || '',
              defect: t.defect || '',
              solution: t.solution || '',
              total_price: t.total_price || 0,
              status: 'rascunho',
              items: t.items || [],
              payment_condition: t.payment_condition || '',
              delivery_time: t.delivery_time || '',
              validity: t.validity || '',
              guarantee: t.guarantee || '',
            })
          }),
        )
      }
      toast({ title: `${selectedIds.size} documento(s) importado(s) com sucesso!` })
      onOpenChange(false)
      onImported()
    } catch {
      toast({ title: 'Erro ao importar documentos', variant: 'destructive' })
    }
    setImporting(false)
  }

  const selectedCount = selectedIds.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPcs ? <FileText className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            {isPcs ? 'Importar Proposta Comercial (PCS)' : 'Importar Proposta Técnica (PAT)'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isPcs
                  ? 'Buscar por título, cliente, data, status...'
                  : 'Buscar por nº, defeito, cliente, data, status...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === filtered.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Selecionar todos</span>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
          <div className="space-y-1 pr-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum documento encontrado.</p>
            ) : (
              filtered.map((r: any) => {
                const isSelected = selectedIds.has(r.id)
                const dateField = isPcs ? r.expiry_date : r.date
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleSelect(r.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-secondary/50',
                    )}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none shrink-0" />
                    <div className="flex-1 min-w-0">
                      {isPcs ? (
                        <>
                          <p className="font-medium truncate">{(r as Proposal).title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {r.expand?.lead_id?.name || 'Cliente excluído'}
                            {dateField && ` — ${format(new Date(dateField), 'dd/MM/yyyy')}`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium truncate">
                            {(r as TechnicalProposal).proposal_number || 'Sem nº'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {(r as TechnicalProposal).defect || 'Sem defeito'} —{' '}
                            {r.expand?.lead_id?.name || 'Cliente excluído'}
                            {dateField && ` — ${format(new Date(dateField), 'dd/MM/yyyy')}`}
                          </p>
                        </>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {r.status}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {selectedCount} documento(s) selecionado(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={selectedCount === 0 || importing}>
              {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Importar ({selectedCount})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

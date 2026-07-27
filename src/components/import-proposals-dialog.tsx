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
  type Proposal,
  type TechnicalProposal,
} from '@/services/api'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportProposalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'pcs' | 'pat'
  existingIds: string[]
  onConfirm: (ids: string[]) => void
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aceito', label: 'Aceito' },
  { value: 'recusado', label: 'Recusado' },
]

export function ImportProposalsDialog({
  open,
  onOpenChange,
  mode,
  existingIds,
  onConfirm,
}: ImportProposalsDialogProps) {
  const [records, setRecords] = useState<(Proposal | TechnicalProposal)[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'list' | 'confirm'>('list')
  const [loading, setLoading] = useState(false)
  const existingIdsKey = existingIds.join(',')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const fetcher = mode === 'pcs' ? getProposals : getTechnicalProposals
    fetcher()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
    setSelectedIds(new Set(existingIds))
    setSearch('')
    setStatusFilter('all')
    setStep('list')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, existingIdsKey])

  const filtered = useMemo(() => {
    return records.filter((r: any) => {
      const leadName = r.expand?.lead_id?.name || ''
      const searchText =
        mode === 'pcs'
          ? `${r.title || ''} ${leadName}`.toLowerCase()
          : `${r.proposal_number || ''} ${r.defect || ''} ${leadName}`.toLowerCase()
      if (search && !searchText.includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [records, search, statusFilter, mode])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (mode === 'pcs') {
        next.clear()
        if (!prev.has(id)) next.add(id)
      } else {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm([...selectedIds])
    onOpenChange(false)
  }

  const selectedCount = selectedIds.size
  const isPcs = mode === 'pcs'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isPcs ? 'Importar Propostas PCS' : 'Importar Propostas Técnicas (PAT)'}
          </DialogTitle>
        </DialogHeader>

        {step === 'list' ? (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    isPcs ? 'Buscar por título, cliente...' : 'Buscar por nº, defeito, cliente...'
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

            <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
              <div className="space-y-1 pr-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhuma proposta encontrada.
                  </p>
                ) : (
                  filtered.map((r: any) => {
                    const isSelected = selectedIds.has(r.id)
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
                        {isPcs ? (
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                              isSelected ? 'border-primary' : 'border-muted-foreground',
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                        ) : (
                          <Checkbox checked={isSelected} className="pointer-events-none shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {isPcs ? (
                            <>
                              <p className="font-medium truncate">{(r as Proposal).title}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {r.expand?.lead_id?.name || 'Cliente excluído'}
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
                {selectedCount} proposta(s) selecionada(s)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setStep('confirm')} disabled={selectedCount === 0}>
                  Importar ({selectedCount})
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-lg font-semibold">Importar {selectedCount} proposta(s)?</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isPcs
                  ? 'A proposta selecionada será vinculada a este PI.'
                  : 'As propostas selecionadas serão vinculadas a este PI.'}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('list')}>
                Voltar
              </Button>
              <Button onClick={handleConfirm}>Confirmar Importação</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react'
import {
  parseProposalFile,
  importPcsProposals,
  importPatProposals,
  downloadPcsTemplate,
  downloadPatTemplate,
  type ProposalImportSummary,
} from '@/services/proposal-import'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Step = 'idle' | 'processing' | 'done' | 'error'

interface ImportDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'pcs' | 'pat'
  onImported: () => void
}

export function ImportDocumentDialog({
  open,
  onOpenChange,
  mode,
  onImported,
}: ImportDocumentDialogProps) {
  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState<ProposalImportSummary | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const isPcs = mode === 'pcs'

  const reset = useCallback(() => {
    setStep('idle')
    setProgress(0)
    setSummary(null)
    setErrorMsg('')
    setFileName('')
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setErrorMsg('Formato inválido. Use arquivos .xlsx ou .csv.')
        setStep('error')
        return
      }
      setFileName(file.name)
      setStep('processing')
      setProgress(5)
      try {
        const rows = await parseProposalFile(file)
        setProgress(20)
        const fn = isPcs ? importPcsProposals : importPatProposals
        const result = await fn(rows, (p) => setProgress(20 + Math.floor(p * 0.75)))
        setSummary(result)
        setProgress(100)
        setStep('done')
        toast({
          title: 'Importação concluída!',
          description: `${result.imported} registro(s) importado(s).`,
        })
        if (result.imported > 0) onImported()
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar o arquivo.')
        setStep('error')
      }
    },
    [isPcs, onImported, toast],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v)
    if (!v) setTimeout(reset, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isPcs ? 'Importar Proposta Comercial (PCS)' : 'Importar Proposta Técnica (PAT)'}
          </DialogTitle>
        </DialogHeader>

        {step === 'idle' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              )}
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Arraste seu arquivo Excel aqui</p>
              <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-3">Formatos suportados: .xlsx, .csv</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={isPcs ? downloadPcsTemplate : downloadPatTemplate}
            >
              <Download className="w-4 h-4 mr-2" /> Baixar Modelo
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Processando {fileName}...</p>
                <p className="text-sm text-muted-foreground">Importando registros</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}

        {step === 'done' && summary && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <p className="font-semibold text-lg">Importação Concluída</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{summary.imported}</p>
              <p className="text-sm text-muted-foreground">Registro(s) importado(s)</p>
            </div>
            {summary.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{summary.errors.length} linha(s) com erro:</span>
                </div>
                <ScrollArea className="h-32 rounded-lg border border-border/50">
                  <div className="p-3 space-y-1">
                    {summary.errors.map((e, i) => (
                      <div key={i} className="text-xs flex gap-2 items-start">
                        <Badge variant="secondary" className="shrink-0">
                          Linha {e.row}
                        </Badge>
                        <span className="text-muted-foreground">{e.reason}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Concluir
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
              <div>
                <p className="font-semibold">Erro na importação</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
            </div>
            <Button onClick={reset} variant="outline" className="w-full">
              Tentar Novamente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

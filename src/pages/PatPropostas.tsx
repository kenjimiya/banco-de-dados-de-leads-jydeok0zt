import { useEffect, useState } from 'react'
import {
  getTechnicalProposals,
  deleteTechnicalProposal,
  updateTechnicalProposal,
  type TechnicalProposal,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { Wrench, MoreVertical, Pencil, Trash2, FileDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PatFormDialog } from '@/components/pat-form-dialog'
import { exportPatPDF } from '@/lib/pat-pdf'
import { useToast } from '@/hooks/use-toast'
import { fmtCurrency } from '@/lib/utils'

export default function PatPropostas() {
  const { toast } = useToast()
  const [proposals, setProposals] = useState<TechnicalProposal[]>([])
  const [editProposal, setEditProposal] = useState<TechnicalProposal | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [delTarget, setDelTarget] = useState<TechnicalProposal | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => setProposals(await getTechnicalProposals())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('technical_proposals', loadData)

  const handleDelete = async () => {
    if (!delTarget) return
    setDeleting(true)
    try {
      await deleteTechnicalProposal(delTarget.id)
      toast({ title: 'PAT excluída com sucesso!' })
      setDelTarget(null)
    } catch {
      toast({ title: 'Erro ao excluir PAT', variant: 'destructive' })
    }
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Assistência Técnica (PAT)</h2>
        </div>
        <PatFormDialog onSaved={loadData} />
      </div>

      <Card className="border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead>Nº Proposta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preço Total</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <TableCell className="font-medium">{p.proposal_number || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {p.expand?.lead_id?.name || 'Cliente excluído'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.invoice_number || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.date ? format(new Date(p.date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.status}
                        onValueChange={async (newStatus) => {
                          if (newStatus === p.status) return
                          try {
                            await updateTechnicalProposal(p.id, {
                              status: newStatus as TechnicalProposal['status'],
                            })
                            toast({ title: 'Status atualizado!' })
                            loadData()
                          } catch {
                            toast({ title: 'Erro ao atualizar', variant: 'destructive' })
                          }
                        }}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="aceito">Aceito</SelectItem>
                          <SelectItem value="recusado">Recusado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {fmtCurrency(p.total_price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditProposal(p)
                              setEditOpen(true)
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportPatPDF(p, p.expand?.lead_id)}>
                            <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDelTarget(p)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {proposals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma PAT encontrada.</p>
                      <p className="text-sm">Crie uma nova proposta de assistência técnica.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PatFormDialog
        proposal={editProposal}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadData}
      />

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PAT</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação é permanente e não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

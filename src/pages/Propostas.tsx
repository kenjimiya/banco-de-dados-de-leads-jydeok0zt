import { useEffect, useState } from 'react'
import { getProposals, deleteProposal, type Proposal } from '@/services/api'
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
import { Badge } from '@/components/ui/badge'
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
import { FileText, MoreVertical, Pencil, Trash2, FileDown } from 'lucide-react'
import { ProposalFormDialog } from '@/components/proposal-form-dialog'
import { exportProposalPDF } from '@/lib/proposal-pdf'
import { useToast } from '@/hooks/use-toast'

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  enviado: 'bg-blue-100 text-blue-700',
  aceito: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
}
const fmtCurrency = (v: number | undefined) => `R$ ${(v || 0).toFixed(2)}`

export default function Propostas() {
  const { toast } = useToast()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [editProposal, setEditProposal] = useState<Proposal | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [delTarget, setDelTarget] = useState<Proposal | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => setProposals(await getProposals())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('proposals', loadData)

  const handleDelete = async () => {
    if (!delTarget) return
    setDeleting(true)
    try {
      await deleteProposal(delTarget.id)
      toast({ title: 'Proposta excluída com sucesso!' })
      setDelTarget(null)
    } catch {
      toast({ title: 'Erro ao excluir proposta', variant: 'destructive' })
    }
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Propostas</h2>
        </div>
        <ProposalFormDialog onSaved={loadData} />
      </div>

      <Card className="border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <TableCell className="font-medium">
                      {p.expand?.lead_id?.name || 'Cliente excluído'}
                    </TableCell>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-none ${STATUS_COLORS[p.status] || ''}`}
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {fmtCurrency(p.total_value)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.expiry_date ? format(new Date(p.expiry_date), 'dd/MM/yyyy') : '-'}
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
                          <DropdownMenuItem onClick={() => exportProposalPDF(p, p.expand?.lead_id)}>
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
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma proposta encontrada.</p>
                      <p className="text-sm">Crie uma nova proposta para começar.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProposalFormDialog
        proposal={editProposal}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadData}
      />

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
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

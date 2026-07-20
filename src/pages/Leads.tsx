import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeads, createLead, Lead } from '@/services/api'
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
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Search, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ExcelImportDialog } from '@/components/excel-import-dialog'
import { fmtCurrency } from '@/lib/utils'

const STATUS_COLORS = {
  novo: 'bg-gray-100 text-gray-700',
  morno: 'bg-yellow-100 text-yellow-700',
  quente: 'bg-orange-100 text-orange-700',
  cliente: 'bg-primary/20 text-primary',
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const loadData = async () => setLeads(await getLeads())
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('leads', loadData)

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.uf || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.activity || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await createLead({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
        status: fd.get('status') as Lead['status'],
        uf: fd.get('uf') as string,
        activity: fd.get('activity') as string,
        notes: '',
        total_spent: 0,
      })
      setIsAddOpen(false)
      toast({ title: 'Lead adicionado com sucesso!' })
    } catch {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Gestão de Clientes</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-none shadow-subtle rounded-xl"
            />
          </div>
          <ExcelImportDialog onImported={loadData} />
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-xl shadow-elevation">
                <Plus className="w-4 h-4 mr-2" /> Novo Cliente
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Adicionar Novo Cliente</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleAddLead} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input name="phone" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input name="uf" placeholder="Ex: SC" maxLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Atividade</Label>
                    <Input name="activity" placeholder="Ex: MOVELEIRO" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue="novo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="morno">Morno</SelectItem>
                      <SelectItem value="quente">Quente</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-4">
                  Salvar
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">UF</TableHead>
                <TableHead className="hidden md:table-cell">Atividade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Última Compra</TableHead>
                <TableHead className="text-right">Valor Gasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-secondary/30 border-b border-border/50"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <TableCell className="font-medium">
                    {lead.name}
                    <div className="text-xs text-muted-foreground font-normal md:hidden">
                      {lead.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {lead.uf || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {lead.activity || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`border-none ${STATUS_COLORS[lead.status]}`}
                    >
                      {lead.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {lead.last_purchase_date
                      ? format(new Date(lead.last_purchase_date), 'dd/MM/yyyy')
                      : 'Nunca'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {fmtCurrency(lead.total_spent)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

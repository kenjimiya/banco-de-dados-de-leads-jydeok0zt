import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getLead,
  getLeadPurchases,
  getLeadProposals,
  getLeadTechnicalProposals,
  getLeadInternalOrders,
  createPurchase,
  askAnalyst,
  Lead,
  Purchase,
  Proposal,
  TechnicalProposal,
  InternalOrder,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Plus, Send, MapPin, Briefcase, Pencil } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LeadEditDialog } from '@/components/lead-edit-dialog'
import { fmtCurrency } from '@/lib/utils'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [patProposals, setPatProposals] = useState<TechnicalProposal[]>([])
  const [internalOrders, setInternalOrders] = useState<InternalOrder[]>([])
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false)
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'agent'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [convId, setConvId] = useState<string | null>(null)
  const [isChatting, setIsChatting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLead(await getLead(id))
      setPurchases(await getLeadPurchases(id))
      setProposals(await getLeadProposals(id))
      setPatProposals(await getLeadTechnicalProposals(id))
      setInternalOrders(await getLeadInternalOrders(id))
    } catch {
      navigate('/leads')
    }
  }

  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('leads', loadData)
  useRealtime('purchases', loadData)
  useRealtime('proposals', loadData)
  useRealtime('technical_proposals', loadData)
  useRealtime('internal_orders', loadData)

  const unifiedHistory = [
    ...purchases.map((p) => ({
      id: p.id,
      type: 'Venda' as const,
      date: p.purchase_date,
      title: p.product_name,
      status: p.sale_type || 'VENDA',
      value: p.grand_total || p.total_price || 0,
      link: '/vendas',
    })),
    ...proposals.map((p) => ({
      id: p.id,
      type: 'Proposta Comercial' as const,
      date: p.created,
      title: p.title,
      status: p.status,
      value: p.total_value || 0,
      link: '/propostas',
    })),
    ...patProposals.map((p) => ({
      id: p.id,
      type: 'Assistência Técnica' as const,
      date: p.date || p.created,
      title: p.proposal_number || 'PAT',
      status: p.status,
      value: p.total_price || 0,
      link: '/pat',
    })),
    ...internalOrders.map((p) => ({
      id: p.id,
      type: 'Pedido Interno' as const,
      date: p.created,
      title: 'PI - ' + (p.operation_type === 'novo' ? 'Equipamento Novo' : 'Conserto'),
      status: 'Aberto',
      value: p.total_value || 0,
      link: '/pi',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleAddPurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const qty = Number(fd.get('quantity'))
    const price = Number(fd.get('unit_price'))
    await createPurchase({
      lead_id: id,
      product_name: fd.get('product_name') as string,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
      purchase_date: new Date().toISOString(),
    })
    setIsPurchaseOpen(false)
  }

  const handleAskAgent = async () => {
    if (!chatInput.trim() || isChatting) return
    const msg = chatInput
    setChatInput('')
    setChatLog((prev) => [...prev, { role: 'user', content: msg }])
    setIsChatting(true)
    try {
      const res = await askAnalyst(`Sobre o lead ${lead?.name} (ID: ${lead?.id}): ${msg}`, convId)
      setConvId(res.conversation_id)
      setChatLog((prev) => [...prev, { role: 'agent', content: res.content }])
    } catch {
      setChatLog((prev) => [
        ...prev,
        { role: 'agent', content: 'Desculpe, ocorreu um erro na análise.' },
      ])
    }
    setIsChatting(false)
  }

  if (!lead) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/leads')}
        className="mb-4 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/3 border-none shadow-subtle h-fit">
          <CardContent className="p-6 text-center space-y-4">
            <Avatar className="w-24 h-24 mx-auto border-4 border-secondary">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {lead.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <p className="text-muted-foreground">{lead.email || 'Sem email'}</p>
              <p className="text-muted-foreground text-sm">{lead.phone || 'Sem telefone'}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
              </Button>
            </div>
            <div className="flex justify-center flex-wrap gap-2">
              <Badge className="bg-accent/20 text-accent-foreground hover:bg-accent/30 border-none px-4 py-1">
                {lead.status.toUpperCase()}
              </Badge>
              {lead.uf && (
                <Badge variant="outline" className="px-3 py-1 gap-1">
                  <MapPin className="w-3 h-3" /> {lead.uf}
                </Badge>
              )}
              {lead.activity && (
                <Badge variant="outline" className="px-3 py-1 gap-1">
                  <Briefcase className="w-3 h-3" /> {lead.activity}
                </Badge>
              )}
            </div>
            <div className="pt-4 border-t border-border/50 text-left">
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold text-primary">{fmtCurrency(lead.total_spent)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 border-none shadow-subtle">
          <CardContent className="p-6">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="mb-6 bg-secondary/50 rounded-xl p-1">
                <TabsTrigger value="history" className="rounded-lg">
                  Histórico Unificado
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className="rounded-lg text-accent-foreground data-[state=active]:bg-accent data-[state=active]:text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Insights AI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Histórico do Cliente</h3>
                  <Sheet open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
                    <SheetTrigger asChild>
                      <Button size="sm" className="rounded-xl">
                        <Plus className="w-4 h-4 mr-1" /> Add Compra
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Nova Compra</SheetTitle>
                      </SheetHeader>
                      <form onSubmit={handleAddPurchase} className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <Label>Produto</Label>
                          <Input name="product_name" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input
                              name="quantity"
                              type="number"
                              min="1"
                              defaultValue="1"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Valor Unit. (R$)</Label>
                            <Input name="unit_price" type="number" step="0.01" required />
                          </div>
                        </div>
                        <Button type="submit" className="w-full mt-4">
                          Registrar Venda
                        </Button>
                      </form>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-secondary/30">
                        <TableRow className="border-border/50">
                          <TableHead className="whitespace-nowrap">Data</TableHead>
                          <TableHead className="whitespace-nowrap">Tipo</TableHead>
                          <TableHead className="whitespace-nowrap">Título/Produto</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Valor</TableHead>
                          <TableHead className="whitespace-nowrap text-center">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unifiedHistory.map((item) => (
                          <TableRow key={`${item.type}-${item.id}`} className="border-border/50">
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={
                                  item.type === 'Venda'
                                    ? 'border-green-500 text-green-600'
                                    : item.type === 'Proposta Comercial'
                                      ? 'border-blue-500 text-blue-600'
                                      : 'border-orange-500 text-orange-600'
                                }
                              >
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium">
                              {item.title}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="secondary" className="uppercase text-[10px]">
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right font-semibold text-primary">
                              {fmtCurrency(item.value)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-center">
                              <Button variant="ghost" size="sm" onClick={() => navigate(item.link)}>
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {unifiedHistory.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhum histórico encontrado para este cliente.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="flex flex-col h-[400px]">
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent mt-0.5" />
                  <p className="text-sm text-accent-foreground leading-relaxed">
                    O Analista de Leads tem acesso ao histórico completo deste cliente. Faça
                    perguntas sobre padrões de compra ou peça sugestões de produtos.
                  </p>
                </div>

                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="space-y-4">
                    {chatLog.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-muted-foreground animate-pulse">
                          Analisando...
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ex: Qual produto devo oferecer agora?"
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
                    className="bg-secondary/50 border-none rounded-xl"
                  />
                  <Button
                    onClick={handleAskAgent}
                    disabled={isChatting || !chatInput.trim()}
                    className="rounded-xl px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <LeadEditDialog lead={lead} open={editOpen} onOpenChange={setEditOpen} onSaved={loadData} />
    </div>
  )
}

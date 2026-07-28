import * as XLSX from 'xlsx'
import pb from '@/lib/pocketbase/client'
import { getLeads, type Lead } from '@/services/api'

export interface ProposalImportError {
  row: number
  reason: string
}
export interface ProposalImportSummary {
  imported: number
  errors: ProposalImportError[]
}

const PCS_ALIASES: Record<string, string> = {
  cliente: 'leadName',
  'nome do cliente': 'leadName',
  lead: 'leadName',
  titulo: 'title',
  título: 'title',
  title: 'title',
  descrição: 'description',
  descricao: 'description',
  description: 'description',
  itens: 'items',
  items: 'items',
  'valor total': 'totalValue',
  total: 'totalValue',
  status: 'status',
  validade: 'expiryDate',
  'expira em': 'expiryDate',
  'condição de pagamento': 'paymentCondition',
  'condicao de pagamento': 'paymentCondition',
  pagamento: 'paymentCondition',
  'prazo de entrega': 'deliveryTime',
  entrega: 'deliveryTime',
  composição: 'composition',
  composicao: 'composition',
  frete: 'freightInfo',
  revisão: 'revision',
  revisao: 'revision',
  'data do documento': 'documentDate',
  data: 'documentDate',
}

const PAT_ALIASES: Record<string, string> = {
  cliente: 'leadName',
  'nome do cliente': 'leadName',
  lead: 'leadName',
  'nº proposta': 'proposalNumber',
  'numero da proposta': 'proposalNumber',
  proposta: 'proposalNumber',
  nf: 'invoiceNumber',
  'nota fiscal': 'invoiceNumber',
  data: 'date',
  defeito: 'defect',
  solução: 'solution',
  solucao: 'solution',
  'valor total': 'totalPrice',
  'preço total': 'totalPrice',
  'preco total': 'totalPrice',
  total: 'totalPrice',
  status: 'status',
  revisão: 'revision',
  revisao: 'revision',
  itens: 'items',
  items: 'items',
  'condição de pagamento': 'paymentCondition',
  'condicao de pagamento': 'paymentCondition',
  pagamento: 'paymentCondition',
  'prazo de entrega': 'deliveryTime',
  entrega: 'deliveryTime',
  validade: 'validity',
  garantia: 'guarantee',
}

function normKey(key: string, aliases: Record<string, string>): string {
  return aliases[key.toLowerCase().trim()] || key.toLowerCase().trim()
}
function parseNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') {
    const n = parseFloat(v.trim().replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}
function parseDt(v: unknown): string {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  if (typeof v === 'number' && v > 0) {
    const d = new Date((v - 25569) * 86400 * 1000)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return ''
}
function parseItems(v: unknown): unknown[] {
  if (!v) return []
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}
function normStatus(s: string): string {
  const v = s.toLowerCase().trim()
  return ['rascunho', 'enviado', 'aceito', 'recusado'].includes(v) ? v : 'rascunho'
}
async function buildLeadMaps() {
  const leads = await getLeads()
  const byName = new Map<string, Lead>()
  const byEmail = new Map<string, Lead>()
  leads.forEach((l) => {
    if (l.name) byName.set(l.name.toLowerCase().trim(), l)
    if (l.email) byEmail.set(l.email.toLowerCase().trim(), l)
  })
  return { byName, byEmail }
}
function normalizeRows(rows: Record<string, unknown>[], aliases: Record<string, string>) {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) obj[normKey(k, aliases)] = v
    return obj
  })
}

export async function parseProposalFile(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) throw new Error('Nenhuma planilha encontrada no arquivo.')
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (rows.length === 0) throw new Error('A planilha está vazia.')
  return rows
}

export function downloadPcsTemplate(): void {
  const headers = [
    'Cliente',
    'Título',
    'Descrição',
    'Itens (JSON)',
    'Valor Total',
    'Status',
    'Validade',
    'Condição de Pagamento',
    'Prazo de Entrega',
    'Composição',
    'Frete',
    'Revisão',
    'Data do Documento',
  ]
  const sample = [
    'Empresa Exemplo Ltda',
    'Proposta Transformador 5kVA',
    'Transformador trifásico',
    JSON.stringify([
      { quantity: 2, description: 'Transformador 5kVA', unit_price: 5500, total_price: 11000 },
    ]),
    '11000',
    'rascunho',
    '2026-12-31',
    '28DDL',
    '4 semanas',
    'Composição técnica',
    'FOB',
    '00',
    '2026-01-15',
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, sample])
  XLSX.writeFile(
    XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, 'Propostas'),
    'modelo_pcs.xlsx',
  )
}

export function downloadPatTemplate(): void {
  const headers = [
    'Cliente',
    'Nº Proposta',
    'NF',
    'Data',
    'Defeito',
    'Solução',
    'Valor Total',
    'Status',
    'Revisão',
    'Itens (JSON)',
    'Condição de Pagamento',
    'Prazo de Entrega',
    'Validade',
    'Garantia',
  ]
  const sample = [
    'Empresa Exemplo Ltda',
    '001/26',
    '375928',
    '2026-01-15',
    'Transformador não liga',
    'Troca de bobina',
    '2500',
    'rascunho',
    '00',
    JSON.stringify([
      {
        equipment: 'TR-500',
        serial_number: 'SN001',
        manufacturing_date: '2023-01-01',
        parts: [
          {
            defect: 'Bobina queimada',
            description: 'Troca de bobina',
            quantity: 1,
            unit_price: 2500,
            total_price: 2500,
          },
        ],
      },
    ]),
    '28DDL',
    'A combinar',
    '15 dias',
    '6 meses',
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, sample])
  XLSX.writeFile(XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, 'PAT'), 'modelo_pat.xlsx')
}

export async function importPcsProposals(
  rows: Record<string, unknown>[],
  onProgress?: (p: number) => void,
): Promise<ProposalImportSummary> {
  const data = normalizeRows(rows, PCS_ALIASES)
  const { byName, byEmail } = await buildLeadMaps()
  const errors: ProposalImportError[] = []
  let imported = 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2
    const leadName = String(row.leadName || '').trim()
    const pct = () => onProgress?.(((i + 1) / data.length) * 100)
    if (!leadName) {
      errors.push({ row: rowNum, reason: 'Nome do cliente é obrigatório.' })
      pct()
      continue
    }
    const lead = byName.get(leadName.toLowerCase()) || byEmail.get(leadName.toLowerCase())
    if (!lead) {
      errors.push({ row: rowNum, reason: `Cliente "${leadName}" não encontrado.` })
      pct()
      continue
    }
    const title = String(row.title || '').trim()
    if (!title) {
      errors.push({ row: rowNum, reason: 'Título é obrigatório.' })
      pct()
      continue
    }
    try {
      await pb.collection('proposals').create({
        lead_id: lead.id,
        title,
        description: String(row.description || '').trim(),
        items: parseItems(row.items),
        total_value: parseNum(row.totalValue),
        status: normStatus(String(row.status || '')),
        expiry_date: parseDt(row.expiryDate),
        payment_condition: String(row.paymentCondition || '').trim(),
        delivery_time: String(row.deliveryTime || '').trim(),
        composition: String(row.composition || '').trim(),
        freight_info: String(row.freightInfo || '').trim(),
        revision: String(row.revision || '00').trim(),
        document_date: parseDt(row.documentDate),
      })
      imported++
    } catch {
      errors.push({ row: rowNum, reason: 'Erro ao salvar no banco de dados.' })
    }
    pct()
  }
  return { imported, errors }
}

export async function importPatProposals(
  rows: Record<string, unknown>[],
  onProgress?: (p: number) => void,
): Promise<ProposalImportSummary> {
  const data = normalizeRows(rows, PAT_ALIASES)
  const { byName, byEmail } = await buildLeadMaps()
  const errors: ProposalImportError[] = []
  let imported = 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2
    const leadName = String(row.leadName || '').trim()
    const pct = () => onProgress?.(((i + 1) / data.length) * 100)
    if (!leadName) {
      errors.push({ row: rowNum, reason: 'Nome do cliente é obrigatório.' })
      pct()
      continue
    }
    const lead = byName.get(leadName.toLowerCase()) || byEmail.get(leadName.toLowerCase())
    if (!lead) {
      errors.push({ row: rowNum, reason: `Cliente "${leadName}" não encontrado.` })
      pct()
      continue
    }
    try {
      await pb.collection('technical_proposals').create({
        lead_id: lead.id,
        proposal_number: String(row.proposalNumber || '').trim(),
        invoice_number: String(row.invoiceNumber || '').trim(),
        date: parseDt(row.date),
        defect: String(row.defect || '').trim(),
        solution: String(row.solution || '').trim(),
        total_price: parseNum(row.totalPrice),
        status: normStatus(String(row.status || '')),
        revision: String(row.revision || '00').trim(),
        items: parseItems(row.items),
        payment_condition: String(row.paymentCondition || '').trim(),
        delivery_time: String(row.deliveryTime || '').trim(),
        validity: String(row.validity || '').trim(),
        guarantee: String(row.guarantee || '').trim(),
      })
      imported++
    } catch {
      errors.push({ row: rowNum, reason: 'Erro ao salvar no banco de dados.' })
    }
    pct()
  }
  return { imported, errors }
}

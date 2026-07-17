import * as XLSX from 'xlsx'
import pb from '@/lib/pocketbase/client'
import { getLeads, updateLead, type Lead } from '@/services/api'

export interface ImportError {
  row: number
  reason: string
}

export interface ImportSummary {
  leadsImported: number
  purchasesRecorded: number
  errors: ImportError[]
}

const COLUMN_ALIASES: Record<string, string> = {
  uf: 'uf',
  'cliente sigma - vendas': 'name',
  cliente: 'name',
  atividade: 'activity',
  tipo: 'saleType',
  nf: 'invoiceNumber',
  pi: 'piNumber',
  data: 'purchaseDate',
  unid: 'quantity',
  'saida produto - sigma 2025': 'productName',
  produto: 'productName',
  'materia prima (custo)': 'rawMaterialCost',
  'materia prima': 'rawMaterialCost',
  'custo total': 'totalCost',
  'vlr unid': 'unitPrice',
  'valor unitario': 'unitPrice',
  total: 'totalPrice',
  frete: 'shippingCost',
  'total c/ frete': 'grandTotal',
  'total com frete': 'grandTotal',
  'prazo de pagto': 'paymentTerm',
  prazo: 'paymentTerm',
}

function normalizeKey(key: string): string {
  return COLUMN_ALIASES[key.toLowerCase().trim()] || key.toLowerCase().trim()
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed || trimmed.startsWith('#ERROR')) return 0
    const cleaned = trimmed.replace(/[^\d.-]/g, '')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function parseDate(val: unknown): string {
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'string' && val.trim()) {
    const parsed = new Date(val)
    if (!isNaN(parsed.getTime())) return parsed.toISOString()
  }
  if (typeof val === 'number' && val > 0) {
    const date = new Date((val - 25569) * 86400 * 1000)
    if (!isNaN(date.getTime())) return date.toISOString()
  }
  return new Date().toISOString()
}

export function downloadTemplate(): void {
  const headers = [
    'UF',
    'CLIENTE SIGMA - VENDAS',
    'Atividade',
    'TIPO',
    'NF',
    'PI',
    'DATA',
    'UNID',
    'SAIDA PRODUTO - SIGMA 2025',
    'Materia prima (custo)',
    'custo total',
    'VLR UNID',
    'TOTAL',
    'FRETE',
    'TOTAL C/ FRETE',
    'PRAZO DE PAGTO',
  ]
  const sample = [
    [
      'SC',
      'Empresa Exemplo Ltda',
      'MOVELEIRO',
      'VENDA',
      '1234',
      '001/26',
      '2026-01-15',
      '2',
      'PRODUTO EXEMPLO X100',
      '150',
      '300',
      '550',
      '1100',
      '95',
      '1195',
      '28',
    ],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas')
  XLSX.writeFile(wb, 'modelo_importacao_vendas.xlsx')
}

export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('Nenhuma planilha encontrada no arquivo.')
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (rawRows.length === 0) throw new Error('A planilha está vazia.')
  return rawRows.map((row) => {
    const normalized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeKey(key)] = value
    }
    return normalized
  })
}

function validateColumns(rows: Record<string, unknown>[]): void {
  const keys = Object.keys(rows[0])
  if (!keys.includes('name')) {
    throw new Error(
      'Coluna "CLIENTE SIGMA - VENDAS" (ou "Cliente") é obrigatória e não foi encontrada.',
    )
  }
}

export async function validateAndImport(
  rows: Record<string, unknown>[],
  onProgress?: (percent: number) => void,
): Promise<ImportSummary> {
  validateColumns(rows)
  const existingLeads = await getLeads()
  const nameMap = new Map<string, Lead>()
  existingLeads.forEach((l) => {
    if (l.name) nameMap.set(l.name.toLowerCase().trim(), l)
  })

  const errors: ImportError[] = []
  let leadsImported = 0
  let purchasesRecorded = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const name = String(row.name || '').trim()

    if (!name) {
      errors.push({ row: rowNum, reason: 'Nome do cliente é obrigatório.' })
      continue
    }

    const productName = String(row.productName || '').trim()
    if (!productName) {
      errors.push({ row: rowNum, reason: 'Nome do produto é obrigatório.' })
      continue
    }

    try {
      let leadId: string
      const uf = String(row.uf || '').trim()
      const activity = String(row.activity || '').trim()
      const existing = nameMap.get(name.toLowerCase())

      if (existing) {
        await updateLead(existing.id, { uf, activity })
        leadId = existing.id
      } else {
        const created = await pb.collection('leads').create({
          name,
          uf,
          activity,
          status: 'cliente',
          total_spent: 0,
          notes: '',
        })
        leadId = created.id
        nameMap.set(name.toLowerCase(), created as Lead)
      }
      leadsImported++

      const purchaseDate = parseDate(row.purchaseDate)
      await pb.collection('purchases').create({
        lead_id: leadId,
        product_name: productName,
        quantity: Math.round(parseNumber(row.quantity)),
        unit_price: parseNumber(row.unitPrice),
        total_price: parseNumber(row.totalPrice),
        purchase_date: purchaseDate,
        sale_type: String(row.saleType || '').trim(),
        invoice_number: String(row.invoiceNumber || '').trim(),
        pi_number: String(row.piNumber || '').trim(),
        raw_material_cost: parseNumber(row.rawMaterialCost),
        total_cost: parseNumber(row.totalCost),
        shipping_cost: parseNumber(row.shippingCost),
        grand_total: parseNumber(row.grandTotal),
        payment_term: Math.round(parseNumber(row.paymentTerm)),
      })
      purchasesRecorded++

      const lead = await pb.collection('leads').getOne<Lead>(leadId)
      await updateLead(leadId, {
        total_spent: (lead.total_spent || 0) + parseNumber(row.grandTotal),
        last_purchase_date: purchaseDate,
      })
    } catch {
      errors.push({ row: rowNum, reason: 'Erro ao salvar registro no banco de dados.' })
    }

    onProgress?.(((i + 1) / rows.length) * 100)
  }

  return { leadsImported, purchasesRecorded, errors }
}

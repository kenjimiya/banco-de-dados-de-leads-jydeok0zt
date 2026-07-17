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
  name: 'name',
  nome: 'name',
  email: 'email',
  phone: 'phone',
  telefone: 'phone',
  status: 'status',
  notes: 'notes',
  observacoes: 'notes',
  observações: 'notes',
  product_name: 'productName',
  'product name': 'productName',
  'nome do produto': 'productName',
  quantity: 'quantity',
  quantidade: 'quantity',
  unit_price: 'unitPrice',
  'unit price': 'unitPrice',
  'preco unitario': 'unitPrice',
  'preço unitário': 'unitPrice',
  purchase_date: 'purchaseDate',
  'purchase date': 'purchaseDate',
  'data da compra': 'purchaseDate',
}

const VALID_STATUSES = ['novo', 'morno', 'quente', 'cliente']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeKey(key: string): string {
  return COLUMN_ALIASES[key.toLowerCase().trim()] || key.toLowerCase().trim()
}

export function downloadTemplate(): void {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Status',
    'Notes',
    'Product Name',
    'Quantity',
    'Unit Price',
    'Purchase Date',
  ]
  const sample = [
    [
      'João Silva',
      'joao@example.com',
      '11999999999',
      'novo',
      'Lead interessado',
      'Curso Premium',
      '1',
      '299.90',
      '2024-01-15',
    ],
    [
      'Maria Santos',
      'maria@example.com',
      '11888888888',
      'cliente',
      'Cliente recorrente',
      '',
      '',
      '',
      '',
    ],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  XLSX.writeFile(wb, 'modelo_importacao_leads.xlsx')
}

export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
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
    throw new Error('Coluna "Name" (ou "Nome") é obrigatória e não foi encontrada.')
  }
  if (!keys.includes('email')) {
    throw new Error('Coluna "Email" é obrigatória e não foi encontrada.')
  }
}

export async function validateAndImport(
  rows: Record<string, unknown>[],
  onProgress?: (percent: number) => void,
): Promise<ImportSummary> {
  validateColumns(rows)
  const existingLeads = await getLeads()
  const emailMap = new Map<string, Lead>()
  existingLeads.forEach((l) => {
    if (l.email) emailMap.set(l.email.toLowerCase(), l)
  })

  const errors: ImportError[] = []
  let leadsImported = 0
  let purchasesRecorded = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const name = String(row.name || '').trim()
    const email = String(row.email || '').trim()

    if (!name) {
      errors.push({ row: rowNum, reason: 'Nome é obrigatório.' })
      continue
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.push({ row: rowNum, reason: 'Email inválido ou ausente.' })
      continue
    }

    const status = String(row.status || 'novo')
      .trim()
      .toLowerCase()
    if (!VALID_STATUSES.includes(status)) {
      errors.push({
        row: rowNum,
        reason: `Status inválido: "${status}". Use: novo, morno, quente, cliente.`,
      })
      continue
    }

    try {
      let leadId: string
      const existing = emailMap.get(email.toLowerCase())
      const leadData = {
        name,
        email,
        phone: String(row.phone || '').trim(),
        status,
        notes: String(row.notes || '').trim(),
      }

      if (existing) {
        await updateLead(existing.id, leadData)
        leadId = existing.id
      } else {
        const created = await pb.collection('leads').create({ ...leadData, total_spent: 0 })
        leadId = created.id
        emailMap.set(email.toLowerCase(), created as Lead)
      }
      leadsImported++

      const productName = String(row.productName || '').trim()
      if (productName) {
        const quantity = Number(row.quantity)
        const unitPrice = Number(row.unitPrice)
        if (!Number.isFinite(quantity) || quantity <= 0) {
          errors.push({ row: rowNum, reason: 'Quantidade inválida para a compra.' })
          continue
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          errors.push({ row: rowNum, reason: 'Preço unitário inválido para a compra.' })
          continue
        }

        let purchaseDate = new Date().toISOString()
        if (row.purchaseDate) {
          const parsed = new Date(row.purchaseDate)
          if (isNaN(parsed.getTime())) {
            errors.push({ row: rowNum, reason: 'Data de compra inválida.' })
            continue
          }
          purchaseDate = parsed.toISOString()
        }

        await pb.collection('purchases').create({
          lead_id: leadId,
          product_name: productName,
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
          purchase_date: purchaseDate,
        })
        purchasesRecorded++

        const lead = await pb.collection('leads').getOne<Lead>(leadId)
        await updateLead(leadId, {
          total_spent: (lead.total_spent || 0) + quantity * unitPrice,
          last_purchase_date: purchaseDate,
          status: 'cliente',
        })
      }
    } catch {
      errors.push({ row: rowNum, reason: 'Erro ao salvar registro no banco de dados.' })
    }

    onProgress?.(((i + 1) / rows.length) * 100)
  }

  return { leadsImported, purchasesRecorded, errors }
}

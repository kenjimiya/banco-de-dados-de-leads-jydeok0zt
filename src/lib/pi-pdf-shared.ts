import type { InternalOrder, Lead } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'

export const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const getLogoUrl = () => new URL(logoSrc, window.location.href).href

export interface PiPdfData {
  leadName: string
  leadCnpj: string
  leadIe: string
  leadAddress: string
  leadCity: string
  leadUF: string
  leadCep: string
  leadNeighborhood: string
  leadPhone: string
  leadEmail: string
  leadContact: string
  dateStr: string
  items: InternalOrder['items']
  subtotal: number
}

export function extractPiData(order: InternalOrder, lead?: Lead): PiPdfData {
  const ld = lead || order.expand?.lead_id
  return {
    leadName: order.cliente_nome || ld?.name || '---',
    leadCnpj: order.cliente_cnpj || ld?.cnpj || '---',
    leadIe: order.cliente_ie || ld?.ie || '---',
    leadAddress: order.cliente_endereco || ld?.address || '---',
    leadCity: order.cliente_cidade || ld?.city || '---',
    leadUF: order.cliente_uf || ld?.uf || '---',
    leadCep: order.cliente_cep || ld?.cep || '---',
    leadNeighborhood: order.cliente_bairro || ld?.neighborhood || '---',
    leadPhone: order.cliente_telefone || ld?.phone || '---',
    leadEmail: order.cliente_email || ld?.email || '---',
    leadContact: order.cliente_contato || ld?.contact_name || '---',
    dateStr: new Date(order.created).toLocaleDateString('pt-BR'),
    items: order.items || [],
    subtotal: (order.items || []).reduce((acc, i) => acc + (i.subtotal || 0), 0),
  }
}

export function openPrintWindow(html: string) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

export function buildItemsHtml(items: InternalOrder['items']): string {
  if (!items || items.length === 0) {
    return '<tr><td colspan="6" style="text-align:center;padding:10px">Nenhum item</td></tr>'
  }
  return items
    .map(
      (item, index) => `<tr>
      <td style="text-align:center">${index + 1}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td>${item.description}</td>
      <td style="text-align:center">${item.ncm || '-'}</td>
      <td style="text-align:right">${fmtCurrency(item.unit_price)}</td>
      <td style="text-align:right">${fmtCurrency(item.subtotal)}</td>
    </tr>`,
    )
    .join('')
}

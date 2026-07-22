import type { InternalOrder, Lead } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'

export const getLogoUrl = () => new URL(logoSrc, window.location.href).href

export interface ProductionPdfData {
  leadName: string
  leadCnpj: string
  leadIe: string
  leadAddress: string
  leadCity: string
  leadUF: string
  leadCep: string
  dateStr: string
  items: InternalOrder['items']
}

export function extractProductionData(order: InternalOrder, lead?: Lead): ProductionPdfData {
  const ld = lead || order.expand?.lead_id
  return {
    leadName: order.cliente_nome || ld?.name || '---',
    leadCnpj: order.cliente_cnpj || ld?.cnpj || '---',
    leadIe: order.cliente_ie || ld?.ie || '---',
    leadAddress: order.cliente_endereco || ld?.address || '---',
    leadCity: ld?.city || '---',
    leadUF: ld?.uf || '---',
    leadCep: order.cliente_cep || ld?.cep || '---',
    dateStr: new Date(order.created).toLocaleDateString('pt-BR'),
    items: order.items || [],
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

export function buildProductionItemsHtml(items: InternalOrder['items']): string {
  if (!items || items.length === 0) {
    return '<tr><td colspan="3" style="text-align:center;padding:10px">Nenhum item</td></tr>'
  }
  return items
    .map(
      (item, index) => `<tr>
      <td style="text-align:center">${index + 1}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td>${item.description}</td>
    </tr>`,
    )
    .join('')
}

export function buildLogisticsHtml(order: InternalOrder, accent: string, accentBg: string): string {
  return `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Logística</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px">
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:140px;background:${accentBg}">TRANSPORTADORA:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${order.carrier_name || '-'}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">PESO LÍQUIDO:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.net_weight || 0} kg</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:100px;background:${accentBg}">PESO BRUTO:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.gross_weight || 0} kg</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">QTD VOLUMES:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.volumes_quantity || 1}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">EMBALAGEM:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
</table>`
}

export function buildSignaturesHtml(): string {
  return `<div style="margin-top:40px;display:flex;justify-content:space-around;text-align:center;font-size:11px;color:#4b5563">
  <div style="width:120px"><div style="border-top:1px solid #333;padding-top:4px;margin-bottom:2px">Mariano</div></div>
  <div style="width:120px"><div style="border-top:1px solid #333;padding-top:4px;margin-bottom:2px">Adão</div></div>
  <div style="width:120px"><div style="border-top:1px solid #333;padding-top:4px;margin-bottom:2px">Rosmar</div></div>
  <div style="width:120px"><div style="border-top:1px solid #333;padding-top:4px;margin-bottom:2px">Ivanildo</div></div>
</div>`
}

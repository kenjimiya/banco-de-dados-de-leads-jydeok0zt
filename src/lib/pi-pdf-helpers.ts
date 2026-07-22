import type { InternalOrder, Lead, InternalOrderItem } from '@/services/api'

export const fmtCurrency = (v: number) =>
  `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export interface LeadInfo {
  name: string
  cnpj: string
  ie: string
  address: string
  city: string
  uf: string
  cep: string
  phone: string
  email: string
  contact: string
}

export function getLeadInfo(order: InternalOrder, lead?: Lead): LeadInfo {
  return {
    name: lead?.name || order.cliente_nome || '---',
    cnpj: lead?.cnpj || order.cliente_cnpj || '---',
    ie: lead?.ie || order.cliente_ie || '---',
    address: lead?.address || order.cliente_endereco || '---',
    city: lead?.city || '---',
    uf: lead?.uf || '---',
    cep: lead?.cep || order.cliente_cep || '---',
    phone: lead?.phone || order.cliente_telefone || '---',
    email: lead?.email || order.cliente_email || '---',
    contact: lead?.contact_name || order.cliente_contato || '---',
  }
}

export function buildItemsRows(items: InternalOrderItem[]): string {
  if (!items?.length)
    return '<tr><td colspan="6" style="text-align:center;padding:6px">Nenhum item</td></tr>'
  return items
    .map(
      (it, i) => `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td>${it.description}</td>
      <td style="text-align:center">${it.ncm || '-'}</td>
      <td style="text-align:right">${fmtCurrency(it.unit_price)}</td>
      <td style="text-align:right">${fmtCurrency(it.subtotal)}</td>
    </tr>`,
    )
    .join('')
}

export function buildClientSection(info: LeadInfo, accent: string, accentBg: string): string {
  return `<div style="font-size:10px;font-weight:bold;color:#fff;background:${accent};padding:3px 8px;margin-bottom:4px;text-transform:uppercase;border-radius:2px">Cliente</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:6px;font-size:10px">
  <tr><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;width:80px;background:${accentBg}">NOME:</td><td style="border:1px solid #ccc;padding:3px 6px">${info.name}</td></tr>
</table>`
}

export function buildTotalsSection(
  order: InternalOrder,
  items: InternalOrderItem[],
  accent: string,
): string {
  const subtotal = items.reduce((acc, i) => acc + (i.subtotal || 0), 0)
  return `<tr><td colspan="5" style="text-align:right;font-weight:bold;font-size:10px">SOMA DOS ITENS:</td><td style="text-align:right;font-weight:bold;font-size:10px">${fmtCurrency(subtotal)}</td></tr>
<tr><td colspan="5" style="text-align:right;font-weight:bold;color:#ef4444;font-size:10px">DESCONTO:</td><td style="text-align:right;font-weight:bold;color:#ef4444;font-size:10px">- ${fmtCurrency(order.discount_amount || 0)}</td></tr>
<tr><td colspan="5" style="text-align:right;font-weight:bold;color:#16a34a;font-size:10px">FRETE (${order.shipping_type || 'N/A'}):</td><td style="text-align:right;font-weight:bold;color:#16a34a;font-size:10px">+ ${fmtCurrency(order.shipping_cost || 0)}</td></tr>
<tr style="font-weight:bold"><td colspan="5" style="text-align:right;font-size:12px">VALOR TOTAL:</td><td style="text-align:right;font-size:12px;color:${accent}">${fmtCurrency(order.total_value || 0)}</td></tr>`
}

export function buildLogisticsSection(
  order: InternalOrder,
  accent: string,
  accentBg: string,
): string {
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-')
  return `<div style="font-size:10px;font-weight:bold;color:#fff;background:${accent};padding:3px 8px;margin-bottom:4px;text-transform:uppercase;border-radius:2px">Logística e Financeiro</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:6px;font-size:10px">
  <tr><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;width:100px;background:${accentBg}">COND. PAG.:</td><td style="border:1px solid #ccc;padding:3px 6px">${order.payment_condition || '-'}</td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;width:80px;background:${accentBg}">ENTREGA:</td><td style="border:1px solid #ccc;padding:3px 6px">${fmtDate(order.delivery_date)}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;background:${accentBg}">TRANSPORTADORA:</td><td colspan="3" style="border:1px solid #ccc;padding:3px 6px">${order.carrier_name || '-'}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;background:${accentBg}">VOLUMES:</td><td style="border:1px solid #ccc;padding:3px 6px">${order.volumes_quantity || 1}</td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;background:${accentBg}">EMBALAGEM:</td><td style="border:1px solid #ccc;padding:3px 6px">${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;background:${accentBg}">PESO LÍQ.:</td><td style="border:1px solid #ccc;padding:3px 6px">${order.net_weight || 0} kg</td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold;background:${accentBg}">PESO BRUTO:</td><td style="border:1px solid #ccc;padding:3px 6px">${order.gross_weight || 0} kg</td></tr>
</table>`
}

export function buildNotesSection(notes: string, accent: string): string {
  if (!notes) return ''
  return `<div style="font-size:10px;font-weight:bold;color:#fff;background:${accent};padding:3px 8px;margin-bottom:4px;text-transform:uppercase;border-radius:2px">Observações</div>
<div style="border:1px solid #ccc;padding:4px 6px;margin-bottom:6px;min-height:30px;white-space:pre-wrap;font-size:10px">${notes}</div>`
}

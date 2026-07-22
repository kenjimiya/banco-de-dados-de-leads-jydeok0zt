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
    return '<tr><td colspan="6" style="text-align:center;padding:10px">Nenhum item</td></tr>'
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
  return `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Dados do Cliente</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px">
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:120px;background:${accentBg}">RAZÃO SOCIAL:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${info.name}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">CNPJ:</td><td style="border:1px solid #ccc;padding:4px 6px">${info.cnpj}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:100px;background:${accentBg}">INSCR. EST.:</td><td style="border:1px solid #ccc;padding:4px 6px">${info.ie}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">ENDEREÇO:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${info.address}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">CIDADE/UF:</td><td style="border:1px solid #ccc;padding:4px 6px">${info.city} / ${info.uf}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">CEP:</td><td style="border:1px solid #ccc;padding:4px 6px">${info.cep}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">TELEFONE:</td><td style="border:1px solid #ccc;padding:4px 6px">${info.phone}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">CONTATO:</td><td style="border:1px solid #ccc;padding:4px 6px">${info.contact}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">EMAIL:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${info.email}</td></tr>
</table>`
}

export function buildTotalsSection(
  order: InternalOrder,
  items: InternalOrderItem[],
  accent: string,
): string {
  const subtotal = items.reduce((acc, i) => acc + (i.subtotal || 0), 0)
  return `<tr><td colspan="5" style="text-align:right;font-weight:bold">SOMA DOS ITENS:</td><td style="text-align:right;font-weight:bold">${fmtCurrency(subtotal)}</td></tr>
<tr><td colspan="5" style="text-align:right;font-weight:bold;color:#ef4444">DESCONTO:</td><td style="text-align:right;font-weight:bold;color:#ef4444">- ${fmtCurrency(order.discount_amount || 0)}</td></tr>
<tr><td colspan="5" style="text-align:right;font-weight:bold;color:#16a34a">FRETE (${order.shipping_type || 'N/A'}):</td><td style="text-align:right;font-weight:bold;color:#16a34a">+ ${fmtCurrency(order.shipping_cost || 0)}</td></tr>
<tr style="font-weight:bold"><td colspan="5" style="text-align:right;font-size:13px">VALOR TOTAL DO PEDIDO:</td><td style="text-align:right;font-size:13px;color:${accent}">${fmtCurrency(order.total_value || 0)}</td></tr>`
}

export function buildLogisticsSection(
  order: InternalOrder,
  accent: string,
  accentBg: string,
): string {
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-')
  return `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Logística e Financeiro</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px">
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:120px;background:${accentBg}">CONDIÇÃO DE PAG.:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.payment_condition || '-'}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:100px;background:${accentBg}">DATA DE ENTREGA:</td><td style="border:1px solid #ccc;padding:4px 6px">${fmtDate(order.delivery_date)}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">TRANSPORTADORA:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${order.carrier_name || '-'}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">QTD VOLUMES:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.volumes_quantity || 1}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">TIPO EMBALAGEM:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">PESO LÍQUIDO:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.net_weight || 0} kg</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">PESO BRUTO:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.gross_weight || 0} kg</td></tr>
</table>`
}

export function buildNotesSection(notes: string, accent: string): string {
  if (!notes) return ''
  return `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Observações</div>
<div style="border:1px solid #ccc;padding:8px 10px;margin-bottom:15px;min-height:40px;white-space:pre-wrap;font-size:11px">${notes}</div>`
}

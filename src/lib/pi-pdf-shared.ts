import type { InternalOrder, Lead, ProductionEquipment } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'

export const fmtCurrency = (v: number) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const getLogoUrl = () => new URL(logoSrc, window.location.href).href

export interface PiPdfData {
  leadName: string
  leadCnpj: string
  leadIe: string
  leadAddress: string
  leadCity: string
  leadUF: string
  leadCep: string
  leadBairro: string
  leadPhone: string
  leadEmail: string
  leadContact: string
  dateStr: string
  items: ProductionEquipment[]
  discount: number
  shipping: number
  shippingType: string
  totalValue: number
  paymentCondition: string
  itemsTotal: number
  deliveryDate: string
}

export function extractPiData(order: InternalOrder, lead?: Lead): PiPdfData {
  const ld = lead || order.expand?.lead_id
  const itemsTotal = (order.items || []).reduce(
    (s, eq) => s + (eq.replacementItems?.reduce((rs, ri) => rs + (ri.total || 0), 0) || 0),
    0,
  )
  return {
    leadName: order.cliente_nome || ld?.name || '---',
    leadCnpj: order.cliente_cnpj || ld?.cnpj || '---',
    leadIe: order.cliente_ie || ld?.ie || '---',
    leadAddress: order.cliente_endereco || ld?.address || '---',
    leadCity: order.cliente_cidade || ld?.city || '---',
    leadUF: order.cliente_uf || ld?.uf || '---',
    leadCep: order.cliente_cep || ld?.cep || '---',
    leadBairro: order.cliente_bairro || ld?.neighborhood || '---',
    leadPhone: order.cliente_telefone || ld?.phone || '---',
    leadEmail: order.cliente_email || ld?.email || '---',
    leadContact: order.cliente_contato || ld?.contact_name || '---',
    dateStr: order.document_date
      ? new Date(order.document_date).toLocaleDateString('pt-BR')
      : new Date(order.created).toLocaleDateString('pt-BR'),
    items: order.items || [],
    discount: order.discount_amount || 0,
    shipping: order.shipping_cost || 0,
    shippingType: order.shipping_type || '---',
    totalValue: order.total_value || itemsTotal,
    paymentCondition: order.payment_condition || '---',
    itemsTotal,
    deliveryDate: order.delivery_date
      ? new Date(order.delivery_date).toLocaleDateString('pt-BR')
      : '---',
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

export function buildItemsHtml(items: ProductionEquipment[]): string {
  if (!items || items.length === 0) {
    return '<tr><td colspan="5" style="text-align:center;padding:10px">Nenhum item</td></tr>'
  }
  let html = ''
  let itemNum = 1
  for (const eq of items) {
    html += `<tr>
      <td colspan="5" style="background:#eff6ff;font-weight:bold;padding:4px 6px;color:#1e40af">
        Equipamento Série: ${eq.serialNumber || '---'}
        ${eq.equipmentDate ? ` | Data: ${new Date(eq.equipmentDate).toLocaleDateString('pt-BR')}` : ''}
        ${eq.deliveryDate ? ` | Entrega: ${new Date(eq.deliveryDate).toLocaleDateString('pt-BR')}` : ''}
      </td>
    </tr>`
    if (eq.replacementItems && eq.replacementItems.length > 0) {
      for (const ri of eq.replacementItems) {
        html += `<tr>
          <td style="text-align:center">${itemNum++}</td>
          <td style="padding-left:20px">${ri.description || '-'}</td>
          <td style="text-align:center">${ri.quantity}</td>
          <td style="text-align:right">${fmtCurrency(ri.unitPrice)}</td>
          <td style="text-align:right">${fmtCurrency(ri.total)}</td>
        </tr>`
      }
    } else {
      html +=
        '<tr><td colspan="5" style="text-align:center;padding:6px;color:#999">Sem itens de reposição</td></tr>'
    }
  }
  return html
}

export function buildClientInfoHtml(d: PiPdfData, accentBg: string): string {
  return `<table class="info-table">
  <tr><td class="label" style="background:${accentBg}">NOME:</td><td>${d.leadName}</td></tr>
  <tr><td class="label" style="background:${accentBg}">CNPJ:</td><td>${d.leadCnpj}</td><td class="label" style="background:${accentBg}">I.E.:</td><td>${d.leadIe}</td></tr>
  <tr><td class="label" style="background:${accentBg}">ENDEREÇO:</td><td colspan="3">${d.leadAddress}</td></tr>
  <tr><td class="label" style="background:${accentBg}">BAIRRO:</td><td>${d.leadBairro}</td><td class="label" style="background:${accentBg}">CEP:</td><td>${d.leadCep}</td></tr>
  <tr><td class="label" style="background:${accentBg}">CIDADE/UF:</td><td>${d.leadCity}/${d.leadUF}</td><td class="label" style="background:${accentBg}">FONE:</td><td>${d.leadPhone}</td></tr>
  <tr><td class="label" style="background:${accentBg}">EMAIL:</td><td>${d.leadEmail}</td><td class="label" style="background:${accentBg}">CONTATO:</td><td>${d.leadContact}</td></tr>
</table>`
}

export function buildFinanceHtml(d: PiPdfData, accent: string, accentBg: string): string {
  return `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Financeiro</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px">
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:140px;background:${accentBg}">CONDIÇÃO PAGAMENTO:</td><td style="border:1px solid #ccc;padding:4px 6px">${d.paymentCondition}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">TIPO DE FRETE:</td><td style="border:1px solid #ccc;padding:4px 6px">${d.shippingType}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">SOMA ITENS:</td><td style="border:1px solid #ccc;padding:4px 6px;text-align:right">${fmtCurrency(d.itemsTotal)}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">DESCONTO:</td><td style="border:1px solid #ccc;padding:4px 6px;text-align:right">${fmtCurrency(d.discount)}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">FRETE/SEDEX:</td><td style="border:1px solid #ccc;padding:4px 6px;text-align:right">${fmtCurrency(d.shipping)}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accent};color:#fff;font-size:13px">TOTAL GERAL:</td><td style="border:1px solid #ccc;padding:4px 6px;text-align:right;font-weight:bold;font-size:13px">${fmtCurrency(d.totalValue)}</td></tr>
</table>`
}

export function buildLogisticsPdfHtml(
  d: PiPdfData,
  order: InternalOrder,
  accent: string,
  accentBg: string,
): string {
  return `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Logística</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px">
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:140px;background:${accentBg}">TRANSPORTADORA:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${order.carrier_name || '-'}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">DATA DE ENTREGA:</td><td style="border:1px solid #ccc;padding:4px 6px">${d.deliveryDate}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:100px;background:${accentBg}">QTD VOLUMES:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.volumes_quantity || 1}</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">PESO LÍQUIDO:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.net_weight || 0} kg</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">PESO BRUTO:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.gross_weight || 0} kg</td></tr>
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;background:${accentBg}">EMBALAGEM:</td><td colspan="3" style="border:1px solid #ccc;padding:4px 6px">${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
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

import type { InternalOrder, Lead } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'
import {
  type LeadInfo,
  getLeadInfo,
  buildItemsRows,
  buildClientSection,
  buildLogisticsSection,
  buildTotalsSection,
  buildNotesSection,
} from '@/lib/pi-pdf-helpers'

function buildTemplate(
  order: InternalOrder,
  info: LeadInfo,
  logoUrl: string,
  isConserto: boolean,
): string {
  const accent = isConserto ? '#ea580c' : '#2563eb'
  const accentBg = isConserto ? '#fff7ed' : '#eff6ff'
  const title = isConserto ? 'MODELO PI - CONSERTO' : 'MODELO PI - EQUIPAMENTO NOVO'
  const opLabel = isConserto ? 'RETORNO DE CONSERTO' : 'EQUIPAMENTO NOVO'
  const dateStr = new Date(order.created).toLocaleDateString('pt-BR')
  const items = order.items || []

  const consertoSection = isConserto
    ? `<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Dados da Remessa (Conserto)</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px">
  <tr><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:150px;background:${accentBg}">NF DE REMESSA:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.conserto_invoice_number || '-'}</td><td style="border:1px solid #ccc;padding:4px 6px;font-weight:bold;width:100px;background:${accentBg}">DATA DA NF:</td><td style="border:1px solid #ccc;padding:4px 6px">${order.conserto_invoice_date ? new Date(order.conserto_invoice_date).toLocaleDateString('pt-BR') : '-'}</td></tr>
</table>`
    : ''

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>${title} - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${accent};padding-bottom:15px;margin-bottom:15px}
.logo-img{max-width:180px}
.title{font-size:16px;font-weight:bold;color:${accent};text-transform:uppercase}
.pat-cell{font-size:12px;color:#4b5563;margin-top:5px;font-weight:bold}
.tech-table td, .tech-table th{border:1px solid #ccc;padding:6px}
.tech-table th{background:${accentBg};font-weight:bold;color:#4b5563;text-align:left}
@media print{body{padding:0}}
</style></head><body>

<div class="header">
  <div><img src="${logoUrl}" class="logo-img" alt="Sigma Transformadores" /></div>
  <div style="text-align:right">
    <div class="title">${title}</div>
    ${order.pi_number ? `<div class="pat-cell" style="font-size:14px;color:${accent}">Nº ${order.pi_number}</div>` : ''}
    <div class="pat-cell">OPERAÇÃO: ${opLabel}</div>
    <div class="pat-cell">Data: ${dateStr}</div>
  </div>
</div>

${buildClientSection(info, accent, accentBg)}
${consertoSection}

<div style="font-size:12px;font-weight:bold;color:#fff;background:${accent};padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px">Itens do Pedido</div>
<table class="tech-table">
  <thead><tr>
    <th style="width:40px;text-align:center">Item</th>
    <th style="width:60px;text-align:center">Qtd</th>
    <th>Descrição</th>
    <th style="width:80px;text-align:center">NCM</th>
    <th style="width:100px;text-align:right">Valor Unit.</th>
    <th style="width:100px;text-align:right">Subtotal</th>
  </tr></thead>
  <tbody>
    ${buildItemsRows(items)}
    ${buildTotalsSection(order, items, accent)}
  </tbody>
</table>

${buildLogisticsSection(order, accent, accentBg)}
${buildNotesSection(order.notes || '', accent)}

<div style="margin-top:40px;text-align:center;color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px">
  Sigma Transformadores Ltda - Pedido Interno Gerado Eletronicamente
</div>

</body></html>`
}

export function exportPiPDF(order: InternalOrder, lead?: Lead) {
  const logoUrl = new URL(logoSrc, window.location.href).href
  const info = getLeadInfo(order, lead)
  const isConserto = order.operation_type === 'conserto'
  const html = buildTemplate(order, info, logoUrl, isConserto)

  const win = window.open('', '_blank')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

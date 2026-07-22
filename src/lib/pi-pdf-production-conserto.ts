import type { InternalOrder, Lead } from '@/services/api'
import {
  getLogoUrl,
  extractProductionData,
  openPrintWindow,
  buildConsertoItemsHtml,
  buildLogisticsHtml,
  buildSignaturesHtml,
} from './pi-pdf-production-shared'

export function exportProductionPdfConserto(order: InternalOrder, lead?: Lead) {
  const logoUrl = getLogoUrl()
  const d = extractProductionData(order, lead)
  const itemsHtml = buildConsertoItemsHtml(d.items)
  const logisticsHtml = buildLogisticsHtml(order, '#ea580c', '#fff7ed')
  const signaturesHtml = buildSignaturesHtml()
  const notes = order.production_notes || order.notes || ''
  const invoiceDate = order.conserto_invoice_date
    ? new Date(order.conserto_invoice_date).toLocaleDateString('pt-BR')
    : '-'

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PI Produção - Conserto - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ea580c;padding-bottom:15px;margin-bottom:15px}
.logo-img{max-width:180px}
.title{font-size:16px;font-weight:bold;color:#ea580c;text-transform:uppercase}
.subtitle{font-size:13px;font-weight:bold;color:#9a3412;text-transform:uppercase;margin-top:2px}
.pat-cell{font-size:12px;color:#9a3412;margin-top:5px;font-weight:bold}
.section-title{font-size:12px;font-weight:bold;color:#fff;background:#ea580c;padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px}
table.info-table td{border:1px solid #ccc;padding:4px 6px}
.label{font-weight:bold;color:#9a3412;width:120px;background:#fff7ed}
.tech-table td,.tech-table th{border:1px solid #ccc;padding:6px}
.tech-table th{background:#fff7ed;font-weight:bold;color:#9a3412;text-align:left}
.remessa-box{border:2px solid #ea580c;background:#fff7ed;padding:12px;margin-bottom:15px;border-radius:4px}
.remessa-box-title{font-size:13px;font-weight:bold;color:#ea580c;text-transform:uppercase;margin-bottom:8px}
@media print{body{padding:0}}
</style></head><body>
<div style="text-align:center;border-bottom:2px solid #ea580c;padding-bottom:10px;margin-bottom:12px">
  <img src="${logoUrl}" style="max-width:140px;margin:0 auto 4px" alt="Sigma Transformadores" />
  ${order.pi_number ? `<div style="font-size:28px;font-weight:bold;color:#ea580c;margin-top:4px">Nº ${order.pi_number}</div>` : ''}
  <div style="font-size:12px;font-weight:bold;color:#9a3412;margin-top:4px;text-transform:uppercase">Tipo de Operação: Retorno de Conserto</div>
  <div style="font-size:10px;color:#9a3412;margin-top:2px">Data: ${d.dateStr}</div>
</div>
<div class="remessa-box">
  <div class="remessa-box-title">Dados da Remessa (Conserto)</div>
  <table style="width:100%;border:none;font-size:12px">
    <tr>
      <td style="border:none;font-weight:bold;color:#9a3412;width:150px">NF DE REMESSA:</td>
      <td style="border:none;font-size:14px;font-weight:bold">${order.conserto_invoice_number || '-'}</td>
      <td style="border:none;font-weight:bold;color:#9a3412;width:120px">DATA DA NF:</td>
      <td style="border:none;font-size:14px;font-weight:bold">${invoiceDate}</td>
    </tr>
  </table>
</div>
<div class="section-title">Cliente</div>
<table class="info-table">
  <tr><td class="label">NOME:</td><td>${d.leadName}</td></tr>
</table>
<div class="section-title">Retorno de Conserto — Itens da Produção</div>
<table class="tech-table">
  <thead><tr>
    <th style="width:30px;text-align:center">Item</th>
    <th style="width:40px;text-align:center">Qtd</th>
    <th>Equipamento</th>
    <th>Subst.</th>
    <th style="width:80px">Nº Série</th>
    <th style="width:70px;text-align:center">Data do EQ</th>
    <th style="width:70px;text-align:center">Entrega em</th>
  </tr></thead>
  <tbody>${itemsHtml}</tbody>
</table>
${notes ? `<div class="section-title">Observações de Produção</div><div style="border:1px solid #ccc;padding:8px 10px;margin-bottom:15px;min-height:40px;white-space:pre-wrap;font-size:11px">${notes}</div>` : ''}
${logisticsHtml}
${signaturesHtml}
<div style="margin-top:20px;text-align:center;color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px">Sigma Transformadores Ltda - Pedido Interno de Produção (Conserto) Gerado Eletronicamente</div>
</body></html>`

  openPrintWindow(html)
}

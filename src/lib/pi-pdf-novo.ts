import type { InternalOrder, Lead } from '@/services/api'
import {
  getLogoUrl,
  extractPiData,
  openPrintWindow,
  buildItemsHtml,
  buildClientInfoHtml,
  buildFinanceHtml,
  buildLogisticsPdfHtml,
  buildSignaturesHtml,
} from './pi-pdf-shared'

export function exportPiNovoPDF(order: InternalOrder, lead?: Lead) {
  const logoUrl = getLogoUrl()
  const d = extractPiData(order, lead)
  const itemsHtml = buildItemsHtml(d.items)
  const clientHtml = buildClientInfoHtml(d, '#eff6ff')
  const financeHtml = buildFinanceHtml(d, '#2563eb', '#eff6ff')
  const logisticsHtml = buildLogisticsPdfHtml(d, order, '#2563eb', '#eff6ff')
  const signaturesHtml = buildSignaturesHtml()
  const notes = order.notes || ''

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PI Financeiro - Equipamento Novo - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.section-title{font-size:12px;font-weight:bold;color:#fff;background:#2563eb;padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px}
table.info-table td{border:1px solid #ccc;padding:4px 6px}
.label{font-weight:bold;color:#4b5563;width:120px}
.tech-table td,.tech-table th{border:1px solid #ccc;padding:6px}
.tech-table th{background:#eff6ff;font-weight:bold;color:#1e40af;text-align:left}
@media print{body{padding:0}}
</style></head><body>
<div style="text-align:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:12px">
  <img src="${logoUrl}" style="max-width:140px;margin:0 auto 4px" alt="Sigma Transformadores" />
  ${order.pi_number ? `<div style="font-size:28px;font-weight:bold;color:#2563eb;margin-top:4px">Nº ${order.pi_number}</div>` : ''}
  <div style="font-size:12px;font-weight:bold;color:#1e40af;margin-top:4px;text-transform:uppercase">Pedido Interno - Equipamento Novo</div>
  <div style="font-size:10px;color:#6b7280;margin-top:2px">Data: ${d.dateStr}</div>
</div>
<div class="section-title">Cliente</div>
${clientHtml}
<div class="section-title">Itens do Pedido</div>
<table class="tech-table">
  <thead><tr>
    <th style="width:40px;text-align:center">Item</th>
    <th>Descrição</th>
    <th style="width:60px;text-align:center">Qtd</th>
    <th style="width:90px;text-align:right">Vl. Unit.</th>
    <th style="width:90px;text-align:right">Total</th>
  </tr></thead>
  <tbody>${itemsHtml}</tbody>
</table>
${financeHtml}
${logisticsHtml}
${notes ? `<div class="section-title">Observações</div><div style="border:1px solid #ccc;padding:8px 10px;margin-bottom:15px;min-height:40px;white-space:pre-wrap;font-size:11px">${notes}</div>` : ''}
${signaturesHtml}
<div style="margin-top:20px;text-align:center;color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px">Sigma Transformadores Ltda - Pedido Interno Gerado Eletronicamente</div>
</body></html>`

  openPrintWindow(html)
}

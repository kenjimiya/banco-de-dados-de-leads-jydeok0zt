import type { InternalOrder, Lead } from '@/services/api'
import {
  getLogoUrl,
  extractProductionData,
  openPrintWindow,
  buildProductionItemsHtml,
  buildLogisticsHtml,
  buildSignaturesHtml,
} from './pi-pdf-production-shared'

export function exportProductionPdfNovo(order: InternalOrder, lead?: Lead) {
  const logoUrl = getLogoUrl()
  const d = extractProductionData(order, lead)
  const itemsHtml = buildProductionItemsHtml(d.items)
  const logisticsHtml = buildLogisticsHtml(order, '#2563eb', '#eff6ff')
  const signaturesHtml = buildSignaturesHtml()
  const notes = order.production_notes || order.notes || ''

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PI Produção - Equipamento Novo - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:15px;margin-bottom:15px}
.logo-img{max-width:180px}
.title{font-size:16px;font-weight:bold;color:#2563eb;text-transform:uppercase}
.subtitle{font-size:13px;font-weight:bold;color:#1e40af;text-transform:uppercase;margin-top:2px}
.pat-cell{font-size:12px;color:#4b5563;margin-top:5px;font-weight:bold}
.section-title{font-size:12px;font-weight:bold;color:#fff;background:#2563eb;padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px}
table.info-table td{border:1px solid #ccc;padding:4px 6px}
.label{font-weight:bold;color:#4b5563;width:120px;background:#f3f4f6}
.tech-table td,.tech-table th{border:1px solid #ccc;padding:6px}
.tech-table th{background:#f3f4f6;font-weight:bold;color:#4b5563;text-align:left}
@media print{body{padding:0}}
</style></head><body>
<div style="text-align:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:12px">
  <img src="${logoUrl}" style="max-width:140px;margin:0 auto 4px" alt="Sigma Transformadores" />
  ${order.pi_number ? `<div style="font-size:22px;font-weight:bold;color:#2563eb;margin-top:4px">Nº ${order.pi_number}</div>` : ''}
  <div style="font-size:12px;font-weight:bold;color:#1e40af;margin-top:4px;text-transform:uppercase">Tipo de Operação: Equipamento Novo</div>
  <div style="font-size:10px;color:#6b7280;margin-top:2px">Data: ${d.dateStr}</div>
</div>
<div class="section-title">Dados do Cliente</div>
<table class="info-table">
  <tr><td class="label">RAZÃO SOCIAL:</td><td colspan="3">${d.leadName}</td></tr>
  <tr><td class="label">CNPJ:</td><td>${d.leadCnpj}</td><td class="label" style="width:100px;">INSCR. EST.:</td><td>${d.leadIe}</td></tr>
  <tr><td class="label">ENDEREÇO:</td><td colspan="3">${d.leadAddress}</td></tr>
  <tr><td class="label">CIDADE/UF:</td><td>${d.leadCity} / ${d.leadUF}</td><td class="label">CEP:</td><td>${d.leadCep}</td></tr>
</table>
<div class="section-title">Equipamento Novo — Itens da Produção</div>
<table class="tech-table">
  <thead><tr>
    <th style="width:40px;text-align:center">Item</th>
    <th style="width:60px;text-align:center">Qtd</th>
    <th>Composição / Descrição</th>
  </tr></thead>
  <tbody>${itemsHtml}</tbody>
</table>
${notes ? `<div class="section-title">Observações de Produção</div><div style="border:1px solid #ccc;padding:8px 10px;margin-bottom:15px;min-height:40px;white-space:pre-wrap;font-size:11px">${notes}</div>` : ''}
${logisticsHtml}
${signaturesHtml}
<div style="margin-top:20px;text-align:center;color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px">Sigma Transformadores Ltda - Pedido Interno de Produção Gerado Eletronicamente</div>
</body></html>`

  openPrintWindow(html)
}

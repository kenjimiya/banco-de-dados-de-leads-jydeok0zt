import type { InternalOrder, Lead } from '@/services/api'
import {
  fmtCurrency,
  getLogoUrl,
  extractPiData,
  openPrintWindow,
  buildItemsHtml,
} from './pi-pdf-shared'

export function exportPiConsertoPDF(order: InternalOrder, lead?: Lead) {
  const logoUrl = getLogoUrl()
  const d = extractPiData(order, lead)
  const itemsHtml = buildItemsHtml(d.items)

  const invoiceDate = order.conserto_invoice_date
    ? new Date(order.conserto_invoice_date).toLocaleDateString('pt-BR')
    : '-'

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PI - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:10px;color:#000;padding:15px}
.pi-header{text-align:center;border-bottom:2px solid #ea580c;padding-bottom:8px;margin-bottom:8px}
.pi-header img{max-width:140px;margin:0 auto 4px}
.pi-number{font-size:22px;font-weight:bold;color:#ea580c;margin-top:4px}
.pi-op-type{font-size:12px;font-weight:bold;color:#9a3412;margin-top:4px;text-transform:uppercase}
.pi-date{font-size:10px;color:#9a3412;margin-top:2px}
.section-title{font-size:10px;font-weight:bold;color:#fff;background:#ea580c;padding:3px 8px;margin-bottom:4px;text-transform:uppercase;border-radius:2px}
.section-title-blue{font-size:10px;font-weight:bold;color:#fff;background:#2563eb;padding:3px 8px;margin-bottom:4px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:6px;font-size:10px}
table.info-table td{border:1px solid #ccc;padding:3px 6px}
.label{font-weight:bold;color:#9a3412;width:80px;background:#fff7ed}
.label-blue{font-weight:bold;color:#4b5563;width:80px;background:#f3f4f6}
.tech-table td,.tech-table th{border:1px solid #ccc;padding:4px 6px}
.tech-table th{background:#fff7ed;font-weight:bold;color:#9a3412;text-align:left}
.totals-row{font-weight:bold;background:#fff7ed}
.remessa-box{border:2px solid #ea580c;background:#fff7ed;padding:8px;margin-bottom:6px;border-radius:4px}
.remessa-box-title{font-size:11px;font-weight:bold;color:#ea580c;text-transform:uppercase;margin-bottom:4px}
@media print{body{padding:10px}}
</style></head><body>
<div class="pi-header">
  <img src="${logoUrl}" alt="Sigma Transformadores" />
  ${order.pi_number ? `<div class="pi-number">Nº ${order.pi_number}</div>` : ''}
  <div class="pi-op-type">Tipo de Operação: Retorno de Conserto</div>
  <div class="pi-date">Data: ${d.dateStr}</div>
</div>
<div class="remessa-box">
  <div class="remessa-box-title">Dados da Remessa (Conserto)</div>
  <table style="width:100%;border:none;font-size:11px">
    <tr>
      <td style="border:none;font-weight:bold;color:#9a3412;width:120px">NF DE REMESSA:</td>
      <td style="border:none;font-size:13px;font-weight:bold">${order.conserto_invoice_number || '-'}</td>
      <td style="border:none;font-weight:bold;color:#9a3412;width:100px">DATA DA NF:</td>
      <td style="border:none;font-size:13px;font-weight:bold">${invoiceDate}</td>
    </tr>
  </table>
</div>
<div class="section-title">Cliente</div>
<table class="info-table">
  <tr><td class="label">NOME:</td><td>${d.leadName}</td></tr>
</table>
<div class="section-title">Itens do Pedido</div>
<table class="tech-table">
  <thead><tr>
    <th style="width:30px;text-align:center">Item</th><th style="width:40px;text-align:center">Qtd</th>
    <th>Descrição</th><th style="width:60px;text-align:center">NCM</th>
    <th style="width:80px;text-align:right">Valor Unit.</th><th style="width:80px;text-align:right">Subtotal</th>
  </tr></thead>
  <tbody>
    ${itemsHtml}
    <tr><td colspan="5" style="text-align:right;font-weight:bold">SOMA DOS ITENS:</td><td style="text-align:right;font-weight:bold">${fmtCurrency(d.subtotal)}</td></tr>
    <tr><td colspan="5" style="text-align:right;font-weight:bold;color:#ef4444">DESCONTO:</td><td style="text-align:right;font-weight:bold;color:#ef4444">- ${fmtCurrency(order.discount_amount || 0)}</td></tr>
    <tr><td colspan="5" style="text-align:right;font-weight:bold;color:#16a34a">FRETE (${order.shipping_type || 'N/A'}):</td><td style="text-align:right;font-weight:bold;color:#16a34a">+ ${fmtCurrency(order.shipping_cost || 0)}</td></tr>
    <tr class="totals-row"><td colspan="5" style="text-align:right;font-size:12px">VALOR TOTAL:</td><td style="text-align:right;font-size:12px;color:#ea580c">${fmtCurrency(order.total_value || 0)}</td></tr>
  </tbody>
</table>
<div class="section-title-blue">Logística e Financeiro</div>
<table class="info-table">
  <tr><td class="label-blue">COND. PAG.:</td><td>${order.payment_condition || '-'}</td><td class="label-blue" style="width:70px;">ENTREGA:</td><td>${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '-'}</td></tr>
  <tr><td class="label-blue">TRANSPORTADORA:</td><td colspan="3">${order.carrier_name || '-'}</td></tr>
  <tr><td class="label-blue">VOLUMES:</td><td>${order.volumes_quantity || 1}</td><td class="label-blue">EMBALAGEM:</td><td>${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
  <tr><td class="label-blue">PESO LÍQ.:</td><td>${order.net_weight || 0} kg</td><td class="label-blue">PESO BRUTO:</td><td>${order.gross_weight || 0} kg</td></tr>
</table>
${order.notes ? `<div class="section-title-blue">Observações</div><div style="border:1px solid #ccc;padding:4px 6px;margin-bottom:6px;white-space:pre-wrap;font-size:10px">${order.notes}</div>` : ''}
<div style="margin-top:20px;text-align:center;color:#6b7280;font-size:9px;border-top:1px solid #e5e7eb;padding-top:6px">Sigma Transformadores Ltda - Pedido Interno de Conserto Gerado Eletronicamente</div>
</body></html>`

  openPrintWindow(html)
}

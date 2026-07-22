import type { InternalOrder, Lead } from '@/services/api'
import {
  fmtCurrency,
  getLogoUrl,
  extractPiData,
  openPrintWindow,
  buildItemsHtml,
} from './pi-pdf-shared'

export function exportPiNovoPDF(order: InternalOrder, lead?: Lead) {
  const logoUrl = getLogoUrl()
  const d = extractPiData(order, lead)
  const itemsHtml = buildItemsHtml(d.items)

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PI - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:10px;color:#000;padding:15px}
.pi-header{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:8px}
.pi-header img{max-width:140px;margin:0 auto 4px}
.pi-number{font-size:28px;font-weight:bold;color:#2563eb;margin-top:4px}
.pi-op-type{font-size:12px;font-weight:bold;color:#1e40af;margin-top:4px;text-transform:uppercase}
.pi-date{font-size:10px;color:#6b7280;margin-top:2px}
.section-title{font-size:10px;font-weight:bold;color:#fff;background:#2563eb;padding:3px 8px;margin-bottom:4px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:6px;font-size:10px}
table.info-table td{border:1px solid #ccc;padding:3px 6px}
.label{font-weight:bold;color:#4b5563;width:80px;background:#f3f4f6}
.tech-table td,.tech-table th{border:1px solid #ccc;padding:4px 6px}
.tech-table th{background:#f3f4f6;font-weight:bold;color:#4b5563;text-align:left}
.totals-row{font-weight:bold;background:#eff6ff}
@page{size:A4;margin:8mm}
@media print{body{padding:5px;font-size:9px}.pi-header img{max-width:100px}table{margin-bottom:4px}.section-title{padding:2px 6px;margin-bottom:2px}.info-table td{padding:2px 4px}.tech-table td,.tech-table th{padding:3px 4px}}
</style></head><body>
<div class="pi-header">
  <img src="${logoUrl}" alt="Sigma Transformadores" />
  ${order.pi_number ? `<div class="pi-number">Nº ${order.pi_number}</div>` : ''}
  <div class="pi-op-type">Tipo de Operação: Equipamento Novo</div>
  <div class="pi-date">Data: ${d.dateStr}</div>
</div>
<div class="section-title">Cliente</div>
<table class="info-table">
  <tr><td class="label">NOME:</td><td colspan="3">${d.leadName}</td></tr>
  <tr><td class="label">CNPJ:</td><td>${d.leadCnpj}</td><td class="label" style="width:60px;">I.E.:</td><td>${d.leadIe}</td></tr>
  <tr><td class="label">ENDEREÇO:</td><td colspan="3">${d.leadAddress}</td></tr>
  <tr><td class="label">CEP:</td><td colspan="3">${d.leadCep}</td></tr>
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
    <tr class="totals-row"><td colspan="5" style="text-align:right;font-size:12px">VALOR TOTAL:</td><td style="text-align:right;font-size:12px;color:#2563eb">${fmtCurrency(order.total_value || 0)}</td></tr>
  </tbody>
</table>
<div class="section-title">Logística e Financeiro</div>
<table class="info-table">
  <tr><td class="label">COND. PAG.:</td><td>${order.payment_condition || '-'}</td><td class="label" style="width:70px;">ENTREGA:</td><td>${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '-'}</td></tr>
  <tr><td class="label">TRANSPORTADORA:</td><td colspan="3">${order.carrier_name || '-'}</td></tr>
  <tr><td class="label">VOLUMES:</td><td>${order.volumes_quantity || 1}</td><td class="label">EMBALAGEM:</td><td>${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
  <tr><td class="label">PESO LÍQ.:</td><td>${order.net_weight || 0} kg</td><td class="label">PESO BRUTO:</td><td>${order.gross_weight || 0} kg</td></tr>
</table>
${order.notes ? `<div class="section-title">Observações</div><div style="border:1px solid #ccc;padding:4px 6px;margin-bottom:6px;white-space:pre-wrap;font-size:10px">${order.notes}</div>` : ''}
<div style="margin-top:20px;text-align:center;color:#6b7280;font-size:9px;border-top:1px solid #e5e7eb;padding-top:6px">Sigma Transformadores Ltda - Pedido Interno Gerado Eletronicamente</div>
</body></html>`

  openPrintWindow(html)
}

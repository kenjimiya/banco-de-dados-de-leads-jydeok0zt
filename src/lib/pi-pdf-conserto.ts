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
<title>PI Conserto - ${order.pi_number || order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ea580c;padding-bottom:15px;margin-bottom:15px}
.logo-img{max-width:180px}
.title{font-size:16px;font-weight:bold;color:#ea580c;text-transform:uppercase}
.pat-cell{font-size:12px;color:#9a3412;margin-top:5px;font-weight:bold}
.section-title{font-size:12px;font-weight:bold;color:#fff;background:#ea580c;padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px}
.section-title-blue{font-size:12px;font-weight:bold;color:#fff;background:#2563eb;padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px}
table.info-table td{border:1px solid #ccc;padding:4px 6px}
.label{font-weight:bold;color:#9a3412;width:120px;background:#fff7ed}
.label-blue{font-weight:bold;color:#4b5563;width:120px;background:#f3f4f6}
.tech-table td,.tech-table th{border:1px solid #ccc;padding:6px}
.tech-table th{background:#fff7ed;font-weight:bold;color:#9a3412;text-align:left}
.totals-row{font-weight:bold;background:#fff7ed}
.remessa-box{border:2px solid #ea580c;background:#fff7ed;padding:12px;margin-bottom:15px;border-radius:4px}
.remessa-box-title{font-size:13px;font-weight:bold;color:#ea580c;text-transform:uppercase;margin-bottom:8px}
@media print{body{padding:0}}
</style></head><body>
<div class="header">
  <div><img src="${logoUrl}" class="logo-img" alt="Sigma Transformadores" /></div>
  <div style="text-align:right">
    <div class="title">MODELO PI - CONSERTO</div>
    ${order.pi_number ? `<div class="pat-cell" style="font-size:14px;color:#ea580c">Nº ${order.pi_number}</div>` : ''}
    <div class="pat-cell">OPERAÇÃO: RETORNO DE CONSERTO</div>
    <div class="pat-cell">Data: ${d.dateStr}</div>
  </div>
</div>
<div class="remessa-box">
  <div class="remessa-box-title">⚠ Dados da Remessa (Conserto)</div>
  <table style="width:100%;border:none;font-size:12px">
    <tr>
      <td style="border:none;font-weight:bold;color:#9a3412;width:150px">NF DE REMESSA:</td>
      <td style="border:none;font-size:14px;font-weight:bold">${order.conserto_invoice_number || '-'}</td>
      <td style="border:none;font-weight:bold;color:#9a3412;width:120px">DATA DA NF:</td>
      <td style="border:none;font-size:14px;font-weight:bold">${invoiceDate}</td>
    </tr>
  </table>
</div>
<div class="section-title">Dados do Cliente</div>
<table class="info-table">
  <tr><td class="label">RAZÃO SOCIAL:</td><td colspan="3">${d.leadName}</td></tr>
  <tr><td class="label">CNPJ:</td><td>${d.leadCnpj}</td><td class="label" style="width:100px;">INSCR. ESTADUAL:</td><td>${d.leadIe}</td></tr>
  <tr><td class="label">ENDEREÇO:</td><td colspan="3">${d.leadAddress}</td></tr>
  <tr><td class="label">CIDADE/UF:</td><td>${d.leadCity} / ${d.leadUF}</td><td class="label">CEP:</td><td>${d.leadCep}</td></tr>
  <tr><td class="label">TELEFONE:</td><td>${d.leadPhone}</td><td class="label">CONTATO:</td><td>${d.leadContact}</td></tr>
  <tr><td class="label">EMAIL:</td><td colspan="3">${d.leadEmail}</td></tr>
</table>
<div class="section-title">Itens do Pedido</div>
<table class="tech-table">
  <thead><tr>
    <th style="width:40px;text-align:center">Item</th><th style="width:60px;text-align:center">Qtd</th>
    <th>Descrição</th><th style="width:80px;text-align:center">NCM</th>
    <th style="width:100px;text-align:right">Valor Unit.</th><th style="width:100px;text-align:right">Subtotal</th>
  </tr></thead>
  <tbody>
    ${itemsHtml}
    <tr><td colspan="5" style="text-align:right;font-weight:bold">SOMA DOS ITENS:</td><td style="text-align:right;font-weight:bold">${fmtCurrency(d.subtotal)}</td></tr>
    <tr><td colspan="5" style="text-align:right;font-weight:bold;color:#ef4444">DESCONTO:</td><td style="text-align:right;font-weight:bold;color:#ef4444">- ${fmtCurrency(order.discount_amount || 0)}</td></tr>
    <tr><td colspan="5" style="text-align:right;font-weight:bold;color:#16a34a">FRETE (${order.shipping_type || 'N/A'}):</td><td style="text-align:right;font-weight:bold;color:#16a34a">+ ${fmtCurrency(order.shipping_cost || 0)}</td></tr>
    <tr class="totals-row"><td colspan="5" style="text-align:right;font-size:13px">VALOR TOTAL DO PEDIDO:</td><td style="text-align:right;font-size:13px;color:#ea580c">${fmtCurrency(order.total_value || 0)}</td></tr>
  </tbody>
</table>
<div class="section-title-blue">Logística e Financeiro</div>
<table class="info-table">
  <tr><td class="label-blue">CONDIÇÃO DE PAG.:</td><td>${order.payment_condition || '-'}</td><td class="label-blue" style="width:100px;">DATA DE ENTREGA:</td><td>${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '-'}</td></tr>
  <tr><td class="label-blue">TRANSPORTADORA:</td><td colspan="3">${order.carrier_name || '-'}</td></tr>
  <tr><td class="label-blue">QTD VOLUMES:</td><td>${order.volumes_quantity || 1}</td><td class="label-blue">TIPO EMBALAGEM:</td><td>${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td></tr>
  <tr><td class="label-blue">PESO LÍQUIDO:</td><td>${order.net_weight || 0} kg</td><td class="label-blue">PESO BRUTO:</td><td>${order.gross_weight || 0} kg</td></tr>
</table>
${order.notes ? `<div class="section-title-blue">Observações</div><div style="border:1px solid #ccc;padding:8px 10px;margin-bottom:15px;min-height:40px;white-space:pre-wrap;font-size:11px">${order.notes}</div>` : ''}
<div style="margin-top:40px;text-align:center;color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px">Sigma Transformadores Ltda - Pedido Interno de Conserto Gerado Eletronicamente</div>
</body></html>`

  openPrintWindow(html)
}

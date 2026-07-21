import type { InternalOrder, Lead } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function exportPiPDF(order: InternalOrder, lead?: Lead) {
  const logoUrl = new URL(logoSrc, window.location.href).href
  const dateStr = new Date(order.created).toLocaleDateString('pt-BR')

  const leadName = lead?.name || '---'
  const leadCnpj = lead?.cnpj || '---'
  const leadIe = lead?.ie || '---'
  const leadAddress = lead?.address || '---'
  const leadCity = lead?.city || '---'
  const leadUF = lead?.uf || '---'
  const leadCep = lead?.cep || '---'
  const leadPhone = lead?.phone || '---'
  const leadEmail = lead?.email || '---'
  const leadContact = lead?.contact_name || '---'

  const items = order.items || []
  const itemsHtml = items
    .map(
      (item, index) => `
    <tr>
      <td style="text-align:center">${index + 1}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td>${item.description}</td>
      <td style="text-align:center">${item.ncm || '-'}</td>
      <td style="text-align:right">${fmtCurrency(item.unit_price)}</td>
      <td style="text-align:right">${fmtCurrency(item.subtotal)}</td>
    </tr>
  `,
    )
    .join('')

  const subtotal = items.reduce((acc, i) => acc + (i.subtotal || 0), 0)

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Pedido Interno PI-${order.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:15px;margin-bottom:15px}
.logo-img{max-width:180px}
.title{font-size:16px;font-weight:bold;color:#2563eb;text-transform:uppercase}
.pat-cell{font-size:12px;color:#4b5563;margin-top:5px;font-weight:bold}
.section-title{font-size:12px;font-weight:bold;color:#fff;background:#2563eb;padding:4px 8px;margin-bottom:8px;text-transform:uppercase;border-radius:2px}
table{width:100%;border-collapse:collapse;margin-bottom:15px;font-size:11px}
table.info-table td{border:1px solid #ccc;padding:4px 6px;}
.label{font-weight:bold;color:#4b5563;width:120px;background:#f3f4f6}
.tech-table td, .tech-table th{border:1px solid #ccc;padding:6px;}
.tech-table th{background:#f3f4f6;font-weight:bold;color:#4b5563;text-align:left}
.totals-row{font-weight:bold;background:#eff6ff}
@media print{body{padding:0}}
</style></head><body>

<div class="header">
  <div>
    <img src="${logoUrl}" class="logo-img" alt="Sigma Transformadores" />
  </div>
  <div style="text-align:right">
    <div class="title">PEDIDO INTERNO (PI)</div>
    <div class="pat-cell">OPERAÇÃO: ${order.operation_type === 'novo' ? 'EQUIPAMENTO NOVO' : 'RETORNO DE CONSERTO'}</div>
    <div class="pat-cell">Data: ${dateStr}</div>
  </div>
</div>

<div class="section-title">Dados do Cliente</div>
<table class="info-table">
  <tr>
    <td class="label">RAZÃO SOCIAL:</td>
    <td colspan="3">${leadName}</td>
  </tr>
  <tr>
    <td class="label">CNPJ:</td>
    <td>${leadCnpj}</td>
    <td class="label" style="width:100px;">INSCR. ESTADUAL:</td>
    <td>${leadIe}</td>
  </tr>
  <tr>
    <td class="label">ENDEREÇO:</td>
    <td colspan="3">${leadAddress}</td>
  </tr>
  <tr>
    <td class="label">CIDADE/UF:</td>
    <td>${leadCity} / ${leadUF}</td>
    <td class="label">CEP:</td>
    <td>${leadCep}</td>
  </tr>
  <tr>
    <td class="label">TELEFONE:</td>
    <td>${leadPhone}</td>
    <td class="label">CONTATO:</td>
    <td>${leadContact}</td>
  </tr>
  <tr>
    <td class="label">EMAIL:</td>
    <td colspan="3">${leadEmail}</td>
  </tr>
</table>

${
  order.operation_type === 'conserto'
    ? `
<div class="section-title" style="background:#ea580c">Dados da Remessa (Conserto)</div>
<table class="info-table">
  <tr>
    <td class="label">NF DE REMESSA:</td>
    <td>${order.conserto_invoice_number || '-'}</td>
    <td class="label" style="width:100px;">DATA DA NF:</td>
    <td>${order.conserto_invoice_date ? new Date(order.conserto_invoice_date).toLocaleDateString('pt-BR') : '-'}</td>
  </tr>
</table>
`
    : ''
}

<div class="section-title">Itens do Pedido</div>
<table class="tech-table">
  <thead>
    <tr>
      <th style="width:40px;text-align:center">Item</th>
      <th style="width:60px;text-align:center">Qtd</th>
      <th>Descrição</th>
      <th style="width:80px;text-align:center">NCM</th>
      <th style="width:100px;text-align:right">Valor Unit.</th>
      <th style="width:100px;text-align:right">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHtml || '<tr><td colspan="6" style="text-align:center;padding:10px">Nenhum item</td></tr>'}
    <tr>
      <td colspan="5" style="text-align:right;font-weight:bold">SOMA DOS ITENS:</td>
      <td style="text-align:right;font-weight:bold">${fmtCurrency(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="5" style="text-align:right;font-weight:bold;color:#ef4444">DESCONTO:</td>
      <td style="text-align:right;font-weight:bold;color:#ef4444">- ${fmtCurrency(order.discount_amount || 0)}</td>
    </tr>
    <tr>
      <td colspan="5" style="text-align:right;font-weight:bold;color:#16a34a">FRETE (${order.shipping_type || 'N/A'}):</td>
      <td style="text-align:right;font-weight:bold;color:#16a34a">+ ${fmtCurrency(order.shipping_cost || 0)}</td>
    </tr>
    <tr class="totals-row">
      <td colspan="5" style="text-align:right;font-size:13px">VALOR TOTAL DO PEDIDO:</td>
      <td style="text-align:right;font-size:13px;color:#2563eb">${fmtCurrency(order.total_value || 0)}</td>
    </tr>
  </tbody>
</table>

<div class="section-title">Logística e Financeiro</div>
<table class="info-table">
  <tr>
    <td class="label">CONDIÇÃO DE PAG.:</td>
    <td>${order.payment_condition || '-'}</td>
    <td class="label" style="width:100px;">DATA DE ENTREGA:</td>
    <td>${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '-'}</td>
  </tr>
  <tr>
    <td class="label">TRANSPORTADORA:</td>
    <td colspan="3">${order.carrier_name || '-'}</td>
  </tr>
  <tr>
    <td class="label">QTD VOLUMES:</td>
    <td>${order.volumes_quantity || 1}</td>
    <td class="label">TIPO EMBALAGEM:</td>
    <td>${order.packaging_type === 'madeira' ? 'Madeira' : 'Papelão'}</td>
  </tr>
  <tr>
    <td class="label">PESO LÍQUIDO:</td>
    <td>${order.net_weight || 0} kg</td>
    <td class="label">PESO BRUTO:</td>
    <td>${order.gross_weight || 0} kg</td>
  </tr>
</table>

<div style="margin-top:40px;text-align:center;color:#6b7280;font-size:10px;border-top:1px solid #e5e7eb;padding-top:10px">
  Sigma Transformadores Ltda - Pedido Interno Gerado Eletronicamente
</div>

</body></html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

import type { Proposal, Lead } from '@/services/api'

const fmtCurrency = (v: number) => `R$ ${v.toFixed(2)}`

export function exportProposalPDF(proposal: Proposal, lead?: Lead) {
  const items = proposal.items || []
  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const leadName = lead?.name || proposal.expand?.lead_id?.name || 'Cliente'
  const leadEmail = lead?.email || proposal.expand?.lead_id?.email || ''
  const leadPhone = lead?.phone || proposal.expand?.lead_id?.phone || ''
  const leadUF = lead?.uf || proposal.expand?.lead_id?.uf || ''
  const leadActivity = lead?.activity || proposal.expand?.lead_id?.activity || ''

  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td style="text-align:center">${item.quantity}</td>
      <td>${item.description}</td>
      <td style="text-align:right">${fmtCurrency(item.unit_price)}</td>
      <td style="text-align:right">${fmtCurrency(item.total_price)}</td>
    </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Proposta ${proposal.title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;color:#333;padding:20px}
.header{display:flex;justify-content:space-between;border-bottom:2px solid #1a56db;padding-bottom:15px;margin-bottom:20px}
.company-name{font-size:18px;font-weight:bold;color:#1a56db}
.company-info{font-size:11px;color:#666;margin-top:4px}
.section{margin-bottom:15px}
.section-title{font-size:13px;font-weight:bold;color:#1a56db;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:3px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
th{background:#1a56db;color:#fff;padding:6px 8px;font-size:11px;text-align:left}
td{padding:6px 8px;border-bottom:1px solid #ddd}
.total-row{font-weight:bold;font-size:14px;background:#f0f4ff}
.terms{font-size:11px;line-height:1.6;list-style:none}
.terms li{margin-bottom:4px}
.approval{margin-top:30px;display:flex;gap:40px}
.approval-box{border:1px solid #ccc;padding:10px;width:200px;text-align:center;font-size:11px}
ul{list-style:none}
@media print{body{padding:0}}
</style></head><body>
<div class="header"><div>
<div class="company-name">Sigma Transformadores Ltda</div>
<div class="company-info">Mauro Miyawaki — Gerente Comercial</div>
<div class="company-info">Tel: (41) 3385-8840 | sigma.producao@gmail.com</div>
</div><div style="text-align:right">
<div style="font-size:14px;font-weight:bold">PROPOSTA COMERCIAL</div>
<div class="company-info">Nº ${proposal.title || '—'}</div>
<div class="company-info">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
</div></div>
<div class="section"><div class="section-title">Dados do Cliente</div>
<table>
<tr><td style="width:120px;font-weight:bold">Cliente:</td><td>${leadName}</td><td style="width:80px;font-weight:bold">UF:</td><td>${leadUF || '—'}</td></tr>
<tr><td style="font-weight:bold">Atividade:</td><td>${leadActivity || '—'}</td><td style="font-weight:bold">Telefone:</td><td>${leadPhone || '—'}</td></tr>
<tr><td style="font-weight:bold">Email:</td><td colspan="3">${leadEmail || '—'}</td></tr>
</table></div>
<div class="section"><div class="section-title">Descrição da Proposta — ${proposal.title}</div>
<table><thead><tr><th style="width:60px">Qtd</th><th>Descrição</th><th style="width:120px;text-align:right">Preço Unit.</th><th style="width:120px;text-align:right">Total</th></tr></thead>
<tbody>${itemsRows || '<tr><td colspan="4" style="text-align:center;color:#999">Nenhum item</td></tr>'}
<tr class="total-row"><td colspan="3" style="text-align:right">PREÇO TOTAL:</td><td style="text-align:right">${fmtCurrency(grandTotal)}</td></tr>
</tbody></table></div>
${proposal.composition ? `<div class="section"><div class="section-title">Composição da Proposta</div><p>${proposal.composition}</p></div>` : ''}
<div class="section"><div class="section-title">Escopo da Proposta</div>
<p>Fornecimento do(s) equipamento(s) relacionado(s) na Descrição da Proposta para instalação pela equipe de manutenção elétrica do cliente ou empresa terceirizada autorizada, contando com o manual de instalação do equipamento, assim como as devidas identificações no equipamento e suporte via telefone da Sigma Transformadores Ltda.</p>
<p style="margin-top:6px">Caso haja necessidade de novo deslocamento técnico por parte da Sigma Transformadores, a mesma será por conta e ordem do cliente, assim como alimentação e hospedagem.</p></div>
<div class="section"><div class="section-title">Benefícios da Proposta</div>
<p>Ao adquirir um produto Sigma Transformadores, além da superior performance, qualidade e design, você conta com o melhor atendimento pós-venda.</p>
<p style="margin-top:6px">Através de sua Assistência Técnica Autorizada, responsável por um atendimento de credibilidade e empatia, em que você encontra preços justos e profissionais treinados para realizar o melhor serviço dentro e fora de garantia.</p></div>
<div class="section"><div class="section-title">Termos e Condições Comerciais</div>
<ul class="terms">
<li><strong>Valor Total:</strong> ${fmtCurrency(grandTotal)}</li>
<li><strong>Prazo de Entrega:</strong> ${proposal.delivery_time || 'A Combinar'}</li>
<li><strong>Condição de Pagamento:</strong> ${proposal.payment_condition || 'A Combinar'}</li>
<li><strong>Impostos:</strong> Inclusos (Empresa optante pelo regime SIMPLES)</li>
<li><strong>Validade da Proposta:</strong> ${proposal.expiry_date ? new Date(proposal.expiry_date).toLocaleDateString('pt-BR') : '5 dias a contar da data de emissão'}</li>
<li><strong>Garantia:</strong> Garantimos os equipamentos por 06 meses contra eventuais defeitos de fabricação, exceto materiais elétricos e pneumáticos.</li>
<li><strong>Frete / Seguro:</strong> ${proposal.freight_info || 'FOB – Favor indicar a transportadora de sua preferência'}</li>
</ul></div>
<div class="approval"><div class="approval-box"><br><br>_______________________<br><br>Nome<br>Título<br>Data</div></div>
<p style="margin-top:20px;font-size:10px;color:#999;text-align:center">
Obrigado pela oportunidade. Aguardamos a confirmação do seu pedido.<br>
Atenciosamente, Mauro Miyawaki — Gerente Comercial — Sigma Transformadores Ltda</p>
</body></html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }
  win.document.write(html)
  win.document.close()
  setTimeout(() => {
    win.print()
  }, 500)
}

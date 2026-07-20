import type { TechnicalProposal, Lead } from '@/services/api'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function exportPatPDF(proposal: TechnicalProposal, lead?: Lead) {
  const leadName = lead?.name || proposal.expand?.lead_id?.name || 'Cliente'
  const leadEmail = lead?.email || proposal.expand?.lead_id?.email || ''
  const leadPhone = lead?.phone || proposal.expand?.lead_id?.phone || ''
  const leadUF = lead?.uf || proposal.expand?.lead_id?.uf || ''
  const leadActivity = lead?.activity || proposal.expand?.lead_id?.activity || ''
  const dateStr = proposal.date
    ? new Date(proposal.date).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PAT ${proposal.proposal_number || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;color:#333;padding:20px}
.header{display:flex;justify-content:space-between;border-bottom:2px solid #1a56db;padding-bottom:15px;margin-bottom:20px}
.company-name{font-size:18px;font-weight:bold;color:#1a56db}
.company-info{font-size:11px;color:#666;margin-top:4px}
.section{margin-bottom:15px}
.section-title{font-size:13px;font-weight:bold;color:#1a56db;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:3px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
td{padding:6px 8px;border-bottom:1px solid #ddd}
.total-row{font-weight:bold;font-size:14px;background:#f0f4ff}
.terms{font-size:11px;line-height:1.6;list-style:none}
.terms li{margin-bottom:4px}
@media print{body{padding:0}}
</style></head><body>
<div class="header"><div>
<div class="company-name">Sigma Transformadores Ltda</div>
<div class="company-info">Mauro Miyawaki — Gerente Comercial</div>
<div class="company-info">Tel: (41) 3385-8840 | sigma.producao@gmail.com</div>
</div><div style="text-align:right">
<div style="font-size:14px;font-weight:bold">PROPOSTA DE ASSISTÊNCIA TÉCNICA</div>
<div class="company-info">Nº ${proposal.proposal_number || '—'}</div>
<div class="company-info">Data: ${dateStr}</div>
</div></div>
<div class="section"><div class="section-title">Dados do Cliente</div>
<table>
<tr><td style="width:120px;font-weight:bold">Cliente:</td><td>${leadName}</td><td style="width:80px;font-weight:bold">UF:</td><td>${leadUF || '—'}</td></tr>
<tr><td style="font-weight:bold">Atividade:</td><td>${leadActivity || '—'}</td><td style="font-weight:bold">Telefone:</td><td>${leadPhone || '—'}</td></tr>
<tr><td style="font-weight:bold">Email:</td><td colspan="3">${leadEmail || '—'}</td></tr>
</table></div>
<div class="section"><div class="section-title">Informações da Nota Fiscal</div>
<table>
<tr><td style="width:120px;font-weight:bold">Nº Proposta:</td><td>${proposal.proposal_number || '—'}</td><td style="width:120px;font-weight:bold">Nº Nota Fiscal:</td><td>${proposal.invoice_number || '—'}</td></tr>
<tr><td style="font-weight:bold">Data:</td><td>${dateStr}</td><td style="font-weight:bold">Status:</td><td>${(proposal.status || '').toUpperCase()}</td></tr>
</table></div>
<div class="section"><div class="section-title">Descrição do Defeito</div>
<p style="line-height:1.6;white-space:pre-wrap">${proposal.defect || 'Não informado.'}</p></div>
<div class="section"><div class="section-title">Solução Proposta</div>
<p style="line-height:1.6;white-space:pre-wrap">${proposal.solution || 'Não informado.'}</p></div>
<div class="section">
<table><tbody>
<tr class="total-row"><td style="text-align:right">PREÇO TOTAL:</td><td style="text-align:right;width:150px">${fmtCurrency(proposal.total_price || 0)}</td></tr>
</tbody></table></div>
<div class="section"><div class="section-title">Termos e Condições</div>
<ul class="terms">
<li><strong>Valor Total:</strong> ${fmtCurrency(proposal.total_price || 0)}</li>
<li><strong>Garantia:</strong> Garantimos o serviço executado por 03 meses contra eventuais defeitos.</li>
<li><strong>Validade:</strong> 5 dias a contar da data de emissão.</li>
</ul></div>
<p style="margin-top:20px;font-size:10px;color:#999;text-align:center">
Obrigado pela oportunidade. Aguardamos a confirmação do serviço.<br>
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

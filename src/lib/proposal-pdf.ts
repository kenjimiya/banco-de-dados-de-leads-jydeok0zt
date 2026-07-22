import type { Proposal, Lead } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'
import { valueToWords } from '@/lib/number-to-words'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function shortenName(name: string): string {
  if (!name) return 'Cliente'
  const words = name.trim().split(/\s+/)
  if (words.length <= 1) return name
  const stopWords = new Set([
    'IND.',
    'IND',
    'COM.',
    'COM',
    'LTDA',
    'E',
    'DE',
    'DA',
    'DO',
    'DAS',
    'DOS',
    'S.A.',
    'SA',
    'ME',
    'EPP',
    'LTD',
    'ME.',
  ])
  const firstMeaningful = words.find((w) => !stopWords.has(w.replace(/[.-]/g, '').toUpperCase()))
  const base = firstMeaningful || words[0]
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase().replace(/[.-]$/, '')
}

export function exportProposalPDF(proposal: Proposal, lead?: Lead) {
  const logoUrl = new URL(logoSrc, window.location.href).href
  const items = proposal.items || []
  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const leadName = lead?.name || proposal.expand?.lead_id?.name || 'Cliente'
  const leadEmail = lead?.email || proposal.expand?.lead_id?.email || ''
  const leadPhone = lead?.phone || proposal.expand?.lead_id?.phone || ''
  const leadUF = lead?.uf || proposal.expand?.lead_id?.uf || ''
  const leadActivity = lead?.activity || proposal.expand?.lead_id?.activity || ''
  const leadAddress = lead?.address || proposal.expand?.lead_id?.address || '—'
  const leadCep = lead?.cep || proposal.expand?.lead_id?.cep || '—'
  const leadCity = lead?.city || proposal.expand?.lead_id?.city || '—'
  const leadNeighborhood = lead?.neighborhood || proposal.expand?.lead_id?.neighborhood || '—'
  const leadCnpj = lead?.cnpj || proposal.expand?.lead_id?.cnpj || '—'
  const leadIe = lead?.ie || proposal.expand?.lead_id?.ie || '—'
  const leadContact = lead?.contact_name || proposal.expand?.lead_id?.contact_name || '—'
  const shortName = shortenName(leadName)

  const rawTitle = proposal.title || ''
  let cleanTitle = rawTitle.trim()
  if (cleanTitle.toUpperCase().startsWith('PCS')) {
    cleanTitle = cleanTitle.replace(/^PCS\s*/i, '').trim()
  }
  if (shortName !== 'Cliente' && shortName !== '') {
    const re = new RegExp(`\\s*${shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
    cleanTitle = cleanTitle.replace(re, '').trim()
  }
  const proposalIdParts = ['PCS', cleanTitle]
  if (shortName !== 'Cliente' && shortName !== '') proposalIdParts.push(shortName)
  const proposalId = proposalIdParts.filter(Boolean).join(' ')

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
body{font-family:Arial,sans-serif;font-size:15px;color:#333;padding:20px}
.header{display:flex;flex-direction:row;align-items:stretch;justify-content:space-between;border-bottom:2px solid #2563eb;padding:20px 20px 28px;margin-bottom:28px;gap:50px}
.header-left{flex:0 0 auto;display:flex;align-items:center}
.header-center{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px}
.header-right{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;text-align:right;gap:6px}
.logo-img{max-width:260px;max-height:90px;width:auto;height:auto}
.proposal-title{font-size:26px;font-weight:bold;color:#2563eb;letter-spacing:2px}
.proposal-id{font-size:16px;color:#1e40af;font-weight:bold}
.proposal-meta{font-size:15px;color:#374151;line-height:1.8}
.proposal-meta strong{color:#1e40af}
.contact-info{font-size:14px;color:#4b5563;line-height:1.6}
.contact-info strong{color:#1e40af}
.company-info{font-size:15px;color:#4b5563}
.section{margin-bottom:15px}
.section-title{font-size:16px;font-weight:bold;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
th{background:#2563eb;color:#fff;padding:8px 10px;font-size:14px;text-align:left}
td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:15px}
.total-row{font-weight:bold;font-size:16px;background:#f0f4ff}
.terms{font-size:14px;line-height:1.7;list-style:none}
.terms li{margin-bottom:5px}
.approval{margin-top:30px;display:flex;gap:40px}
.approval-box{border:1px solid #ccc;padding:12px;width:220px;text-align:center;font-size:14px}
.signature{margin-top:35px;text-align:center}
.signature-line{border-top:1px solid #333;width:300px;margin:0 auto 8px}
.signature-text{font-size:14px;color:#333;font-weight:bold}
ul{list-style:none}
@media print{body{padding:0}}
</style></head><body>
<div class="header">
  <div class="header-left">
    <img src="${logoUrl}" class="logo-img" alt="Sigma Transformadores" />
  </div>
  <div class="header-center">
    <div class="proposal-title">PROPOSTA COMERCIAL</div>
    <div class="proposal-id">${proposalId}</div>
    <div class="proposal-meta">
      <div>Revisão: <strong>${proposal.revision || '00'}</strong></div>
      <div>Data: <strong>${new Date().toLocaleDateString('pt-BR')}</strong></div>
    </div>
  </div>
  <div class="header-right">
    <div class="contact-info"><strong>Eng. Mauro - Gerente Comercial</strong></div>
    <div class="contact-info">Tel: (41) 3385-8840 | sigma.producao@gmail.com</div>
  </div>
</div>
<div class="section"><div class="section-title">Dados do Cliente</div>
<table>
<tr><td style="width:130px;font-weight:bold">Nome:</td><td colspan="3">${leadName}</td></tr>
<tr><td style="font-weight:bold">Endereço:</td><td>${leadAddress}</td><td style="width:90px;font-weight:bold">CEP:</td><td>${leadCep}</td></tr>
<tr><td style="font-weight:bold">Cidade/UF:</td><td>${leadCity}/${leadUF || '—'}</td><td style="font-weight:bold">Bairro:</td><td>${leadNeighborhood}</td></tr>
<tr><td style="font-weight:bold">Telefone:</td><td>${leadPhone || '—'}</td><td style="font-weight:bold">Atividade:</td><td>${leadActivity || '—'}</td></tr>
<tr><td style="font-weight:bold">CNPJ:</td><td>${leadCnpj}</td><td style="font-weight:bold">I.E.:</td><td>${leadIe}</td></tr>
<tr><td style="font-weight:bold">Email:</td><td colspan="3">${leadEmail || '—'}</td></tr>
<tr><td style="font-weight:bold">Contato:</td><td colspan="3">${leadContact}</td></tr>
</table></div>
<div class="section"><div class="section-title">Descrição da Proposta — ${proposal.title}</div>
<table><thead><tr><th style="width:70px">Qtd</th><th>Descrição</th><th style="width:140px;text-align:right">Preço Unit.</th><th style="width:140px;text-align:right">Total</th></tr></thead>
<tbody>${itemsRows || '<tr><td colspan="4" style="text-align:center;color:#999">Nenhum item</td></tr>'}
<tr class="total-row"><td colspan="3" style="text-align:right">PREÇO TOTAL:</td><td style="text-align:right">${fmtCurrency(grandTotal)}</td></tr>
</tbody></table></div>
${
  proposal.composition
    ? `<div class="section"><div class="section-title">Composição da Proposta</div><ul style="list-style:disc;padding-left:20px;line-height:1.8;">${proposal.composition
        .split('\n')
        .filter((l: string) => l.trim())
        .map((l: string) => `<li>${l.trim()}</li>`)
        .join('')}</ul></div>`
    : ''
}
<div class="section"><div class="section-title">Escopo da Proposta</div>
<p>Fornecimento do(s) equipamento(s) relacionado(s) na Descrição da Proposta para instalação pela equipe de manutenção elétrica do cliente ou empresa terceirizada autorizada, contando com o manual de instalação do equipamento, assim como as devidas identificações no equipamento e suporte via telefone da Sigma Transformadores Ltda.</p>
<p style="margin-top:8px">Caso haja necessidade de novo deslocamento técnico por parte da Sigma Transformadores, a mesma será por conta e ordem do cliente, assim como alimentação e hospedagem.</p></div>
<div class="section"><div class="section-title">Benefícios da Proposta</div>
<p>Ao adquirir um produto Sigma Transformadores, além da superior performance, qualidade e design, você conta com o melhor atendimento pós-venda.</p>
<p style="margin-top:8px">Através de sua Assistência Técnica Autorizada, responsável por um atendimento de credibilidade e empatia, em que você encontra preços justos e profissionais treinados para realizar o melhor serviço dentro e fora de garantia.</p></div>
<div class="section"><div class="section-title">Termos e Condições Comerciais</div>
<ul class="terms">
<li><strong>Valor Total:</strong> ${fmtCurrency(grandTotal)} (${valueToWords(grandTotal)})</li>
<li><strong>Prazo de Entrega:</strong> ${proposal.delivery_time || 'A Combinar'}</li>
<li><strong>Condição de Pagamento:</strong> ${proposal.payment_condition || 'A Combinar'}</li>
<li><strong>Impostos:</strong> Inclusos (Empresa optante pelo regime SIMPLES)</li>
<li><strong>Validade da Proposta:</strong> ${proposal.expiry_date ? new Date(proposal.expiry_date).toLocaleDateString('pt-BR') : '5 dias a contar da data de emissão'}</li>
<li><strong>Garantia:</strong> Garantimos os equipamentos por 06 meses contra eventuais defeitos de fabricação, exceto materiais elétricos e pneumáticos.</li>
<li><strong>Frete / Seguro:</strong> ${proposal.freight_info || 'FOB – Favor indicar a transportadora de sua preferência'}</li>
</ul></div>
<p style="margin-top:30px;font-size:14px;color:#333;text-align:center;line-height:1.8">
Obrigado pela oportunidade. Aguardamos a confirmação do seu pedido.<br>
Atenciosamente, Eng Mauro Miyawaki — Gerente Comercial — Sigma Transformadores Ltda</p>
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

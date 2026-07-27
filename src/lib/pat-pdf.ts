import type { TechnicalProposal, Lead, TechnicalDiagnostic } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'
import { valueToWords } from '@/lib/number-to-words'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function exportPatPDF(proposal: TechnicalProposal, lead?: Lead) {
  const logoUrl = new URL(logoSrc, window.location.href).href
  const leadName = lead?.name || proposal.expand?.lead_id?.name || 'Cliente'
  const leadEmail = lead?.email || proposal.expand?.lead_id?.email || ''
  const leadPhone = lead?.phone || proposal.expand?.lead_id?.phone || ''
  const leadUF = lead?.uf || proposal.expand?.lead_id?.uf || ''
  const leadAddress = lead?.address || proposal.expand?.lead_id?.address || '—'
  const leadCep = lead?.cep || proposal.expand?.lead_id?.cep || '—'
  const leadCity = lead?.city || proposal.expand?.lead_id?.city || '—'
  const leadNeighborhood = lead?.neighborhood || proposal.expand?.lead_id?.neighborhood || '—'
  const leadCnpj = lead?.cnpj || proposal.expand?.lead_id?.cnpj || '—'
  const leadIe = lead?.ie || proposal.expand?.lead_id?.ie || '—'
  const leadContact = lead?.contact_name || proposal.expand?.lead_id?.contact_name || '—'
  const dateStr = proposal.date
    ? new Date(proposal.date).toLocaleDateString('pt-BR')
    : new Date(proposal.created).toLocaleDateString('pt-BR')

  const rawPatNumber = proposal.proposal_number || '---'
  const patNumber = rawPatNumber.replace(/^PAT\s*/i, '').trim()

  const diagnostics: TechnicalDiagnostic[] = proposal.items || []

  const grandTotal = diagnostics.reduce(
    (sum, diag) =>
      sum + (diag.parts || []).reduce((s, p) => s + (p.quantity || 1) * (p.unit_price || 0), 0),
    0,
  )

  const diagnosticsHtml = diagnostics
    .map((diag, index) => {
      const parts = diag.parts || []
      const diagTotal = parts.reduce((sum, p) => sum + (p.quantity || 1) * (p.unit_price || 0), 0)

      const mfgDate = diag.manufacturing_date
        ? new Date(diag.manufacturing_date).toLocaleDateString('pt-BR')
        : '-'

      const safeParts =
        parts.length > 0
          ? parts
          : [
              {
                defect: '-',
                description: '-',
                quantity: 1,
                unit_price: 0,
                total_price: 0,
              },
            ]

      const defectList = safeParts.map((p) => `<li>${p.defect || '-'}</li>`).join('')

      const solutionRows = safeParts
        .map((p) => {
          const qtyStr = p.quantity && p.quantity > 1 ? `${p.quantity}x ` : ''
          const valStr = (p.total_price || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          return `
          <tr>
            <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px">${index + 1}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px">${qtyStr}${p.description || '-'}</td>
            <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px">${p.quantity || 1}</td>
            <td style="text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px">${fmtCurrency(p.unit_price || 0)}</td>
            <td style="text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px">R$ ${valStr}</td>
          </tr>`
        })
        .join('')

      return `
      <div style="margin-bottom:24px;page-break-inside:avoid">
        <div style="background:#f0f4ff;border-left:4px solid #2563eb;padding:10px 14px;margin-bottom:12px;border-radius:0 6px 6px 0">
          <span style="font-size:16px;font-weight:bold;color:#2563eb">Laudo Técnico ${index + 1}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:14px">
          <tr>
            <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold;color:#2563eb;width:140px;background:#f8fafc">Equipamento:</td>
            <td style="padding:6px 10px;border:1px solid #e5e7eb">${diag.equipment || '-'}</td>
            <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold;color:#2563eb;width:120px;background:#f8fafc">Nº Série:</td>
            <td style="padding:6px 10px;border:1px solid #e5e7eb">${diag.serial_number || '-'}</td>
          </tr>
          <tr>
            <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold;color:#2563eb;background:#f8fafc">Data Fabricação:</td>
            <td style="padding:6px 10px;border:1px solid #e5e7eb">${mfgDate}</td>
            <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold;color:#2563eb;background:#f8fafc">Item:</td>
            <td style="padding:6px 10px;border:1px solid #e5e7eb">${index + 1}</td>
          </tr>
        </table>
        <div style="margin-bottom:10px">
          <div style="font-size:15px;font-weight:bold;color:#2563eb;margin-bottom:4px;border-bottom:1px solid #e5e7eb;padding-bottom:3px">Defeito(s) Identificado(s):</div>
          <ul style="list-style:disc;padding-left:24px;line-height:1.8;font-size:14px;color:#374151">${defectList || '<li>-</li>'}</ul>
        </div>
        <div style="font-size:15px;font-weight:bold;color:#2563eb;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:3px">Solução / Itens de Substituição:</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
          <thead>
            <tr>
              <th style="width:50px;background:#2563eb;color:#fff;padding:8px 10px;font-size:13px;text-align:center">Item</th>
              <th style="background:#2563eb;color:#fff;padding:8px 10px;font-size:13px;text-align:left">Descrição</th>
              <th style="width:70px;background:#2563eb;color:#fff;padding:8px 10px;font-size:13px;text-align:center">Qtd</th>
              <th style="width:130px;background:#2563eb;color:#fff;padding:8px 10px;font-size:13px;text-align:right">Preço Unit.</th>
              <th style="width:130px;background:#2563eb;color:#fff;padding:8px 10px;font-size:13px;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${solutionRows}</tbody>
        </table>
        <div style="text-align:right;margin-bottom:4px">
          <span style="font-size:14px;color:#6b7280;margin-right:8px">Subtotal Laudo ${index + 1}:</span>
          <span style="font-weight:bold;color:#2563eb;font-size:15px">${fmtCurrency(diagTotal)}</span>
        </div>
      </div>`
    })
    .join('')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PAT ${patNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;padding:20px}
.header{border-bottom:2px solid #2563eb;padding:10px 20px 20px;margin-bottom:28px}
.header-content{display:flex;justify-content:space-between;align-items:center;gap:20px}
.header-left{flex:0 0 auto}
.header-center{flex:1 1 auto;text-align:center}
.header-right{flex:0 0 auto;text-align:right}
.logo-img{max-width:260px;max-height:90px;width:auto;height:auto}
.pat-title{font-size:24px;font-weight:bold;color:#2563eb;letter-spacing:1px}
.pat-id{font-size:15px;color:#4b5563;margin-bottom:4px}
.pat-meta{font-size:15px;color:#4b5563;margin-bottom:4px}
.section{margin-bottom:20px}
.section-title{font-size:16px;font-weight:bold;color:#2563eb;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}
table.data-table{width:100%;border-collapse:collapse;margin-bottom:10px}
table.data-table td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:14px}
table.data-table td.label{font-weight:bold;color:#2563eb;width:130px}
.total-box{background:#f0f4ff;border:2px solid #2563eb;border-radius:8px;padding:12px 20px;text-align:right;margin:20px 0;display:inline-block;float:right}
.total-label{font-size:14px;color:#4b5563;font-weight:bold}
.total-value{font-size:22px;font-weight:bold;color:#2563eb;margin-left:12px}
.text-block{line-height:1.8;margin-bottom:16px;text-align:justify;font-size:14px;color:#374151}
.terms-list{font-size:14px;line-height:1.8;list-style:none}
.terms-list li{margin-bottom:6px;padding-left:0}
.terms-list li strong{color:#2563eb}
.signature{margin-top:40px;text-align:center;page-break-inside:avoid}
.signature-line{border-top:1px solid #333;width:300px;margin:0 auto 8px}
.signature-text{font-size:14px;color:#333;font-weight:bold}
.footer{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #e5e7eb;padding:8px 20px;font-size:12px;color:#9ca3af;display:flex;justify-content:space-between;align-items:center;background:#fff}
.footer-center{text-align:center;flex:1}
.footer-left,.footer-right{flex:0 0 auto}
.page-info{text-align:center;font-size:12px;color:#9ca3af;margin-top:10px}
.content-wrapper{padding-bottom:60px}
@media print{
  body{padding:0}
  .header{padding:10px 0 20px}
  @page{margin:1.5cm 1.5cm 2.5cm 1.5cm}
  .footer{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #e5e7eb;padding:8px 0;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between;align-items:center;background:#fff}
}
</style></head><body>
<div class="content-wrapper">
<div class="header">
  <div class="header-content">
    <div class="header-left">
      <img src="${logoUrl}" class="logo-img" alt="Sigma Transformadores" />
    </div>
    <div class="header-center">
      <div class="pat-title">PROPOSTA DE ASSISTÊNCIA TÉCNICA</div>
    </div>
    <div class="header-right">
      <div class="pat-id">PAT Nº ${patNumber}</div>
      <div class="pat-meta">Revisão: ${proposal.revision || '00'}</div>
      <div class="pat-meta">Data do Documento: ${dateStr}</div>
      <div style="height:12px"></div>
      <div class="pat-meta"><strong>Eng. Mauro - Gerente Comercial</strong></div>
      <div class="pat-meta">Tel: (41) 3385-8840</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Dados do Cliente</div>
  <table class="data-table">
    <tr><td class="label">Nome:</td><td colspan="3">${leadName}</td></tr>
    <tr><td class="label">Endereço:</td><td>${leadAddress}</td><td class="label" style="width:90px">CEP:</td><td>${leadCep}</td></tr>
    <tr><td class="label">Cidade/UF:</td><td>${leadCity}/${leadUF || '—'}</td><td class="label">Bairro:</td><td>${leadNeighborhood}</td></tr>
    <tr><td class="label">Telefone:</td><td>${leadPhone || '—'}</td><td class="label">Contato:</td><td>${leadContact}</td></tr>
    <tr><td class="label">CNPJ:</td><td>${leadCnpj}</td><td class="label">I.E.:</td><td>${leadIe}</td></tr>
    <tr><td class="label">Email:</td><td colspan="3">${leadEmail || '—'}</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">1. Descrição da Proposta</div>
  <div class="text-block">
    Conforme o envio de remessa de bens próprios para conserto.
    <table style="border-collapse:collapse;margin-top:8px;font-size:14px">
      <tr>
        <td style="border:1px solid #ddd;padding:6px 14px;font-weight:bold;color:#2563eb;background:#f8fafc">NF-e:</td>
        <td style="border:1px solid #ddd;padding:6px 14px">${proposal.invoice_number || '-'}</td>
        <td style="border:1px solid #ddd;padding:6px 14px;font-weight:bold;color:#2563eb;background:#f8fafc">Data:</td>
        <td style="border:1px solid #ddd;padding:6px 14px">${dateStr}</td>
      </tr>
    </table>
  </div>
  <div style="font-weight:bold;margin-bottom:10px;font-size:15px;color:#2563eb">Segue o laudo técnico:</div>
</div>

${diagnosticsHtml}

<div style="clear:both;margin-bottom:20px"></div>
<div class="total-box">
  <span class="total-label">VALOR TOTAL:</span>
  <span class="total-value">${fmtCurrency(proposal.total_price || grandTotal)}</span>
</div>
<div style="clear:both"></div>
<div style="text-align:right;margin-top:8px;margin-bottom:16px">
  <span style="font-size:13px;color:#4b5563;font-style:italic">(${valueToWords(proposal.total_price || grandTotal)})</span>
</div>

<div class="section" style="margin-top:28px">
  <div class="section-title">2. Escopo da Proposta</div>
  <div class="text-block">
    Conserto do(s) equipamento(s) relacionado(s) na Descrição da proposta (Item 1) para posterior instalação pela equipe de manutenção elétrica do cliente ou empresa terceirizada autorizada, contando com manual de instalação do equipamento, assim como as devidas identificações no equipamento e suporte via telefone da Sigma Transformadores LTDA.
  </div>
  <div class="text-block">
    Caso haja necessidade de deslocamento técnico por parte da Sigma Transformadores, a mesma será por conta e ordem do cliente, assim como alimentação e hospedagem.
  </div>
</div>

<div class="section">
  <div class="section-title">3. Benefícios da Proposta</div>
  <div class="text-block">
    Ao adquirir um produto Sigma Transformadores, além da superior performance, qualidade e design, você conta com o melhor atendimento pós-venda.
  </div>
  <div class="text-block">
    Através de sua Assistência Técnica Autorizada, responsável por um atendimento de credibilidade e empatia, onde você encontra preço justo e profissionais treinados para realizar o melhor serviço dentro e fora de garantia.
  </div>
</div>

<div class="section">
  <div class="section-title">4. Termos e Condições</div>
  <ul class="terms-list">
    <li><strong>Valor Total da Proposta:</strong> ${fmtCurrency(proposal.total_price || grandTotal)} (${valueToWords(proposal.total_price || grandTotal)})</li>
    <li><strong>Prazo de Entrega:</strong> ${proposal.delivery_time || 'A combinar'}</li>
    <li><strong>Condição de Pagamento:</strong> ${proposal.payment_condition || '28DDL'}</li>
    <li><strong>Impostos:</strong> Inclusos (Empresa optante pelo regime SIMPLES)</li>
    <li><strong>Validade da Proposta:</strong> ${proposal.validity || 'Proposta válida por 15 dias, a contar da data de emissão'}</li>
    <li><strong>Garantia:</strong> ${proposal.guarantee || 'Garantimos os equipamentos objetos desta proposta por um período de 06 meses, contra eventuais defeitos de fabricação, exceto materiais elétricos e pneumáticos (quando aplicado), por serem produtos de qualidade c/ garantia própria'}</li>
    <li><strong>Frete / Seguro:</strong> FOB (favor informar qual a transportadora de sua preferência)</li>
  </ul>
</div>

<div style="text-align:center;margin-top:40px;margin-bottom:20px;padding:20px;background:#f0f4ff;border-radius:8px;border:1px solid #2563eb">
  <div style="font-size:14px;color:#2563eb;font-weight:600;line-height:1.8">
    Agradecemos a preferência, aguardamos a confirmação da aprovação do orçamento para dar prosseguimento ao conserto.
  </div>
</div>
</div>

<div class="footer">
  <div class="footer-left">Sigma Transformadores Ltda</div>
  <div class="footer-center">Av. dos Bosques, 1231 — São José dos Pinhais / PR — CEP 83.075-180</div>
  <div class="footer-right">Tel: (41) 3385-8840 | sigma.producao@gmail.com</div>
</div>

<script>
(function() {
  var totalPages = 0;
  function addPageNumbers() {
    var body = document.body;
    var content = document.querySelector('.content-wrapper');
    if (!content) return;
    totalPages = Math.ceil(content.scrollHeight / (window.innerHeight - 80));
    var existing = document.querySelectorAll('.page-info');
    existing.forEach(function(e) { e.remove(); });
    var pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.style.cssText = 'position:fixed;bottom:24px;left:0;right:0;text-align:center;font-size:11px;color:#9ca3af';
    pageInfo.innerHTML = 'Página 1 de ' + (totalPages > 0 ? totalPages : 1);
    body.appendChild(pageInfo);
  }
  window.onload = function() { setTimeout(addPageNumbers, 300); };
})();
</script>
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

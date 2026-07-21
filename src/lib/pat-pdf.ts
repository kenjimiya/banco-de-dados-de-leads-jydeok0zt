import type { TechnicalProposal, Lead, TechnicalDiagnostic } from '@/services/api'
import logoSrc from '@/assets/logosigma-04ba5.jpg'

const fmtCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function exportPatPDF(proposal: TechnicalProposal, lead?: Lead) {
  const logoUrl = new URL(logoSrc, window.location.href).href
  const leadName = lead?.name || proposal.expand?.lead_id?.name || 'Cliente'
  const leadEmail = lead?.email || proposal.expand?.lead_id?.email || ''
  const leadPhone = lead?.phone || proposal.expand?.lead_id?.phone || ''
  const leadUF = lead?.uf || proposal.expand?.lead_id?.uf || ''
  const dateStr = proposal.date
    ? new Date(proposal.date).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  const rawPatNumber = proposal.proposal_number || '---'
  const patNumber = rawPatNumber.replace(/^PAT\s*/i, '').trim()

  const diagnostics: TechnicalDiagnostic[] = proposal.items || []

  const diagnosticsHtml = diagnostics
    .map((diag, index) => {
      const partsHtml = (diag.parts || [])
        .map((part) => {
          const qty = part.quantity || 1
          const price = part.unit_price || 0
          const total = qty * price
          return `
        <tr style="background-color: #f8f8f8;">
          <td style="text-align: center; vertical-align: middle;">${qty}</td>
          <td style="vertical-align: middle;">${part.description || '-'}</td>
          <td style="text-align: right; vertical-align: middle;">${fmtCurrency(price)}</td>
          <td style="text-align: right; vertical-align: middle; font-weight: bold;">${fmtCurrency(total)}</td>
        </tr>`
        })
        .join('')

      const diagTotal = (diag.parts || []).reduce(
        (sum, p) => sum + (p.quantity || 1) * (p.unit_price || 0),
        0,
      )

      const mfgDate = diag.manufacturing_date
        ? new Date(diag.manufacturing_date).toLocaleDateString('pt-BR')
        : '-'

      return `
    <div style="margin-bottom:15px;border:2px solid #000;">
      <div style="background-color:#cdd4ea;padding:6px 8px;font-weight:bold;color:#1e3a8a;font-size:14px;">
        LAUDO TÉCNICO ${index + 1}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:120px;border:1px solid #000;padding:6px 8px;font-weight:bold;color:#1e3a8a;vertical-align:top;">EQUIPAMENTO:</td>
          <td style="border:1px solid #000;padding:6px 8px;">${diag.equipment || '-'}</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;font-weight:bold;color:#1e3a8a;vertical-align:top;">Nº SÉRIE:</td>
          <td style="border:1px solid #000;padding:6px 8px;">${diag.serial_number || '-'}</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;font-weight:bold;color:#1e3a8a;vertical-align:top;">FABRICAÇÃO:</td>
          <td style="border:1px solid #000;padding:6px 8px;">${mfgDate}</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;font-weight:bold;color:#1e3a8a;vertical-align:top;">DEFEITO ${index + 1}:</td>
          <td style="border:1px solid #000;padding:6px 8px;">${diag.defect || '-'}</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;font-weight:bold;color:#1e3a8a;vertical-align:top;">SOLUÇÃO ${index + 1}:</td>
          <td style="border:1px solid #000;padding:6px 8px;">${diag.solution || '-'}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background-color:#e8ebf5;">
          <td style="width:60px;border:1px solid #000;padding:4px 8px;font-weight:bold;text-align:center;">Qtd</td>
          <td style="border:1px solid #000;padding:4px 8px;font-weight:bold;text-align:center;">Descrição do Item</td>
          <td style="width:120px;border:1px solid #000;padding:4px 8px;font-weight:bold;text-align:center;">Valor Unit.</td>
          <td style="width:120px;border:1px solid #000;padding:4px 8px;font-weight:bold;text-align:center;">Total</td>
        </tr>
        ${partsHtml}
        <tr>
          <td colspan="3" style="text-align:right;font-weight:bold;padding:6px 8px;border:1px solid #000;">SUBTOTAL LAUDO ${index + 1}:</td>
          <td style="text-align:right;font-weight:bold;padding:6px 8px;border:1px solid #000;background-color:#e8ebf5;">${fmtCurrency(diagTotal)}</td>
        </tr>
      </table>
    </div>
  `
    })
    .join('')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>PAT ${patNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:14px;color:#000;padding:20px}
.header-table{width:100%;border-collapse:collapse;margin-bottom:10px}
.header-table td{border:1px solid #000;padding:6px}
.logo-cell{width:250px;text-align:center;vertical-align:middle;}
.title-cell{text-align:center;font-weight:bold;font-size:16px;color:#1e3a8a;}
.pat-cell{text-align:center;font-weight:bold;font-size:15px;color:#1e3a8a;}
.address{font-style:italic;font-size:12px;margin-bottom:15px}
.info-table{width:100%;border-collapse:collapse;margin-bottom:15px}
.info-table td{border:1px solid #000;padding:6px 8px;}
.label{font-weight:bold;color:#1e3a8a;width:120px;}
.section-title{font-size:15px;font-weight:bold;color:#1e3a8a;margin-top:15px;margin-bottom:5px;text-transform:uppercase;}
.grand-total{font-weight:bold;font-size:15px;}
.text-block{line-height:1.6;margin-bottom:15px;text-align:justify;font-size:14px;}
.signature{margin-top:35px;text-align:center}
.signature-line{border-top:1px solid #333;width:300px;margin:0 auto 8px}
.signature-text{font-size:14px;color:#333;font-weight:bold}
@media print{body{padding:0}}
</style></head><body>

<table class="header-table">
  <tr>
    <td rowspan="2" class="logo-cell" style="padding:10px">
      <img src="${logoUrl}" style="max-width:200px" alt="Sigma Transformadores" />
    </td>
    <td class="title-cell">PROPOSTA DE ASSISTÊNCIA TÉCNICA</td>
    <td style="text-align:center;width:100px;"><b>Data:</b></td>
  </tr>
  <tr>
    <td class="pat-cell">PAT &nbsp;&nbsp; ${patNumber} &nbsp;&nbsp; Rev.${proposal.revision || '00'}</td>
    <td style="text-align:center;font-weight:bold;color:#1e3a8a;">${dateStr}</td>
  </tr>
</table>
<div class="address">Avenida dos Bosques, 1231 — São José dos Pinhais / Paraná / Brasil — CEP 83.075-180</div>

<table class="info-table">
  <tr>
    <td class="label">RAZÃO SOCIAL:</td>
    <td colspan="3">${leadName}</td>
  </tr>
  <tr>
    <td class="label">ENDEREÇO:</td>
    <td>-</td>
    <td class="label" style="width:80px;">CEP:</td>
    <td>-</td>
  </tr>
  <tr>
    <td class="label">CIDADE:</td>
    <td>-</td>
    <td class="label">BAIRRO:</td>
    <td>-</td>
  </tr>
  <tr>
    <td class="label">EMAIL:</td>
    <td>${leadEmail}</td>
    <td class="label">TELEFONE:</td>
    <td>${leadPhone}</td>
  </tr>
</table>

<div class="section-title">1-DESCRIÇÃO DA PROPOSTA:</div>
<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
  <span>Conforme o envio de remessa de bens próprios para conserto</span>
  <table style="border-collapse:collapse;">
    <tr>
      <td style="border:1px solid #000;padding:4px 12px;font-weight:bold;">Nfe</td>
      <td style="border:1px solid #000;padding:4px 12px;text-align:right;">${proposal.invoice_number || '-'}</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:4px 12px;font-weight:bold;">Data:</td>
      <td style="border:1px solid #000;padding:4px 12px;text-align:right;">${dateStr}</td>
    </tr>
  </table>
</div>
<div style="font-weight:bold;margin-bottom:5px;">Segue o laudo técnico:</div>

${diagnosticsHtml}

<div style="border:2px solid #000;padding:8px;margin-bottom:15px;text-align:right;background-color:#e8ebf5;">
  <span style="font-weight:bold;font-size:15px;">TOTAL R$ &nbsp; ${fmtCurrency(proposal.total_price || 0)}</span>
</div>

<div class="section-title">2-ESCOPO DA PROPOSTA:</div>
<div class="text-block">
  Conserto do(s) equipamento(s) relacionado(s) na Descrição da proposta (Item 1) para posterior instalação pela equipe de manutenção elétrica do cliente ou empresa terceirizada autorizada, contando com manual de instalação do equipamento, assim como as devidas identificações no equipamento e suporte via telefone da Sigma Transformadores LTDA.<br><br>
  Caso haja necessidade de deslocamento técnico por parte da Sigma Transformadores, a mesma será por conta e ordem do cliente, assim como alimentação e hospedagem.
</div>

<div class="section-title">3- BENEFÍCIOS DA PROPOSTA:</div>
<div class="text-block">
  Ao adquirir um produto Sigma Transformadores, além da superior performance, qualidade e design, você conta com o melhor atendimento pós-venda.<br>
  Através de sua Assistência Técnica Autorizada, responsável por um atendimento de credibilidade e empatia, onde você encontra preço justo e profissionais treinados para realizar o melhor serviço dentro e fora de garantia.
</div>

<div class="section-title">4- TERMOS E CONDIÇÕES:</div>
<div class="text-block">
  <b>DAS CONDIÇÕES:</b><br>
  Prevalecem as Condições Gerais de Fornecimento da Associação Brasileira da Indústria de Máquinas e Equipamentos, departamento Nacional de Máquinas e Ferramentas;<br><br>
  
  <table style="width:100%;border:none;margin-bottom:10px;">
    <tr><td style="width:220px;font-weight:bold;">VALOR TOTAL DA PROPOSTA:</td><td style="font-weight:bold;">${fmtCurrency(proposal.total_price || 0)}</td></tr>
    <tr><td style="font-weight:bold;">PRAZO DE ENTREGA:</td><td>${proposal.delivery_time || 'A combinar'}</td></tr>
    <tr><td style="font-weight:bold;">COND. PAGAMENTO:</td><td>${proposal.payment_condition || '28DDL'}</td></tr>
    <tr><td style="font-weight:bold;">IMPOSTOS:</td><td>Inclusos (Empresa optante pelo regime SIMPLES);</td></tr>
    <tr><td style="font-weight:bold;">VALIDADE DA PROPOSTA:</td><td>${proposal.validity || 'Proposta válida por 15 dias, a contar da data de emissão'}</td></tr>
  </table>

  <b>GARANTIA:</b><br>
  ${proposal.guarantee || 'Garantimos os equipamentos objetos desta proposta por um período de 06 meses, contra eventuais defeitos de fabricação, exceto materiais elétricos e pneumáticos (quando aplicado), por serem produtos de qualidade c/ garantia própria;'}<br><br>

  <b>FRETE/SEGURO:</b><br>
  FOB (favor informar qual a transportadora de sua preferência);<br><br>

  <b>CONDIÇÕES PROPOSTA/SEGURO:</b><br>
  Esta proposta uma vez dada como aceita, sendo a mesma firmada e reconhecida e aceita pelas partes de competência, passa automaticamente a ter cunho e força de pedido, prevalecendo sobre a mesma todas às garantias cabíveis a uma transação mercantil, sendo amparada pelos itens tabulados no anverso do pedido de produtos Sigma Transformadores;
</div>

<div class="signature">
  <div class="signature-line"></div>
  <div class="signature-text">Eng. Mauro Miyawaki - Gerente Comercial</div>
</div>

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

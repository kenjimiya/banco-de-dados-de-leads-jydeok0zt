import type { TechnicalProposal, Lead } from '@/services/api'
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

  const items = proposal.items || []

  const itemsHtml = items
    .map((item, index) => {
      const diagnostics = item.diagnostics || []
      const diagnosticsHtml = diagnostics
        .map((diag: any, di: number) => {
          const replaceQty = diag.replace_quantity || 1
          const replaceItem = diag.replace_item || ''
          const replacePrice = diag.replace_unit_price || diag.price || 0
          const replaceTotal = replaceQty * replacePrice
          return `
      <tr>
        <td colspan="2" style="font-weight: bold; text-align: center; vertical-align: middle;">DEFEITO ${di + 1}</td>
        <td colspan="3" style="white-space: pre-wrap; vertical-align: top;">${diag.defect || '-'}</td>
      </tr>
      <tr>
        <td colspan="2" style="font-weight: bold; text-align: center; vertical-align: middle;">SOLUÇÃO ${di + 1}</td>
        <td colspan="3" style="white-space: pre-wrap; vertical-align: top;">${diag.solution || '-'}</td>
      </tr>
      <tr style="background-color: #f8f8f8;">
        <td style="font-weight: bold; text-align: center; vertical-align: middle;">SUBSTITUIR</td>
        <td style="text-align: center; vertical-align: middle;">${replaceQty}</td>
        <td style="vertical-align: middle;">${replaceItem || '-'}</td>
        <td style="text-align: right; vertical-align: middle;">${fmtCurrency(replacePrice)}</td>
        <td style="text-align: right; vertical-align: middle; font-weight: bold;">${fmtCurrency(replaceTotal)}</td>
      </tr>`
        })
        .join('')

      return `
    <tbody>
      <tr class="item-header">
        <td style="width: 50px; font-weight: bold; text-align: center;">ITEM</td>
        <td style="width: 50px; font-weight: bold; text-align: center;">${index + 1}</td>
        <td style="font-weight: bold; text-align: center;">DESCRIÇÃO:</td>
        <td style="width: 80px; font-weight: bold; text-align: center;">Nº Série:</td>
        <td style="width: 120px; font-weight: bold; text-align: center;">Data de Fabricação:</td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td style="text-align: center;">${item.description || '-'}</td>
        <td style="text-align: center;">${item.serial_number || '-'}</td>
        <td style="text-align: center;">${item.manufacture_date ? new Date(item.manufacture_date).toLocaleDateString('pt-BR') : '-'}</td>
      </tr>
      ${diagnosticsHtml}
      <tr>
        <td colspan="4" style="text-align: right; font-weight: bold;">VALOR UNIT. (Qtd: ${item.quantity || 1}):</td>
        <td style="text-align: right; font-weight: bold; background-color: #f0f0f0;">${fmtCurrency(item.unit_price || 0)}</td>
      </tr>
      <tr>
        <td colspan="4" style="text-align: right; font-weight: bold;">SUBTOTAL ${index + 1}:</td>
        <td style="text-align: right; font-weight: bold; background-color: #e8ebf5;">${fmtCurrency(item.total_price || 0)}</td>
      </tr>
    </tbody>
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
.tech-table{width:100%;border-collapse:collapse;margin-bottom:15px;border:2px solid #000;}
.tech-table td{border:1px solid #000;padding:6px;}
.item-header{background-color:#cdd4ea;}
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

<table class="tech-table">
  ${itemsHtml}
  <tr>
    <td colspan="4" style="text-align:right;font-weight:bold;font-size:15px;padding:8px;">TOTAL R$</td>
    <td style="text-align:right;font-weight:bold;font-size:15px;padding:8px;background-color:#e8ebf5;">${fmtCurrency(proposal.total_price || 0)}</td>
  </tr>
</table>

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
  <div class="signature-text">Eng. Mauro Miyawaki - Gerente comercial</div>
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

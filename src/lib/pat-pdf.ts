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
      const parts = diag.parts || []
      const diagTotal = parts.reduce((sum, p) => sum + (p.quantity || 1) * (p.unit_price || 0), 0)

      const mfgDate = diag.manufacturing_date
        ? new Date(diag.manufacturing_date).toLocaleDateString('pt-BR')
        : '-'

      // Ensure we have at least 1 part so the rows don't break
      const safeParts =
        parts.length > 0
          ? parts
          : [{ defect: '-', description: '-', quantity: 1, unit_price: 0, total_price: 0 }]

      const defectRows = safeParts
        .map((p, i) => {
          if (i === 0) {
            return `
            <tr>
              <td style="border: 1px solid #000; font-weight: bold; text-align: center; padding: 4px; vertical-align: top;" rowspan="${safeParts.length}">DEFEITO:</td>
              <td style="border: 1px solid #000; padding: 4px;" colspan="2">${p.defect || '-'}</td>
              <td style="border: 1px solid #000; text-align: center; padding: 4px; vertical-align: middle;" rowspan="${safeParts.length}" colspan="2">VALOR UNIT.(R$)</td>
            </tr>
          `
          }
          return `
          <tr>
            <td style="border: 1px solid #000; padding: 4px;" colspan="2">${p.defect || '-'}</td>
          </tr>
        `
        })
        .join('')

      const solutionRows = safeParts
        .map((p, i) => {
          const qtyStr = p.quantity && p.quantity > 1 ? `${p.quantity} x ` : ''
          const valStr = (p.total_price || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          if (i === 0) {
            return `
            <tr>
              <td style="border: 1px solid #000; font-weight: bold; text-align: center; padding: 4px; vertical-align: top;" rowspan="${safeParts.length}">SOLUÇÃO:</td>
              <td style="border: 1px solid #000; padding: 4px;" colspan="2">${qtyStr}${p.description || '-'}</td>
              <td style="border: 1px solid #000; padding: 4px; border-right: none; width: 30px;">R$</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right; border-left: none;">${valStr}</td>
            </tr>
          `
          }
          return `
          <tr>
            <td style="border: 1px solid #000; padding: 4px;" colspan="2">${qtyStr}${p.description || '-'}</td>
            <td style="border: 1px solid #000; padding: 4px; border-right: none;">R$</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: right; border-left: none;">${valStr}</td>
          </tr>
        `
        })
        .join('')

      return `
      <table style="width:100%; border-collapse:collapse; border: 2px solid #000; margin-bottom: 20px; font-size: 13px;">
        <tr style="background-color: #a4c2f4; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #000; width: 12%; padding: 4px;">ITEM</td>
          <td style="border: 1px solid #000; width: 5%; padding: 4px;">${index + 1}</td>
          <td style="border: 1px solid #000; width: 43%; padding: 4px;">DESCRIÇÃO:</td>
          <td style="border: 1px solid #000; width: 20%; padding: 4px;">Nº Série:</td>
          <td style="border: 1px solid #000; width: 20%; padding: 4px;">Data de Fabricação:</td>
        </tr>
        <tr style="text-align: center;">
          <td style="border: 1px solid #000; padding: 4px;"></td>
          <td style="border: 1px solid #000; padding: 4px;" colspan="2">${diag.equipment || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${diag.serial_number || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${mfgDate}</td>
        </tr>
        ${defectRows}
        ${solutionRows}
        <tr style="font-weight: bold;">
          <td style="border: 1px solid #000; text-align: right; padding: 4px;" colspan="3">SUBTOTAL</td>
          <td style="border: 1px solid #000; padding: 4px; border-right: none;">R$</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: right; border-left: none;">${diagTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </table>
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

<table style="width: 100%; border: none; margin-bottom: 20px;">
  <tr>
    <td style="text-align: right; width: 60%;"></td>
    <td style="border: 2px solid #000; font-weight: bold; text-align: right; padding: 6px 10px; font-size: 14px;">
      VALOR TOTAL= R$ <span style="margin-left: 10px;">${(proposal.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </td>
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

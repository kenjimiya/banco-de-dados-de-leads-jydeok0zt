cronAdd('monthly_report', '0 0 1 * *', () => {
  var now = new Date()

  var prevMonth = now.getMonth() - 1
  var prevYear = now.getFullYear()
  if (prevMonth < 0) {
    prevMonth = 11
    prevYear = prevYear - 1
  }

  var pad = function (n) {
    return n < 10 ? '0' + n : String(n)
  }

  var startStr = prevYear + '-' + pad(prevMonth + 1) + '-01 00:00:00'
  var endStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-01 00:00:00'

  var monthNames = [
    'Janeiro',
    'Fevereiro',
    'Marco',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  var monthName = monthNames[prevMonth]

  var purchases = []
  try {
    purchases = $app.findRecordsByFilter(
      'purchases',
      'purchase_date >= "' + startStr + '" && purchase_date < "' + endStr + '"',
      '-purchase_date',
      500,
      0,
    )
  } catch (err) {
    $app.logger().error('monthly_report: failed to fetch purchases', 'error', err.message)
    return
  }

  var totalRevenue = 0
  var totalMargin = 0
  var itemCounts = {}
  var salesData = []

  for (var i = 0; i < purchases.length; i++) {
    var p = purchases[i]
    var grandTotal = p.getNumber('grand_total') || p.getNumber('total_price') || 0
    var totalCost = p.getNumber('total_cost') || 0
    totalRevenue += grandTotal
    totalMargin += grandTotal - totalCost

    var productName = p.getString('product_name')
    if (!itemCounts[productName]) {
      itemCounts[productName] = 0
    }
    itemCounts[productName]++

    var leadName = 'Desconhecido'
    try {
      var lead = $app.findRecordById('leads', p.getString('lead_id'))
      leadName = lead.getString('name')
    } catch (_) {}

    salesData.push({
      cliente: leadName,
      produto: productName,
      quantidade: p.getNumber('quantity'),
      total: grandTotal,
    })
  }

  var bestItem = 'Nenhum'
  var bestCount = 0
  for (var item in itemCounts) {
    if (itemCounts[item] > bestCount) {
      bestCount = itemCounts[item]
      bestItem = item
    }
  }

  var fmtBR = function (v) {
    var s = v.toFixed(2).replace('.', ',')
    var parts = s.split(',')
    var intPart = parts[0]
    var decPart = parts[1] || '00'
    var formatted = ''
    var count = 0
    for (var k = intPart.length - 1; k >= 0; k--) {
      if (count > 0 && count % 3 === 0) {
        formatted = '.' + formatted
      }
      formatted = intPart[k] + formatted
      count++
    }
    return 'R$ ' + formatted + ',' + decPart
  }

  var removeAccents = function (s) {
    return s
      .replace(/[\u00e1\u00e0\u00e2\u00e3\u00e4]/g, 'a')
      .replace(/[\u00e9\u00e8\u00ea\u00eb]/g, 'e')
      .replace(/[\u00ed\u00ec\u00ee\u00ef]/g, 'i')
      .replace(/[\u00f3\u00f2\u00f4\u00f5\u00f6]/g, 'o')
      .replace(/[\u00fa\u00f9\u00fb\u00fc]/g, 'u')
      .replace(/[\u00e7]/g, 'c')
      .replace(/[\u00c1\u00c0\u00c2\u00c3\u00c4]/g, 'A')
      .replace(/[\u00c9\u00c8\u00ca\u00cb]/g, 'E')
      .replace(/[\u00cd\u00cc\u00ce\u00cf]/g, 'I')
      .replace(/[\u00d3\u00d2\u00d4\u00d5\u00d6]/g, 'O')
      .replace(/[\u00da\u00d9\u00db\u00dc]/g, 'U')
      .replace(/[\u00c7]/g, 'C')
  }

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
  html += '<style>'
  html += 'body{font-family:Arial,sans-serif;color:#333;max-width:800px;margin:0 auto;padding:20px}'
  html +=
    'h1{color:#1a56db;font-size:24px;border-bottom:2px solid #1a56db;padding-bottom:10px;margin:0}'
  html += 'h2{color:#1a56db;font-size:16px;margin-top:24px}'
  html += 'table{width:100%;border-collapse:collapse;margin:10px 0}'
  html += 'th{background:#1a56db;color:#fff;padding:8px;text-align:left;font-size:12px}'
  html += 'td{padding:8px;border-bottom:1px solid #ddd;font-size:12px}'
  html += '.summary{background:#f0f4ff;padding:15px;border-radius:8px;margin:15px 0}'
  html += '.summary div{display:flex;justify-content:space-between;margin:5px 0}'
  html += '.summary .label{color:#666}.summary .value{font-weight:bold}'
  html += '.header-info{font-size:13px;color:#666;margin:8px 0 0 0}'
  html += '</style></head><body>'

  html += '<h1>Sigma Transformadores Ltda</h1>'
  html += '<p class="header-info"><strong>Email:</strong> sigma.producao@gmail.com<br>'
  html += '<strong>Contato:</strong> Mauro Miyawaki</p>'

  html += '<h2>Relatorio Mensal de Vendas &mdash; ' + monthName + ' ' + prevYear + '</h2>'

  html += '<div class="summary">'
  html +=
    '<div><span class="label">Faturamento Total:</span><span class="value">' +
    fmtBR(totalRevenue) +
    '</span></div>'
  html +=
    '<div><span class="label">Margem Total:</span><span class="value">' +
    fmtBR(totalMargin) +
    '</span></div>'
  html +=
    '<div><span class="label">Numero de Vendas:</span><span class="value">' +
    purchases.length +
    '</span></div>'
  html +=
    '<div><span class="label">Item Mais Vendido:</span><span class="value">' +
    bestItem +
    ' (' +
    bestCount +
    ' vendas)</span></div>'
  html += '</div>'

  html += '<h2>Detalhamento de Vendas</h2>'
  html +=
    '<table><thead><tr><th>Cliente</th><th>Produto</th><th>Qtd</th><th>Total</th></tr></thead><tbody>'
  for (var j = 0; j < salesData.length; j++) {
    html += '<tr><td>' + salesData[j].cliente + '</td>'
    html += '<td>' + salesData[j].produto + '</td>'
    html += '<td>' + salesData[j].quantidade + '</td>'
    html += '<td>' + fmtBR(salesData[j].total) + '</td></tr>'
  }
  if (salesData.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center">Nenhuma venda no periodo</td></tr>'
  }
  html += '</tbody></table>'

  html += '<p style="margin-top:20px;font-size:11px;color:#999;text-align:center">'
  html += 'Relatorio gerado automaticamente em ' + now.toLocaleDateString('pt-BR')
  html += '</p>'
  html += '</body></html>'

  var pdfLines = [
    'Sigma Transformadores Ltda',
    'Email: sigma.producao@gmail.com',
    'Contato: Mauro Miyawaki',
    '',
    'Relatorio Mensal de Vendas - ' + monthName + ' ' + prevYear,
    '',
    'RESUMO EXECUTIVO',
    'Faturamento Total: ' + fmtBR(totalRevenue),
    'Margem Total: ' + fmtBR(totalMargin),
    'Numero de Vendas: ' + purchases.length,
    'Item Mais Vendido: ' + bestItem + ' (' + bestCount + ' vendas)',
    '',
    'DETALHAMENTO DE VENDAS',
    '----------------------------------------',
  ]

  for (var m = 0; m < salesData.length; m++) {
    var line = salesData[m].cliente + ' | ' + salesData[m].produto
    line += ' | Qtd: ' + salesData[m].quantidade + ' | ' + fmtBR(salesData[m].total)
    if (line.length > 90) {
      line = line.substring(0, 90)
    }
    pdfLines.push(removeAccents(line))
  }

  if (salesData.length === 0) {
    pdfLines.push('Nenhuma venda no periodo')
  }

  pdfLines.push('')
  pdfLines.push('Relatorio gerado automaticamente em ' + now.toLocaleDateString('pt-BR'))

  var escapePdfText = function (s) {
    return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  }

  var content = 'BT\n/F1 9 Tf\n50 760 Td\n11 TL\n'
  for (var n = 0; n < pdfLines.length; n++) {
    if (n === 0) {
      content += '(' + escapePdfText(pdfLines[n]) + ') Tj\n'
    } else {
      content += 'T* (' + escapePdfText(pdfLines[n]) + ') Tj\n'
    }
  }
  content += 'ET'

  var pdf = '%PDF-1.4\n'
  var offsets = {}

  offsets[1] = pdf.length
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  offsets[2] = pdf.length
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  offsets[3] = pdf.length
  pdf +=
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n'
  offsets[4] = pdf.length
  pdf +=
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
  offsets[5] = pdf.length
  pdf +=
    '5 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\nendobj\n'

  var xrefPos = pdf.length
  pdf += 'xref\n0 6\n'
  pdf += '0000000000 65535 f \r\n'
  for (var nn = 1; nn <= 5; nn++) {
    var off = String(offsets[nn])
    while (off.length < 10) {
      off = '0' + off
    }
    pdf += off + ' 00000 n \r\n'
  }
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\n'
  pdf += 'startxref\n' + xrefPos + '\n%%EOF'

  var pdfBytes = []
  for (var c = 0; c < pdf.length; c++) {
    pdfBytes.push(pdf.charCodeAt(c) & 0xff)
  }

  var emailSent = false
  var attachmentAdded = false

  try {
    var message = new MailerMessage({
      from: { name: 'Sigma Transformadores', address: 'noreply@sigmatransformadores.com.br' },
      to: [{ address: 'sigma.producao@gmail.com' }],
      subject: 'Relatorio Mensal de Vendas - ' + monthName + ' ' + prevYear,
      html: html,
      attachments: [
        {
          filename: 'relatorio_mensal_' + prevYear + '_' + pad(prevMonth + 1) + '.pdf',
          content: pdfBytes,
        },
      ],
    })
    $app.newMailClient().send(message)
    emailSent = true
    attachmentAdded = true
  } catch (errWithAttachment) {
    try {
      var messageNoAttach = new MailerMessage({
        from: { name: 'Sigma Transformadores', address: 'noreply@sigmatransformadores.com.br' },
        to: [{ address: 'sigma.producao@gmail.com' }],
        subject: 'Relatorio Mensal de Vendas - ' + monthName + ' ' + prevYear,
        html: html,
      })
      $app.newMailClient().send(messageNoAttach)
      emailSent = true
    } catch (errNoAttach) {
      $app
        .logger()
        .error(
          'monthly_report: failed to send email',
          'error',
          errNoAttach.message,
          'purchases',
          purchases.length,
          'revenue',
          totalRevenue,
        )
    }
  }

  if (emailSent) {
    $app
      .logger()
      .info(
        'monthly_report: email sent successfully',
        'month',
        monthName + ' ' + prevYear,
        'purchases',
        purchases.length,
        'revenue',
        totalRevenue,
        'margin',
        totalMargin,
        'attachment',
        attachmentAdded,
      )
  }
})

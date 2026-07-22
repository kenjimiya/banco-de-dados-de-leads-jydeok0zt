routerAdd(
  'POST',
  '/backend/v1/send-pi-to-production',
  (e) => {
    var body = e.requestInfo().body || {}
    var piId = body.pi_id
    if (!piId) return e.badRequestError('pi_id is required')

    var pi
    try {
      pi = $app.findRecordById('internal_orders', piId)
    } catch (_) {
      return e.notFoundError('Internal order not found')
    }

    var operationType = pi.getString('operation_type')
    var isConserto = operationType === 'conserto'
    var piNumber = pi.getString('pi_number') || 'Sem numero'
    var dateStr = new Date(pi.getString('created')).toLocaleDateString('pt-BR')

    var leadName = pi.getString('cliente_nome') || '---'
    var leadCnpj = pi.getString('cliente_cnpj') || '---'
    var leadIe = pi.getString('cliente_ie') || '---'
    var leadAddress = pi.getString('cliente_endereco') || '---'
    var leadCep = pi.getString('cliente_cep') || '---'
    var leadEmail = pi.getString('cliente_email') || '---'
    var leadPhone = pi.getString('cliente_telefone') || '---'
    var leadContact = pi.getString('cliente_contato') || '---'

    var leadId = pi.getString('lead_id')
    if (leadId) {
      try {
        var lead = $app.findRecordById('leads', leadId)
        if (leadName === '---') leadName = lead.getString('name') || leadName
        if (leadCnpj === '---') leadCnpj = lead.getString('cnpj') || leadCnpj
        if (leadIe === '---') leadIe = lead.getString('ie') || leadIe
        if (leadAddress === '---') leadAddress = lead.getString('address') || leadAddress
        if (leadCep === '---') leadCep = lead.getString('cep') || leadCep
        if (leadEmail === '---') leadEmail = lead.getString('email') || leadEmail
        if (leadPhone === '---') leadPhone = lead.getString('phone') || leadPhone
        if (leadContact === '---') leadContact = lead.getString('contact_name') || leadContact
      } catch (_) {}
    }

    var rawItems = pi.get('items')
    var itemsArray = []
    if (Array.isArray(rawItems)) {
      itemsArray = rawItems
    } else if (typeof rawItems === 'string' && rawItems.trim()) {
      try {
        var parsed = JSON.parse(rawItems)
        if (Array.isArray(parsed)) itemsArray = parsed
      } catch (_) {}
    }

    var fmtBR = function (v) {
      var n = Number(v) || 0
      var s = n.toFixed(2).replace('.', ',')
      var parts = s.split(',')
      var intPart = parts[0]
      var decPart = parts[1] || '00'
      var formatted = ''
      var count = 0
      for (var k = intPart.length - 1; k >= 0; k--) {
        if (count > 0 && count % 3 === 0) formatted = '.' + formatted
        formatted = intPart[k] + formatted
        count++
      }
      return 'R$ ' + formatted + ',' + decPart
    }

    var fmtDate = function (d) {
      if (!d) return '-'
      try {
        return new Date(d).toLocaleDateString('pt-BR')
      } catch (_) {
        return '-'
      }
    }

    var itemsHtml = ''
    var subtotal = 0
    for (var i = 0; i < itemsArray.length; i++) {
      var item = itemsArray[i]
      var desc = item.description || ''
      var qty = item.quantity || 1
      var price = item.unit_price || 0
      var sub = item.subtotal || qty * price
      subtotal += sub
      itemsHtml +=
        '<tr><td style="border:1px solid #ddd;padding:6px;text-align:center">' +
        (i + 1) +
        '</td><td style="border:1px solid #ddd;padding:6px;text-align:center">' +
        qty +
        '</td><td style="border:1px solid #ddd;padding:6px">' +
        desc +
        '</td><td style="border:1px solid #ddd;padding:6px;text-align:right">' +
        fmtBR(price) +
        '</td><td style="border:1px solid #ddd;padding:6px;text-align:right">' +
        fmtBR(sub) +
        '</td></tr>'
    }
    if (itemsArray.length === 0) {
      itemsHtml =
        '<tr><td colspan="5" style="border:1px solid #ddd;padding:10px;text-align:center">Nenhum item</td></tr>'
    }

    var discount = pi.getNumber('discount_amount') || 0
    var shippingCost = pi.getNumber('shipping_cost') || 0
    var shippingType = pi.getString('shipping_type') || 'N/A'
    var totalValue = pi.getNumber('total_value') || 0
    var paymentCondition = pi.getString('payment_condition') || '-'
    var deliveryDate = pi.getString('delivery_date')
    var carrierName = pi.getString('carrier_name') || '-'
    var volumesQty = pi.getNumber('volumes_quantity') || 1
    var netWeight = pi.getNumber('net_weight') || 0
    var grossWeight = pi.getNumber('gross_weight') || 0
    var packagingType = pi.getString('packaging_type') === 'madeira' ? 'Madeira' : 'Papelao'
    var notes = pi.getString('notes') || ''

    var consertoNf = pi.getString('conserto_invoice_number') || '-'
    var consertoDate = pi.getString('conserto_invoice_date')

    var accent = isConserto ? '#ea580c' : '#2563eb'
    var accentBg = isConserto ? '#fff7ed' : '#eff6ff'
    var titleLabel = isConserto ? 'MODELO PI - CONSERTO' : 'MODELO PI - EQUIPAMENTO NOVO'
    var opLabel = isConserto ? 'RETORNO DE CONSERTO' : 'EQUIPAMENTO NOVO'

    var html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;color:#333;max-width:800px;margin:0 auto;">'
    html +=
      '<div style="background:' +
      accent +
      ';color:#fff;padding:15px 20px;border-radius:8px 8px 0 0;">'
    html += '<div style="font-size:20px;font-weight:bold;">Sigma Transformadores Ltda</div>'
    html += '<div style="font-size:14px;margin-top:5px;">' + titleLabel + '</div></div>'
    html +=
      '<div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">'

    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:13px;">'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;width:200px;background:' +
      accentBg +
      '">N. DO PI:</td><td style="border:1px solid #ddd;padding:6px 12px;color:' +
      accent +
      ';font-weight:bold;">' +
      piNumber +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;background:' +
      accentBg +
      '">TIPO DE OPERACAO:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      opLabel +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;background:' +
      accentBg +
      '">DATA:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      dateStr +
      '</td></tr>'
    html += '</table>'

    html +=
      '<div style="background:' +
      accentBg +
      ';padding:8px 12px;font-weight:bold;color:' +
      accent +
      ';font-size:13px;border:1px solid #ddd;border-bottom:none;">DADOS DO CLIENTE</div>'
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:13px;">'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;width:200px;">RAZAO SOCIAL:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      leadName +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">CNPJ:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      leadCnpj +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">INSCR. EST.:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      leadIe +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">ENDERECO:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      leadAddress +
      ' - CEP: ' +
      leadCep +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">CONTATO:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      leadContact +
      ' - ' +
      leadPhone +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">EMAIL:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      leadEmail +
      '</td></tr>'
    html += '</table>'

    if (isConserto) {
      html +=
        '<div style="background:' +
        accentBg +
        ';padding:8px 12px;font-weight:bold;color:' +
        accent +
        ';font-size:13px;border:1px solid #ddd;border-bottom:none;">DADOS DA REMESSA (CONSERTO)</div>'
      html +=
        '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:13px;">'
      html +=
        '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;width:200px;">NF DE REMESSA:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
        consertoNf +
        '</td></tr>'
      html +=
        '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">DATA DA NF:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
        fmtDate(consertoDate) +
        '</td></tr>'
      html += '</table>'
    }

    html +=
      '<div style="background:' +
      accentBg +
      ';padding:8px 12px;font-weight:bold;color:' +
      accent +
      ';font-size:13px;border:1px solid #ddd;border-bottom:none;">ITENS DO PEDIDO</div>'
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:12px;">'
    html +=
      '<thead><tr style="background:' +
      accentBg +
      ';"><th style="border:1px solid #ddd;padding:6px;width:40px;">#</th><th style="border:1px solid #ddd;padding:6px;width:60px;">Qtd</th><th style="border:1px solid #ddd;padding:6px;text-align:left;">Descricao</th><th style="border:1px solid #ddd;padding:6px;text-align:right;width:120px;">Valor Unit.</th><th style="border:1px solid #ddd;padding:6px;text-align:right;width:120px;">Subtotal</th></tr></thead>'
    html += '<tbody>' + itemsHtml + '</tbody>'
    html += '<tfoot>'
    html +=
      '<tr><td colspan="4" style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:bold;">SOMA DOS ITENS:</td><td style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:bold;">' +
      fmtBR(subtotal) +
      '</td></tr>'
    html +=
      '<tr><td colspan="4" style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:bold;color:#ef4444;">DESCONTO:</td><td style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:bold;color:#ef4444;">- ' +
      fmtBR(discount) +
      '</td></tr>'
    html +=
      '<tr><td colspan="4" style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:bold;color:#16a34a;">FRETE (' +
      shippingType +
      '):</td><td style="border:1px solid #ddd;padding:6px;text-align:right;font-weight:bold;color:#16a34a;">+ ' +
      fmtBR(shippingCost) +
      '</td></tr>'
    html +=
      '<tr style="background:' +
      accentBg +
      ';"><td colspan="4" style="border:1px solid #ddd;padding:8px;text-align:right;font-size:14px;font-weight:bold;">VALOR TOTAL:</td><td style="border:1px solid #ddd;padding:8px;text-align:right;font-size:14px;font-weight:bold;color:' +
      accent +
      ';">' +
      fmtBR(totalValue) +
      '</td></tr>'
    html += '</tfoot></table>'

    html +=
      '<div style="background:' +
      accentBg +
      ';padding:8px 12px;font-weight:bold;color:' +
      accent +
      ';font-size:13px;border:1px solid #ddd;border-bottom:none;">LOGISTICA E FINANCEIRO</div>'
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:13px;">'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;width:200px;">CONDICAO DE PAG.:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      paymentCondition +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">DATA DE ENTREGA:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      fmtDate(deliveryDate) +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">TRANSPORTADORA:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      carrierName +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">VOLUMES / EMBALAGEM:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      volumesQty +
      ' / ' +
      packagingType +
      '</td></tr>'
    html +=
      '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">PESO LIQ. / BRUTO:</td><td style="border:1px solid #ddd;padding:6px 12px">' +
      netWeight +
      ' kg / ' +
      grossWeight +
      ' kg</td></tr>'
    if (notes) {
      html +=
        '<tr><td style="border:1px solid #ddd;padding:6px 12px;font-weight:bold;">OBSERVACOES:</td><td style="border:1px solid #ddd;padding:6px 12px;white-space:pre-wrap">' +
        notes +
        '</td></tr>'
    }
    html += '</table>'

    html +=
      '<div style="margin-top:20px;padding-top:15px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">Sigma Transformadores Ltda - Pedido Interno Gerado Eletronicamente</div>'
    html += '</div></body></html>'

    var productionRecipients = [
      { name: 'Ivanildo', address: 'ivanildo@sigmatransformadores.com.br' },
      { name: 'Rosmar', address: 'rosmar@sigmatransformadores.com.br' },
    ]
    var financeAddress = 'sigma.producao@gmail.com'
    var subject = 'PI ' + piNumber + ' - ' + opLabel + ' - ' + leadName
    var sendResults = { production: [], finance: null, errors: [] }

    for (var p = 0; p < productionRecipients.length; p++) {
      try {
        var prodMsg = new MailerMessage({
          from: { name: 'Sigma Transformadores', address: 'noreply@sigmatransformadores.com.br' },
          to: [{ name: productionRecipients[p].name, address: productionRecipients[p].address }],
          subject: '[PRODUCAO] ' + subject,
          html: html,
        })
        $app.newMailClient().send(prodMsg)
        sendResults.production.push({ name: productionRecipients[p].name, sent: true })
      } catch (err) {
        sendResults.production.push({
          name: productionRecipients[p].name,
          sent: false,
          error: err.message,
        })
        sendResults.errors.push('Producao (' + productionRecipients[p].name + '): ' + err.message)
      }
    }

    try {
      var finMsg = new MailerMessage({
        from: { name: 'Sigma Transformadores', address: 'noreply@sigmatransformadores.com.br' },
        to: [{ address: financeAddress }],
        subject: '[FINANCEIRO] ' + subject,
        html: html,
      })
      $app.newMailClient().send(finMsg)
      sendResults.finance = { sent: true }
    } catch (err) {
      sendResults.finance = { sent: false, error: err.message }
      sendResults.errors.push('Financeiro: ' + err.message)
    }

    $app
      .logger()
      .info(
        'PI sent to production and finance',
        'piId',
        piId,
        'piNumber',
        piNumber,
        'operation',
        opLabel,
        'productionResults',
        sendResults.production.length,
        'financeSent',
        sendResults.finance.sent,
      )

    return e.json(200, {
      success: true,
      pi_number: piNumber,
      operation_type: operationType,
      template: titleLabel,
      recipients: {
        production: productionRecipients.map(function (r) {
          return r.name
        }),
        finance: financeAddress,
      },
      results: sendResults,
    })
  },
  $apis.requireAuth(),
)

onRecordAfterUpdateSuccess((e) => {
  var oldStatus = e.record.original().getString('status')
  var newStatus = e.record.getString('status')

  if (oldStatus === 'aceito' || newStatus !== 'aceito') return e.next()

  var proposalNumber = e.record.getString('proposal_number') || ''
  var sourceRef = 'PAT:' + (proposalNumber || e.record.id)
  try {
    $app.findFirstRecordByData('internal_orders', 'source_reference', sourceRef)
    return e.next()
  } catch (_) {}

  var leadId = e.record.getString('lead_id')
  if (!leadId) return e.next()

  var lead
  try {
    lead = $app.findRecordById('leads', leadId)
  } catch (_) {
    return e.next()
  }

  var now = new Date()
  var yearStr = '' + now.getFullYear()
  var currentYear = yearStr.slice(-2)

  var existingPIs = []
  try {
    existingPIs = $app.findRecordsByFilter(
      'internal_orders',
      "pi_number != ''",
      '-pi_number',
      1000,
      0,
    )
  } catch (_) {}

  var nextNum = 1
  for (var i = 0; i < existingPIs.length; i++) {
    var piNum = existingPIs[i].getString('pi_number')
    var slashIdx = piNum.lastIndexOf('/')
    if (slashIdx < 0) continue
    var yearPart = piNum.substring(slashIdx + 1).trim()
    if (yearPart !== currentYear) continue
    var numPart = piNum.substring(0, slashIdx).replace(/[^0-9]/g, '')
    var num = parseInt(numPart, 10)
    if (!isNaN(num) && num >= nextNum) {
      nextNum = num + 1
    }
  }

  var numStr = '' + nextNum
  while (numStr.length < 3) numStr = '0' + numStr
  var piNumber = 'PI ' + numStr + '/' + currentYear

  var rawItems = e.record.get('items')
  var itemsArray = []
  if (Array.isArray(rawItems)) {
    itemsArray = rawItems
  } else if (typeof rawItems === 'string' && rawItems.trim()) {
    try {
      var parsed = JSON.parse(rawItems)
      if (Array.isArray(parsed)) itemsArray = parsed
    } catch (_) {}
  }

  var rawPiItems = []
  for (var j = 0; j < itemsArray.length; j++) {
    var diag = itemsArray[j]
    var parts = diag.parts || []
    if (!Array.isArray(parts)) parts = []

    for (var k = 0; k < parts.length; k++) {
      var part = parts[k]
      var desc = part.description || ''
      if (!desc || !String(desc).trim()) continue
      var qty = part.quantity || 1
      var price = part.unit_price || 0
      var subtotal = part.total_price || qty * price
      rawPiItems.push({
        description: String(desc).trim(),
        quantity: qty,
        unit_price: price,
        ncm: '',
        subtotal: subtotal,
      })
    }

    if (parts.length === 0) {
      var fallbackDesc = diag.equipment || ''
      if (diag.serial_number) fallbackDesc += ' [Serie: ' + diag.serial_number + ']'
      if (!fallbackDesc || !String(fallbackDesc).trim()) continue
      rawPiItems.push({
        description: String(fallbackDesc).trim(),
        quantity: 1,
        unit_price: 0,
        ncm: '',
        subtotal: 0,
      })
    }
  }

  var aggregatedMap = {}
  var piItems = []
  for (var n = 0; n < rawPiItems.length; n++) {
    var rawItem = rawPiItems[n]
    var key = rawItem.description.toLowerCase()
    if (aggregatedMap.hasOwnProperty(key)) {
      var existingIdx = aggregatedMap[key]
      piItems[existingIdx].quantity = (piItems[existingIdx].quantity || 0) + (rawItem.quantity || 0)
      piItems[existingIdx].subtotal =
        piItems[existingIdx].quantity * piItems[existingIdx].unit_price
    } else {
      aggregatedMap[key] = piItems.length
      piItems.push({
        description: rawItem.description,
        quantity: rawItem.quantity,
        unit_price: rawItem.unit_price,
        ncm: '',
        subtotal: rawItem.quantity * rawItem.unit_price,
      })
    }
  }

  var patTotal = e.record.get('total_price') || 0
  var itemsSum = 0
  for (var m = 0; m < piItems.length; m++) {
    itemsSum += piItems[m].subtotal || 0
  }
  var totalValue = patTotal > 0 ? patTotal : itemsSum

  var invoiceNumber = e.record.getString('invoice_number') || ''
  var patDate = e.record.getString('date') || ''

  var col = $app.findCollectionByNameOrId('internal_orders')
  var pi = new Record(col)
  pi.set('lead_id', leadId)
  pi.set('operation_type', 'conserto')
  pi.set('items', piItems)
  pi.set('payment_condition', e.record.getString('payment_condition') || '')
  pi.set('total_value', totalValue)
  pi.set('pi_number', piNumber)
  pi.set('source_reference', sourceRef)
  pi.set('conserto_invoice_number', invoiceNumber)
  if (patDate) {
    pi.set('conserto_invoice_date', patDate)
  }
  pi.set('discount_amount', 0)
  pi.set('shipping_cost', 0)
  pi.set('volumes_quantity', 1)
  pi.set('packaging_type', 'papelao')
  pi.set('notes', '')
  pi.set('cliente_nome', lead.getString('name') || '')
  pi.set('cliente_endereco', lead.getString('address') || '')
  pi.set('cliente_cep', lead.getString('cep') || '')
  pi.set('cliente_cnpj', lead.getString('cnpj') || '')
  pi.set('cliente_ie', lead.getString('ie') || '')
  pi.set('cliente_email', lead.getString('email') || '')
  pi.set('cliente_telefone', lead.getString('phone') || '')
  pi.set('cliente_contato', lead.getString('contact_name') || '')

  try {
    $app.save(pi)
  } catch (err) {
    $app
      .logger()
      .error(
        'Failed to auto-create PI from PAT',
        'technicalProposalId',
        e.record.id,
        'error',
        err.message,
      )
  }

  return e.next()
}, 'technical_proposals')

onRecordAfterUpdateSuccess((e) => {
  var oldStatus = e.record.original().getString('status')
  var newStatus = e.record.getString('status')

  if (oldStatus === 'aceito' || newStatus !== 'aceito') return e.next()

  var sourceRef = 'PAT:' + e.record.id
  try {
    $app.findFirstRecordByData('internal_orders', 'source_reference', sourceRef)
    return e.next()
  } catch (_) {}

  var leadId = e.record.getString('lead_id')
  if (!leadId) return e.next()

  try {
    $app.findRecordById('leads', leadId)
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

  var piItems = []
  var totalValue = 0

  for (var j = 0; j < itemsArray.length; j++) {
    var item = itemsArray[j]
    var diagnostics = item.diagnostics || []
    var hasReplaceItems = false

    for (var k = 0; k < diagnostics.length; k++) {
      var diag = diagnostics[k]
      var replaceItem = diag.replace_item || ''
      if (!replaceItem || !String(replaceItem).trim()) continue
      hasReplaceItems = true
      var replaceQty = diag.replace_quantity || 1
      var replacePrice = diag.replace_unit_price || diag.price || 0
      var diagSubtotal = replaceQty * replacePrice
      piItems.push({
        description: replaceItem,
        quantity: replaceQty,
        unit_price: replacePrice,
        ncm: '',
        subtotal: diagSubtotal,
      })
      totalValue += diagSubtotal
    }

    if (!hasReplaceItems) {
      var desc = item.description || ''
      if (item.serial_number) desc += ' [Serie: ' + item.serial_number + ']'
      if (!desc || !String(desc).trim()) continue
      var fallbackQty = item.quantity || 1
      var fallbackPrice = item.unit_price || 0
      var fallbackSubtotal = item.total_price || fallbackQty * fallbackPrice
      piItems.push({
        description: desc,
        quantity: fallbackQty,
        unit_price: fallbackPrice,
        ncm: '',
        subtotal: fallbackSubtotal,
      })
      totalValue += fallbackSubtotal
    }
  }

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

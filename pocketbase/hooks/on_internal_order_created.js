onRecordAfterCreateSuccess((e) => {
  var piNumber = e.record.getString('pi_number') || ''
  var leadId = e.record.getString('lead_id')
  if (!leadId) return e.next()

  // Idempotency: skip if a purchase already exists for this PI number
  if (piNumber) {
    try {
      $app.findFirstRecordByData('purchases', 'pi_number', piNumber)
      return e.next()
    } catch (_) {}
  }

  var totalValue = e.record.getNumber('total_value') || 0
  var operationType = e.record.getString('operation_type') || 'novo'
  var dateStr = new Date().toISOString()

  var productLabel = 'Pedido Interno - PI ' + (piNumber || e.record.id)

  var col = $app.findCollectionByNameOrId('purchases')
  var purchase = new Record(col)
  purchase.set('lead_id', leadId)
  purchase.set('product_name', productLabel)
  purchase.set('quantity', 1)
  purchase.set('unit_price', totalValue)
  purchase.set('total_price', totalValue)
  purchase.set('purchase_date', dateStr)
  purchase.set('sale_type', operationType)
  purchase.set('pi_number', piNumber)

  try {
    $app.save(purchase)
    $app
      .logger()
      .info(
        'Auto-created purchase from PI',
        'piId',
        e.record.id,
        'piNumber',
        piNumber,
        'purchaseId',
        purchase.id,
      )
  } catch (err) {
    $app
      .logger()
      .error('Failed to auto-create purchase from PI', 'piId', e.record.id, 'error', err.message)
  }

  return e.next()
}, 'internal_orders')

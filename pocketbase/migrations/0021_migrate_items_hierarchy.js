migrate(
  (app) => {
    var orders = app.findRecordsByFilter('internal_orders', "id != ''", '-created', 10000, 0)
    for (var i = 0; i < orders.length; i++) {
      var order = orders[i]
      var rawItems = order.get('items')
      if (!rawItems) continue
      var items = rawItems
      if (typeof rawItems === 'string') {
        try {
          items = JSON.parse(rawItems)
        } catch (e) {
          continue
        }
      }
      if (!Array.isArray(items) || items.length === 0) continue
      if (items[0] && items[0].replacementItems !== undefined) continue
      var newItems = [
        {
          serialNumber: '',
          equipmentDate: '',
          deliveryDate: '',
          fileUrl: '',
          replacementItems: items.map(function (item) {
            return {
              description: item.description || '',
              quantity: item.quantity || 1,
              unitPrice: item.unit_price || 0,
              total: item.subtotal || 0,
            }
          }),
        },
      ]
      order.set('items', newItems)
      app.save(order)
    }
  },
  (app) => {},
)

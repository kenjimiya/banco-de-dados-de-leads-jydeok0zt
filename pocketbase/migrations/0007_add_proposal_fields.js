migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('proposals')

    if (!col.fields.getByName('items')) {
      col.fields.add(new JSONField({ name: 'items' }))
    }
    if (!col.fields.getByName('payment_condition')) {
      col.fields.add(new TextField({ name: 'payment_condition' }))
    }
    if (!col.fields.getByName('delivery_time')) {
      col.fields.add(new TextField({ name: 'delivery_time' }))
    }
    if (!col.fields.getByName('composition')) {
      col.fields.add(new TextField({ name: 'composition' }))
    }
    if (!col.fields.getByName('freight_info')) {
      col.fields.add(new TextField({ name: 'freight_info' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('proposals')
    app.save(col)
  },
)

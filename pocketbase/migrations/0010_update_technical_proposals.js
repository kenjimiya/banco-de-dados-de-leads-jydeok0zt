migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('technical_proposals')

    if (!col.fields.getByName('revision')) {
      col.fields.add(new TextField({ name: 'revision' }))
    }
    if (!col.fields.getByName('items')) {
      col.fields.add(new JSONField({ name: 'items' }))
    }
    if (!col.fields.getByName('payment_condition')) {
      col.fields.add(new TextField({ name: 'payment_condition' }))
    }
    if (!col.fields.getByName('delivery_time')) {
      col.fields.add(new TextField({ name: 'delivery_time' }))
    }
    if (!col.fields.getByName('validity')) {
      col.fields.add(new TextField({ name: 'validity' }))
    }
    if (!col.fields.getByName('guarantee')) {
      col.fields.add(new TextField({ name: 'guarantee' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('technical_proposals')
    app.save(col)
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')
    if (!col.fields.getByName('production_notes')) {
      col.fields.add(new TextField({ name: 'production_notes' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')
    app.save(col)
  },
)

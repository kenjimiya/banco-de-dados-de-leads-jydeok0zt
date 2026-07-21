migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')

    if (!col.fields.getByName('notes')) {
      col.fields.add(new TextField({ name: 'notes' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')
    app.save(col)
  },
)

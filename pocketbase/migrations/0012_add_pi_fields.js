migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')

    if (!col.fields.getByName('pi_number')) {
      col.fields.add(new TextField({ name: 'pi_number' }))
    }
    if (!col.fields.getByName('billing_date')) {
      col.fields.add(new DateField({ name: 'billing_date' }))
    }
    if (!col.fields.getByName('source_reference')) {
      col.fields.add(new TextField({ name: 'source_reference' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')
    app.save(col)
  },
)

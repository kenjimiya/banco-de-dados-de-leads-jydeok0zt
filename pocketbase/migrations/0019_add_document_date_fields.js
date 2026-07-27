migrate(
  (app) => {
    const proposals = app.findCollectionByNameOrId('proposals')
    if (!proposals.fields.getByName('document_date')) {
      proposals.fields.add(new DateField({ name: 'document_date' }))
    }
    app.save(proposals)

    const internalOrders = app.findCollectionByNameOrId('internal_orders')
    if (!internalOrders.fields.getByName('document_date')) {
      internalOrders.fields.add(new DateField({ name: 'document_date' }))
    }
    app.save(internalOrders)
  },
  (app) => {
    const proposals = app.findCollectionByNameOrId('proposals')
    app.save(proposals)

    const internalOrders = app.findCollectionByNameOrId('internal_orders')
    app.save(internalOrders)
  },
)

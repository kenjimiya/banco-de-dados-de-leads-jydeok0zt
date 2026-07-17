migrate(
  (app) => {
    const leadsId = app.findCollectionByNameOrId('leads').id
    const purchases = new Collection({
      name: 'purchases',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'lead_id',
          type: 'relation',
          required: true,
          collectionId: leadsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'product_name', type: 'text', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'unit_price', type: 'number', required: true },
        { name: 'total_price', type: 'number', required: true },
        { name: 'purchase_date', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_purchases_lead_id ON purchases (lead_id)'],
    })
    app.save(purchases)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('purchases')
    app.delete(collection)
  },
)

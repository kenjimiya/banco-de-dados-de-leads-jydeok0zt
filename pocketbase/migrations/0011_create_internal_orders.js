migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    const newFields = [
      { name: 'cnpj', type: 'text' },
      { name: 'ie', type: 'text' },
      { name: 'address', type: 'text' },
      { name: 'cep', type: 'text' },
      { name: 'city', type: 'text' },
      { name: 'neighborhood', type: 'text' },
      { name: 'contact_name', type: 'text' },
    ]
    for (const f of newFields) {
      if (!leads.fields.getByName(f.name)) {
        leads.fields.add(new TextField({ name: f.name }))
      }
    }
    app.save(leads)

    const internalOrders = new Collection({
      name: 'internal_orders',
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
          collectionId: leads.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'operation_type',
          type: 'select',
          values: ['novo', 'conserto'],
          maxSelect: 1,
          required: true,
        },
        { name: 'conserto_invoice_number', type: 'text' },
        { name: 'conserto_invoice_date', type: 'date' },
        { name: 'items', type: 'json' },
        { name: 'discount_amount', type: 'number' },
        { name: 'shipping_cost', type: 'number' },
        { name: 'shipping_type', type: 'text' },
        { name: 'total_value', type: 'number' },
        { name: 'payment_condition', type: 'text' },
        { name: 'delivery_date', type: 'date' },
        { name: 'carrier_name', type: 'text' },
        { name: 'volumes_quantity', type: 'number' },
        { name: 'net_weight', type: 'number' },
        { name: 'gross_weight', type: 'number' },
        { name: 'packaging_type', type: 'select', values: ['papelao', 'madeira'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_internal_orders_lead_id ON internal_orders (lead_id)'],
    })
    app.save(internalOrders)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('internal_orders')
      app.delete(col)
    } catch (_) {}
  },
)

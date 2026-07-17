migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    if (!leads.fields.getByName('uf')) {
      leads.fields.add(new TextField({ name: 'uf' }))
    }
    if (!leads.fields.getByName('activity')) {
      leads.fields.add(new TextField({ name: 'activity' }))
    }
    leads.addIndex('idx_leads_uf', false, 'uf', '')
    leads.addIndex('idx_leads_activity', false, 'activity', '')
    app.save(leads)

    const purchases = app.findCollectionByNameOrId('purchases')
    const newFields = [
      { name: 'sale_type', type: 'text' },
      { name: 'invoice_number', type: 'text' },
      { name: 'pi_number', type: 'text' },
      { name: 'raw_material_cost', type: 'number' },
      { name: 'total_cost', type: 'number' },
      { name: 'shipping_cost', type: 'number' },
      { name: 'grand_total', type: 'number' },
      { name: 'payment_term', type: 'number' },
    ]
    for (const f of newFields) {
      if (!purchases.fields.getByName(f.name)) {
        if (f.type === 'text') {
          purchases.fields.add(new TextField({ name: f.name }))
        } else {
          purchases.fields.add(new NumberField({ name: f.name }))
        }
      }
    }
    app.save(purchases)
  },
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    leads.removeIndex('idx_leads_uf')
    leads.removeIndex('idx_leads_activity')
    app.save(leads)
  },
)

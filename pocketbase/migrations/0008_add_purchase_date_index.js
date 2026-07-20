migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('purchases')
    col.addIndex('idx_purchases_purchase_date', false, 'purchase_date', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('purchases')
    col.removeIndex('idx_purchases_purchase_date')
    app.save(col)
  },
)

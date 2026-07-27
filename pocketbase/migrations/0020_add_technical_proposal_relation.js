migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')
    var tpId = app.findCollectionByNameOrId('technical_proposals').id

    if (!col.fields.getByName('technical_proposal_ids')) {
      col.fields.add(
        new RelationField({
          name: 'technical_proposal_ids',
          collectionId: tpId,
          maxSelect: 20,
        }),
      )
    }

    col.addIndex('idx_internal_orders_pcs_id', false, 'pcs_id', '')
    col.addIndex('idx_internal_orders_tp_ids', false, 'technical_proposal_ids', '')

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE internal_orders SET technical_proposal_ids = '[]' WHERE technical_proposal_ids IS NULL",
      )
      .execute()
  },
  (app) => {
    var col = app.findCollectionByNameOrId('internal_orders')
    col.removeIndex('idx_internal_orders_pcs_id')
    col.removeIndex('idx_internal_orders_tp_ids')
    var field = col.fields.getByName('technical_proposal_ids')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)

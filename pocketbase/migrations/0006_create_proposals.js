migrate(
  (app) => {
    const leadsId = app.findCollectionByNameOrId('leads').id
    const proposals = new Collection({
      name: 'proposals',
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
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['rascunho', 'enviado', 'aceito', 'recusado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'total_value', type: 'number' },
        { name: 'expiry_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_proposals_lead_id ON proposals (lead_id)'],
    })
    app.save(proposals)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('proposals')
    app.delete(collection)
  },
)

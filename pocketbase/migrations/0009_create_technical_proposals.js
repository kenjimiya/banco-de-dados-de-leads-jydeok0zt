migrate(
  (app) => {
    const leadsId = app.findCollectionByNameOrId('leads').id

    const collection = new Collection({
      name: 'technical_proposals',
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
        { name: 'proposal_number', type: 'text' },
        { name: 'invoice_number', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'defect', type: 'text' },
        { name: 'solution', type: 'text' },
        { name: 'total_price', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['rascunho', 'enviado', 'aceito', 'recusado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_technical_proposals_lead_id ON technical_proposals (lead_id)'],
    })
    app.save(collection)

    var tpCol = app.findCollectionByNameOrId('technical_proposals')
    var samplePATs = [
      {
        leadEmail: 'ana.oliveira@example.com',
        proposal_number: 'PAT-001',
        invoice_number: 'NF-12345',
        date: '2026-07-10 10:00:00.000Z',
        defect: 'Transformador apresentando superaquecimento em operacao nominal',
        solution: 'Troca do enrolamento primario e revisao do sistema de refrigeracao',
        total_price: 850.0,
        status: 'enviado',
      },
      {
        leadEmail: 'bruno.santos@example.com',
        proposal_number: 'PAT-002',
        invoice_number: 'NF-12346',
        date: '2026-07-15 14:00:00.000Z',
        defect: 'Falha no sistema de isolamento dipeletrico',
        solution: 'Substituicao da isolacao e teste de rigidez dieletrica',
        total_price: 1200.0,
        status: 'aceito',
      },
    ]

    for (var i = 0; i < samplePATs.length; i++) {
      var pat = samplePATs[i]
      try {
        var lead = app.findFirstRecordByData('leads', 'email', pat.leadEmail)
        var record = new Record(tpCol)
        record.set('lead_id', lead.id)
        record.set('proposal_number', pat.proposal_number)
        record.set('invoice_number', pat.invoice_number)
        record.set('date', pat.date)
        record.set('defect', pat.defect)
        record.set('solution', pat.solution)
        record.set('total_price', pat.total_price)
        record.set('status', pat.status)
        app.save(record)
      } catch (_) {}
    }
  },
  (app) => {
    var collection = app.findCollectionByNameOrId('technical_proposals')
    app.delete(collection)
  },
)

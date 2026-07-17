migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminId = ''

    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'sigma.producao@gmail.com')
      adminId = admin.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('sigma.producao@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin Sigma')
      app.save(record)
      adminId = record.id
    }

    const leadsCol = app.findCollectionByNameOrId('leads')
    const purchasesCol = app.findCollectionByNameOrId('purchases')

    const sampleLeads = [
      {
        email: 'ana.oliveira@example.com',
        name: 'Ana Oliveira',
        status: 'quente',
        total_spent: 1500.0,
        last_purchase_date: '2023-10-15 10:00:00.000Z',
      },
      {
        email: 'bruno.santos@example.com',
        name: 'Bruno Santos',
        status: 'cliente',
        total_spent: 450.0,
        last_purchase_date: '2023-11-02 14:30:00.000Z',
      },
      {
        email: 'carla.lima@example.com',
        name: 'Carla Lima',
        status: 'novo',
        total_spent: 0,
        last_purchase_date: '',
      },
    ]

    for (const lData of sampleLeads) {
      let leadRecord
      try {
        leadRecord = app.findFirstRecordByData('leads', 'email', lData.email)
      } catch (_) {
        leadRecord = new Record(leadsCol)
        leadRecord.set('name', lData.name)
        leadRecord.set('email', lData.email)
        leadRecord.set('status', lData.status)
        leadRecord.set('total_spent', lData.total_spent)
        if (lData.last_purchase_date) leadRecord.set('last_purchase_date', lData.last_purchase_date)
        app.save(leadRecord)

        if (lData.name === 'Ana Oliveira') {
          const p = new Record(purchasesCol)
          p.set('lead_id', leadRecord.id)
          p.set('product_name', 'Kit Escritório')
          p.set('quantity', 1)
          p.set('unit_price', 1500.0)
          p.set('total_price', 1500.0)
          p.set('purchase_date', '2023-10-15 10:00:00.000Z')
          app.save(p)
        }

        if (lData.name === 'Bruno Santos') {
          const p = new Record(purchasesCol)
          p.set('lead_id', leadRecord.id)
          p.set('product_name', 'Mouse Sem Fio')
          p.set('quantity', 2)
          p.set('unit_price', 225.0)
          p.set('total_price', 450.0)
          p.set('purchase_date', '2023-11-02 14:30:00.000Z')
          app.save(p)
        }
      }
    }
  },
  (app) => {
    // Simple down migration skips deletions to avoid accidental data loss in seed
  },
)

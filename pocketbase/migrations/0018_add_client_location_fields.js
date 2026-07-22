migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')

    if (!col.fields.getByName('cliente_cidade')) {
      col.fields.add(new TextField({ name: 'cliente_cidade' }))
    }
    if (!col.fields.getByName('cliente_uf')) {
      col.fields.add(new TextField({ name: 'cliente_uf' }))
    }
    if (!col.fields.getByName('cliente_bairro')) {
      col.fields.add(new TextField({ name: 'cliente_bairro' }))
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('internal_orders')
    app.save(col)
  },
)

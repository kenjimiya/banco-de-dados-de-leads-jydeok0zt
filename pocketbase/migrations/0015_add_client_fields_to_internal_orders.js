migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('internal_orders')

    var clientFields = [
      { name: 'cliente_nome', type: 'text' },
      { name: 'cliente_endereco', type: 'text' },
      { name: 'cliente_cep', type: 'text' },
      { name: 'cliente_cnpj', type: 'text' },
      { name: 'cliente_ie', type: 'text' },
      { name: 'cliente_email', type: 'email' },
      { name: 'cliente_telefone', type: 'text' },
      { name: 'cliente_contato', type: 'text' },
    ]

    for (var i = 0; i < clientFields.length; i++) {
      var f = clientFields[i]
      if (!col.fields.getByName(f.name)) {
        if (f.type === 'email') {
          col.fields.add(new EmailField({ name: f.name }))
        } else {
          col.fields.add(new TextField({ name: f.name }))
        }
      }
    }

    if (!col.fields.getByName('pcs_id')) {
      var proposalsId = app.findCollectionByNameOrId('proposals').id
      col.fields.add(
        new RelationField({
          name: 'pcs_id',
          collectionId: proposalsId,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('internal_orders')
    app.save(col)
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('proposals')

    if (!col.fields.getByName('revision')) {
      col.fields.add(new TextField({ name: 'revision' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('proposals')
    app.save(col)
  },
)

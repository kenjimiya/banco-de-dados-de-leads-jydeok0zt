onRecordAfterCreateSuccess((e) => {
  const text = (e.record.getString('name') + '\n\n' + e.record.getString('notes')).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('leads', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    console.log('embedding failed for lead ' + e.record.id, err.message)
  }
  return e.next()
}, 'leads')

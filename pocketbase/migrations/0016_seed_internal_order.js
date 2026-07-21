migrate(
  (app) => {
    var leadId = ''

    try {
      var existingLead = app.findFirstRecordByData('leads', 'name', 'Cliente Exemplo Sigma')
      leadId = existingLead.id
    } catch (_) {
      var leadsCol = app.findCollectionByNameOrId('leads')
      var newLead = new Record(leadsCol)
      newLead.set('name', 'Cliente Exemplo Sigma')
      newLead.set('email', 'cliente.exemplo@sigmatransformadores.com.br')
      newLead.set('phone', '(11) 3456-7890')
      newLead.set('status', 'cliente')
      newLead.set('cnpj', '12.345.678/0001-90')
      newLead.set('ie', '123.456.789.012')
      newLead.set('address', 'Av. Industrial, 1000')
      newLead.set('cep', '09000-000')
      newLead.set('city', 'São Paulo')
      newLead.set('uf', 'SP')
      newLead.set('contact_name', 'João Exemplo')
      app.save(newLead)
      leadId = newLead.id
    }

    try {
      app.findFirstRecordByData('internal_orders', 'pi_number', 'PI 001/26')
      return
    } catch (_) {}

    var col = app.findCollectionByNameOrId('internal_orders')
    var pi = new Record(col)
    pi.set('lead_id', leadId)
    pi.set('operation_type', 'novo')
    pi.set('items', [
      {
        description: 'Transformador 112.5kVA',
        quantity: 1,
        unit_price: 15000.0,
        ncm: '8504.33.00',
        subtotal: 15000.0,
      },
    ])
    pi.set('total_value', 15000.0)
    pi.set('pi_number', 'PI 001/26')
    pi.set('payment_condition', '30 DDL')
    pi.set('discount_amount', 0)
    pi.set('shipping_cost', 0)
    pi.set('volumes_quantity', 1)
    pi.set('packaging_type', 'papelao')
    pi.set('cliente_nome', 'Cliente Exemplo Sigma')
    pi.set('cliente_endereco', 'Av. Industrial, 1000')
    pi.set('cliente_cep', '09000-000')
    pi.set('cliente_cnpj', '12.345.678/0001-90')
    pi.set('cliente_ie', '123.456.789.012')
    pi.set('cliente_email', 'cliente.exemplo@sigmatransformadores.com.br')
    pi.set('cliente_telefone', '(11) 3456-7890')
    pi.set('cliente_contato', 'João Exemplo')
    pi.set('source_reference', 'Manual')
    pi.set('notes', 'Pedido interno de exemplo - Transformador 112.5kVA')
    app.save(pi)
  },
  (app) => {
    try {
      var pi = app.findFirstRecordByData('internal_orders', 'pi_number', 'PI 001/26')
      app.delete(pi)
    } catch (_) {}
  },
)

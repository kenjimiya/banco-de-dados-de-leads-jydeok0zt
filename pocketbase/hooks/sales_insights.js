routerAdd(
  'POST',
  '/backend/v1/sales-insights',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')

    var purchases = []
    var leads = []

    try {
      purchases = $app.findRecordsByFilter('purchases', "id != ''", '-purchase_date', 100, 0)
    } catch (_) {}

    try {
      leads = $app.findRecordsByFilter('leads', "id != ''", '-created', 100, 0)
    } catch (_) {}

    var purchaseData = []
    for (var i = 0; i < purchases.length; i++) {
      var p = purchases[i]
      var leadName = 'Desconhecido'
      var leadUF = ''
      var leadActivity = ''
      try {
        var lead = $app.findRecordById('leads', p.getString('lead_id'))
        leadName = lead.getString('name')
        leadUF = lead.getString('uf')
        leadActivity = lead.getString('activity')
      } catch (_) {}
      purchaseData.push({
        produto: p.getString('product_name'),
        quantidade: p.getNumber('quantity'),
        preco_unitario: p.getNumber('unit_price'),
        total: p.getNumber('total_price'),
        total_com_frete: p.getNumber('grand_total'),
        custo_total: p.getNumber('total_cost'),
        frete: p.getNumber('shipping_cost'),
        tipo: p.getString('sale_type'),
        data: p.getString('purchase_date'),
        cliente: leadName,
        uf: leadUF,
        atividade: leadActivity,
      })
    }

    var leadData = []
    for (var j = 0; j < leads.length; j++) {
      var l = leads[j]
      leadData.push({
        nome: l.getString('name'),
        status: l.getString('status'),
        uf: l.getString('uf'),
        atividade: l.getString('activity'),
        total_gasto: l.getNumber('total_spent'),
        ultima_compra: l.getString('last_purchase_date'),
      })
    }

    if (purchaseData.length === 0) {
      return e.json(200, {
        insights:
          '• Nenhuma venda registrada ainda. Registre sua primeira venda para receber insights personalizados.\n• Comece cadastrando leads e registrando vendas manualmente ou via importação de Excel.\n• Os insights serão gerados automaticamente com base no histórico de vendas.',
      })
    }

    var summary = JSON.stringify({ vendas: purchaseData, leads: leadData })

    try {
      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um analista de negocios especializado em vendas B2B. Analise os dados fornecidos e gere exatamente 3-4 insights valiosos em portugues. Foque em: retencao de clientes, regioes mais lucrativas, tendencias de vendas, ticket medio por regiao, e oportunidades de crescimento. Seja especifico com numeros e nomes quando possivel. Responda apenas com os insights, um por linha, prefixados com o simbolo •.',
          },
          {
            role: 'user',
            content:
              'Analise estes dados de vendas e leads e forneça 3-4 insights estrategicos:\n\n' +
              summary,
          },
        ],
      })
      return e.json(200, { insights: reply.choices[0].message.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'AI temporariamente indisponivel' })
      }
      if (err instanceof SkipAiError) {
        return e.json(502, { error: 'AI temporariamente indisponivel' })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

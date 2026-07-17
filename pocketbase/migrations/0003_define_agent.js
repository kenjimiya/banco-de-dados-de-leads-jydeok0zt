/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'lead-analyst',
      name: 'Analista de Leads',
      description: 'Analisa padrões de compra e sugere próximas ações.',
      systemPrompt:
        'Você é um consultor de negócios que analisa dados de clientes. Fale em Português (PT-BR). Seja profissional e acolhedor. Responda perguntas sobre os leads, analise seu histórico de compras para identificar padrões, e sugira o próximo produto a oferecer. Use o contexto fornecido pelas ferramentas.',
      tier: 'fast',
      tools: [
        { collection: 'leads', perms: { list: true, read: true } },
        { collection: 'purchases', perms: { list: true, read: true } },
      ],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'lead-analyst')
  },
)

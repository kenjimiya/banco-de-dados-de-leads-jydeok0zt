import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface Lead extends RecordModel {
  name: string
  email: string
  phone: string
  status: 'novo' | 'morno' | 'quente' | 'cliente'
  notes: string
  last_purchase_date: string
  total_spent: number
  uf: string
  activity: string
}

export interface Purchase extends RecordModel {
  lead_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  purchase_date: string
  sale_type: string
  invoice_number: string
  pi_number: string
  raw_material_cost: number
  total_cost: number
  shipping_cost: number
  grand_total: number
  payment_term: number
  expand?: {
    lead_id: Lead
  }
}

export interface ProposalItem {
  quantity: number
  description: string
  unit_price: number
  total_price: number
}

export interface Proposal extends RecordModel {
  lead_id: string
  title: string
  description: string
  status: 'rascunho' | 'enviado' | 'aceito' | 'recusado'
  total_value: number
  expiry_date: string
  items: ProposalItem[]
  payment_condition: string
  delivery_time: string
  composition: string
  freight_info: string
  expand?: {
    lead_id: Lead
  }
}

export const getLeads = () => pb.collection<Lead>('leads').getFullList({ sort: '-created' })
export const getLead = (id: string) => pb.collection<Lead>('leads').getOne(id)
export const createLead = (data: Partial<Lead>) => pb.collection<Lead>('leads').create(data)
export const updateLead = (id: string, data: Partial<Lead>) =>
  pb.collection('leads').update(id, data)

export const getPurchases = () =>
  pb.collection<Purchase>('purchases').getFullList({ sort: '-purchase_date', expand: 'lead_id' })
export const getLeadPurchases = (leadId: string) =>
  pb
    .collection<Purchase>('purchases')
    .getFullList({ filter: `lead_id = "${leadId}"`, sort: '-purchase_date' })

export const getLeadProposals = (leadId: string) =>
  pb
    .collection<Proposal>('proposals')
    .getFullList({ filter: `lead_id = "${leadId}"`, sort: '-created' })

export const getLeadTechnicalProposals = (leadId: string) =>
  pb
    .collection<TechnicalProposal>('technical_proposals')
    .getFullList({ filter: `lead_id = "${leadId}"`, sort: '-created' })

export const createPurchase = async (data: Partial<Purchase>) => {
  const purchase = await pb.collection('purchases').create(data)
  if (data.lead_id) {
    const lead = await getLead(data.lead_id)
    const amount = data.grand_total || data.total_price || 0
    await updateLead(data.lead_id, {
      total_spent: (lead.total_spent || 0) + amount,
      last_purchase_date: data.purchase_date,
      status: 'cliente',
    })
  }
  return purchase
}

export const getSalesInsights = async () => {
  return pb.send('/backend/v1/sales-insights', { method: 'POST' }) as Promise<{
    insights: string
  }>
}

export const askAnalyst = async (message: string, conversationId: string | null = null) => {
  return pb.send('/backend/v1/ask-analyst', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
  })
}

export const updatePurchase = async (id: string, data: Partial<Purchase>) => {
  const purchase = await pb.collection<Purchase>('purchases').update(id, data)
  if (purchase.lead_id) {
    await recalculateLeadTotals(purchase.lead_id)
  }
  return purchase
}

export const deletePurchase = async (id: string, leadId: string) => {
  await pb.collection('purchases').delete(id)
  await recalculateLeadTotals(leadId)
}

export const deleteLead = async (id: string) => {
  await pb.collection('leads').delete(id)
}

async function recalculateLeadTotals(leadId: string) {
  try {
    const purchases = await pb
      .collection<Purchase>('purchases')
      .getFullList({ filter: `lead_id = "${leadId}"`, sort: '-purchase_date' })
    const totalSpent = purchases.reduce((sum, p) => sum + (p.grand_total || p.total_price || 0), 0)
    const lastPurchaseDate = purchases.length > 0 ? purchases[0].purchase_date : ''
    await updateLead(leadId, {
      total_spent: totalSpent,
      last_purchase_date: lastPurchaseDate,
      status: purchases.length > 0 ? 'cliente' : 'novo',
    })
  } catch {
    // Lead may have been cascade-deleted — safe to ignore
  }
}

export const getProposals = () =>
  pb.collection<Proposal>('proposals').getFullList({ sort: '-created', expand: 'lead_id' })

export const createProposal = (data: Partial<Proposal>) =>
  pb.collection<Proposal>('proposals').create(data)

export const updateProposal = (id: string, data: Partial<Proposal>) =>
  pb.collection<Proposal>('proposals').update(id, data)

export const deleteProposal = (id: string) => pb.collection('proposals').delete(id)

export interface TechnicalProposalItem {
  description: string
  serial_number: string
  manufacture_date: string
  defect: string
  solution: string
  unit_price: number
  quantity: number
  total_price: number
}

export interface TechnicalProposal extends RecordModel {
  lead_id: string
  proposal_number: string
  revision: string
  invoice_number: string
  date: string
  defect: string
  solution: string
  total_price: number
  status: 'rascunho' | 'enviado' | 'aceito' | 'recusado'
  items: TechnicalProposalItem[]
  payment_condition: string
  delivery_time: string
  validity: string
  guarantee: string
  expand?: {
    lead_id: Lead
  }
}

export const getTechnicalProposals = () =>
  pb
    .collection<TechnicalProposal>('technical_proposals')
    .getFullList({ sort: '-created', expand: 'lead_id' })

export const createTechnicalProposal = (data: Partial<TechnicalProposal>) =>
  pb.collection<TechnicalProposal>('technical_proposals').create(data)

export const updateTechnicalProposal = (id: string, data: Partial<TechnicalProposal>) =>
  pb.collection<TechnicalProposal>('technical_proposals').update(id, data)

export const deleteTechnicalProposal = (id: string) =>
  pb.collection('technical_proposals').delete(id)

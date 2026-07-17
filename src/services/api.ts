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

export const getLeads = () => pb.collection<Lead>('leads').getFullList({ sort: '-created' })
export const getLead = (id: string) => pb.collection<Lead>('leads').getOne(id)
export const createLead = (data: Partial<Lead>) => pb.collection('leads').create(data)
export const updateLead = (id: string, data: Partial<Lead>) =>
  pb.collection('leads').update(id, data)

export const getPurchases = () =>
  pb.collection<Purchase>('purchases').getFullList({ sort: '-purchase_date', expand: 'lead_id' })
export const getLeadPurchases = (leadId: string) =>
  pb
    .collection<Purchase>('purchases')
    .getFullList({ filter: `lead_id = "${leadId}"`, sort: '-purchase_date' })

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

export const askAnalyst = async (message: string, conversationId: string | null = null) => {
  return pb.send('/backend/v1/ask-analyst', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
  })
}

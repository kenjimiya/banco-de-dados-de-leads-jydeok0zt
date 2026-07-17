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
}

export interface Purchase extends RecordModel {
  lead_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  purchase_date: string
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
  // Optional: Background hooks or frontend could update total_spent on Lead,
  // but let's do a simple frontend increment for now to keep it consistent.
  if (data.lead_id && data.total_price) {
    const lead = await getLead(data.lead_id)
    await updateLead(data.lead_id, {
      total_spent: lead.total_spent + data.total_price,
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

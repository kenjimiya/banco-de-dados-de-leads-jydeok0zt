import { FileText, MapPin, Phone, Mail, User } from 'lucide-react'
import { type Lead } from '@/services/api'

export function LeadInfoCard({ lead }: { lead: Lead | null }) {
  if (!lead) return null

  const addressParts = [lead.address, lead.neighborhood, lead.city, lead.uf, lead.cep].filter(
    Boolean,
  )

  return (
    <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-secondary/10 text-sm animate-fade-in">
      {lead.cnpj && (
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">CNPJ:</span>
          <span className="font-medium">{lead.cnpj}</span>
        </div>
      )}
      {lead.ie && (
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">I.E.:</span>
          <span className="font-medium">{lead.ie}</span>
        </div>
      )}
      {lead.contact_name && (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Contato:</span>
          <span className="font-medium">{lead.contact_name}</span>
        </div>
      )}
      {lead.phone && (
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Telefone:</span>
          <span className="font-medium">{lead.phone}</span>
        </div>
      )}
      {lead.email && (
        <div className="flex items-center gap-2 col-span-2">
          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Email:</span>
          <span className="font-medium truncate">{lead.email}</span>
        </div>
      )}
      {addressParts.length > 0 && (
        <div className="flex items-center gap-2 col-span-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{addressParts.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

import { MapPin, Phone, Mail, User, FileText, Home, Building2 } from 'lucide-react'
import { type Lead } from '@/services/api'

export function LeadInfoCard({ lead }: { lead: Lead | null }) {
  if (!lead) return null

  const fields = [
    { icon: User, label: 'Nome', value: lead.name },
    { icon: Home, label: 'Endereço', value: lead.address },
    { icon: MapPin, label: 'CEP', value: lead.cep },
    {
      icon: Building2,
      label: 'Cidade/UF',
      value: [lead.city, lead.uf].filter(Boolean).join('/'),
    },
    { icon: Home, label: 'Bairro', value: lead.neighborhood },
    { icon: Phone, label: 'Telefone', value: lead.phone },
    { icon: FileText, label: 'CNPJ', value: lead.cnpj },
    { icon: FileText, label: 'I.E.', value: lead.ie },
    { icon: Mail, label: 'Email', value: lead.email },
    { icon: User, label: 'Contato', value: lead.contact_name },
  ].filter((f) => f.value)

  return (
    <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-secondary/10 text-sm animate-fade-in">
      {fields.map((f, i) => {
        const Icon = f.icon
        return (
          <div
            key={i}
            className={`flex items-center gap-2 ${
              f.label === 'Endereço' || f.label === 'Email' ? 'col-span-2' : ''
            }`}
          >
            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">{f.label}:</span>
            <span className="font-medium truncate">{f.value}</span>
          </div>
        )
      })}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { getLeads, type Lead } from '@/services/api'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickCreateLeadDialog } from './quick-create-lead-dialog'

interface LeadSelectProps {
  value: Lead | null
  onChange: (lead: Lead | null) => void
}

export function LeadSelect({ value, onChange }: LeadSelectProps) {
  const [open, setOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    getLeads()
      .then(setLeads)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {value ? `${value.name}${value.uf ? ` (${value.uf})` : ''}` : 'Selecione um cliente...'}
            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {leads.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    onSelect={() => {
                      onChange(lead)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 w-4 h-4',
                        value?.id === lead.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {lead.name}
                    {lead.uf ? ` (${lead.uf})` : ''}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <QuickCreateLeadDialog
        onCreated={(lead) => {
          setLeads((prev) => [...prev, lead])
          onChange(lead)
        }}
        trigger={
          <Button type="button" variant="link" size="sm" className="p-0 h-auto">
            + Cadastrar novo cliente
          </Button>
        }
      />
    </div>
  )
}

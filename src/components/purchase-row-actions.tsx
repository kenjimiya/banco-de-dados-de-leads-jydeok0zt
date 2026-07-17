import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, UserX } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { EditPurchaseDialog } from './edit-purchase-dialog'
import { deletePurchase, deleteLead, type Purchase } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

export function PurchaseRowActions({ purchase }: { purchase: Purchase }) {
  const { toast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [delPurchaseOpen, setDelPurchaseOpen] = useState(false)
  const [delClientOpen, setDelClientOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const leadId = purchase.lead_id
  const leadName = purchase.expand?.lead_id?.name || 'este cliente'

  const handleDeletePurchase = async (e: React.MouseEvent) => {
    e.preventDefault()
    setDeleting(true)
    try {
      await deletePurchase(purchase.id, leadId)
      toast({ title: 'Venda excluída com sucesso!' })
      setDelPurchaseOpen(false)
    } catch {
      toast({ title: 'Erro ao excluir venda', variant: 'destructive' })
    }
    setDeleting(false)
  }

  const handleDeleteClient = async (e: React.MouseEvent) => {
    e.preventDefault()
    setDeleting(true)
    try {
      await deleteLead(leadId)
      toast({ title: 'Cliente excluído com sucesso!' })
      setDelClientOpen(false)
    } catch {
      toast({ title: 'Erro ao excluir cliente', variant: 'destructive' })
    }
    setDeleting(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDelPurchaseOpen(true)} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Excluir Venda
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDelClientOpen(true)} className="text-destructive">
            <UserX className="w-4 h-4 mr-2" /> Excluir Cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPurchaseDialog purchase={purchase} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={delPurchaseOpen} onOpenChange={setDelPurchaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação é permanente e não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={delClientOpen} onOpenChange={setDelClientOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o cliente &quot;{leadName}&quot; e todo o seu
              histórico de compras. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir Cliente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

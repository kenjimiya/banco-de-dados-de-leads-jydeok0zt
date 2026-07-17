import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Home, Users, ShoppingCart, Sparkles, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NavItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return <Outlet />

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border p-4">
      <div className="flex items-center gap-2 px-2 mb-8 mt-2">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg hidden md:block">Lead Insights</span>
      </div>
      <nav className="flex-1 space-y-2">
        {NavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="md:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-fade-in">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-semibold hidden sm:block text-foreground">
              Bem-vindo(a), {user.name?.split(' ')[0] || 'Usuário'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem className="py-2 cursor-pointer" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 animate-slide-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

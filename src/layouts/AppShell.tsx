import { Outlet, Link, Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { AuthPage } from '@/features/auth/AuthPage'
import { NoveHesloModal } from '@/features/auth/NoveHesloModal'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { cekaPoptavkaZWebu } from '@/features/requests/nova/koncept'

export function AppShell() {
  const { user, nacitani, role } = useAuth()
  const { pathname } = useLocation()

  if (nacitani)
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-label="Načítám">
        <LoaderCircle className="size-8 animate-spin text-accent" />
      </div>
    )

  if (!user)
    return (
      <>
        <AuthPage />
        <NoveHesloModal />
      </>
    )

  // Poptávka rozepsaná na remexo.cz: zákazník jde rovnou ji dokončit
  if (role === 'customer' && pathname !== '/nova' && cekaPoptavkaZWebu()) return <Navigate to="/nova" replace />

  // Zadávání poptávky je soustředěné, bez navigace okolo
  if (pathname.startsWith('/nova')) return <><Outlet /><NoveHesloModal /></>

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link to="/" aria-label="Remexo, přehled"><img src="/logo.png" alt="Remexo" className="h-[22px]" /></Link>
        </header>
        <Outlet />
      </div>
      <BottomNav />
      <NoveHesloModal />
    </div>
  )
}

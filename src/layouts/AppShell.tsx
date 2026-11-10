import { Outlet, Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { AuthPage } from '@/features/auth/AuthPage'
import { NoveHesloModal } from '@/features/auth/NoveHesloModal'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell() {
  const { user, nacitani } = useAuth()

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

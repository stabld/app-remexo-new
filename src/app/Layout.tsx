import { Outlet } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { AuthPage } from '@/features/auth/AuthPage'
import { NoveHesloModal } from '@/features/auth/NoveHesloModal'
import { ROLE_LABEL } from '@/lib/types'

export function Layout() {
  const { user, role, jmeno, nacitani, odhlasit } = useAuth()

  if (nacitani)
    return (
      <div className="grid min-h-dvh place-items-center">
        <LoaderCircle className="size-8 animate-spin text-remexo-500" />
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
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <img src="/logo.png" alt="Remexo" className="h-8" />
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{jmeno}</span>
          <span className="rounded-full bg-remexo-100 px-2 py-0.5 text-xs font-bold text-remexo-600">{ROLE_LABEL[role]}</span>
          <button onClick={odhlasit} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Odhlásit</button>
        </div>
      </header>
      <main className="flex-1 p-4"><Outlet /></main>
      <NoveHesloModal />
    </div>
  )
}

import { useState } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { ExternalLink, LoaderCircle, LogOut, Moon, Plus, Sun } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { AuthPage } from '@/features/auth/AuthPage'
import { NoveHesloModal } from '@/features/auth/NoveHesloModal'
import { useMojePoptavky } from '@/features/poptavky/api'
import { ROLE_LABEL } from '@/lib/types'
import { NAVIGACE, nadpisStranky, type PolozkaNavigace } from './navigace'

function useTema() {
  const [tmave, setTmave] = useState(() => document.documentElement.classList.contains('dark'))
  const prepnout = () => {
    const nove = !tmave
    document.documentElement.classList.toggle('dark', nove)
    try { localStorage.setItem('color-theme', nove ? 'dark' : 'light') } catch { /* nic */ }
    setTmave(nove)
  }
  return { tmave, prepnout }
}

function useBubliny() {
  const { role } = useAuth()
  const { data } = useMojePoptavky()
  const nabidky = role === 'customer' ? (data ?? []).reduce((s, p) => s + p.cekajiciNabidky, 0) : 0
  return { nabidky }
}

function Bublina({ pocet }: { pocet: number }) {
  if (!pocet) return null
  return <span className="grid h-5 min-w-5 place-items-center rounded-full bg-remexo-500 px-1.5 text-[11px] font-semibold text-white">{pocet}</span>
}

export function Layout() {
  const { user, nacitani } = useAuth()

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

  return <Aplikace />
}

function Aplikace() {
  const { role, jmeno, user, odhlasit } = useAuth()
  const { pathname } = useLocation()
  const { tmave, prepnout } = useTema()
  const bubliny = useBubliny()
  const polozky = NAVIGACE[role]
  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const nadpis = nadpisStranky(pathname, role)

  const pocetPro = (p: PolozkaNavigace) => (p.bublina === 'nabidky' ? bubliny.nabidky : 0)

  return (
    <div className="flex min-h-dvh">
      {/* Boční panel – desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-stone-200 px-3 py-5 lg:flex dark:border-stone-800">
        <Link to="/" className="mb-6 px-3">
          <img src="/logo.png" alt="Remexo" className="h-7" />
        </Link>

        {role === 'customer' && (
          <Link to="/nova" className="mx-3 mb-5 flex items-center justify-center gap-1.5 rounded-lg bg-remexo-500 py-2.5 text-sm font-semibold text-white hover:bg-remexo-600">
            <Plus className="size-4" /> Nová poptávka
          </Link>
        )}

        <nav className="space-y-0.5">
          {polozky.map((p) => (
            <NavLink
              key={p.cesta}
              to={p.cesta}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-stone-100 font-semibold text-stone-900 dark:bg-stone-800 dark:text-white'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white'
                }`
              }
            >
              <p.ikona className="size-[18px]" /> {p.nazev}
              <span className="ml-auto"><Bublina pocet={pocetPro(p)} /></span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-1">
          <Link to="/profil" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-900">
            <Avatar url={avatar} jmeno={jmeno} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{jmeno}</p>
              <p className="text-xs text-stone-500">{ROLE_LABEL[role]}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1 px-1.5 pt-2">
            <IkonaTlacitko onClick={prepnout} title={tmave ? 'Světlý vzhled' : 'Tmavý vzhled'}>
              {tmave ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </IkonaTlacitko>
            <a href="https://remexo.cz" title="Web remexo.cz" className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
              <ExternalLink className="size-[18px]" />
            </a>
            <IkonaTlacitko onClick={odhlasit} title="Odhlásit se" className="ml-auto">
              <LogOut className="size-[18px]" />
            </IkonaTlacitko>
          </div>
          <p className="px-3 pt-1 text-xs text-stone-400">
            <a href="/soukromi.html" target="_blank" className="hover:text-stone-600">Soukromí</a>
            <span className="mx-2">/</span>
            <a href="/smazani-dat.html" target="_blank" className="hover:text-stone-600">Smazání dat</a>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Horní lišta – mobil */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-stone-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden dark:border-stone-800 dark:bg-stone-950/90">
          <img src="/logo.png" alt="Remexo" className="h-6" />
          <IkonaTlacitko onClick={prepnout} title={tmave ? 'Světlý vzhled' : 'Tmavý vzhled'} className="ml-auto">
            {tmave ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </IkonaTlacitko>
          {role === 'customer' && (
            <Link to="/nova" className="flex items-center gap-1 rounded-lg bg-remexo-500 px-3 py-1.5 text-sm font-semibold text-white">
              <Plus className="size-4" /> Poptávka
            </Link>
          )}
        </header>

        <main className="w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-12 lg:pb-12 lg:pt-10">
          {nadpis && <h1 className="mb-6 text-2xl font-semibold tracking-tight">{nadpis}</h1>}
          <Outlet />
        </main>
      </div>

      {/* Spodní lišta – mobil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-stone-800 dark:bg-stone-950">
        {polozky.map((p) => (
          <NavLink
            key={p.cesta}
            to={p.cesta}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] ${isActive ? 'font-semibold text-stone-900 dark:text-white' : 'text-stone-500'}`
            }
          >
            <p.ikona className="size-5" />
            {p.nazev}
            <span className="absolute left-1/2 top-1 ml-2"><Bublina pocet={pocetPro(p)} /></span>
          </NavLink>
        ))}
      </nav>
      <NoveHesloModal />
    </div>
  )
}

function IkonaTlacitko({ className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...rest} className={`grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 ${className}`} />
}

function Avatar({ url, jmeno }: { url?: string; jmeno: string }) {
  const [chyba, setChyba] = useState(false)
  if (url && !chyba) return <img src={url} alt="" onError={() => setChyba(true)} className="size-8 rounded-full object-cover" />
  return <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">{jmeno.charAt(0).toUpperCase()}</span>
}

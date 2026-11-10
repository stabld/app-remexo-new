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
  return <span className="grid min-w-5 place-items-center rounded-full bg-remexo-500 px-1.5 text-[10px] font-bold text-white">{pocet}</span>
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

  const pocetPro = (p: PolozkaNavigace) => (p.bublina === 'nabidky' ? bubliny.nabidky : 0)

  return (
    <div className="flex min-h-dvh">
      {/* Boční panel – desktop */}
      <aside className="sticky top-0 hidden h-dvh w-68 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-5 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Link to="/" className="mb-8 flex items-center gap-2 px-2">
            <img src="/logo.png" alt="Remexo" className="h-8" />
          </Link>
          {role === 'customer' && (
            <Link to="/nova" className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-remexo-500 py-3 text-sm font-bold text-white shadow-sm hover:bg-remexo-600">
              <Plus className="size-4" /> Nová poptávka
            </Link>
          )}
          <nav className="space-y-1">
            {polozky.map((p) => (
              <NavLink
                key={p.cesta}
                to={p.cesta}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    isActive ? 'bg-remexo-50 text-remexo-600 dark:bg-remexo-500/10' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`
                }
              >
                <p.ikona className="size-5" /> {p.nazev}
                <span className="ml-auto"><Bublina pocet={pocetPro(p)} /></span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="space-y-3">
          <Link to="/profil" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Avatar url={avatar} jmeno={jmeno} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{jmeno}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[role]}</p>
            </div>
          </Link>
          <button onClick={odhlasit} className="flex w-full items-center gap-2 px-2 text-sm font-semibold text-slate-500 hover:text-red-500">
            <LogOut className="size-4" /> Odhlásit se
          </button>
          <p className="px-2 text-xs text-slate-400">
            <a href="/soukromi.html" target="_blank" className="hover:underline">Soukromí</a> · <a href="/smazani-dat.html" target="_blank" className="hover:underline">Smazání dat</a>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur lg:px-8 dark:border-slate-800 dark:bg-slate-950/90">
          <img src="/logo.png" alt="Remexo" className="h-7 lg:hidden" />
          <h1 className="hidden text-xl font-extrabold lg:block">{nadpisStranky(pathname, role)}</h1>
          <div className="ml-auto flex items-center gap-1">
            <a href="https://remexo.cz" title="Zpět na web" className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">
              <ExternalLink className="size-5" />
            </a>
            <button onClick={prepnout} title="Přepnout vzhled" className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">
              {tmave ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            {role === 'customer' && (
              <Link to="/nova" className="ml-1 flex items-center gap-1.5 rounded-xl bg-remexo-500 px-3 py-2 text-sm font-bold text-white lg:hidden">
                <Plus className="size-4" /> Poptávka
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10">
          <h1 className="mb-4 text-2xl font-extrabold lg:hidden">{nadpisStranky(pathname, role)}</h1>
          <Outlet />
        </main>
      </div>

      {/* Spodní lišta – mobil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-slate-800 dark:bg-slate-900">
        {polozky.map((p) => (
          <NavLink
            key={p.cesta}
            to={p.cesta}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${isActive ? 'text-remexo-500' : 'text-slate-400'}`
            }
          >
            <p.ikona className="size-5" />
            {p.nazev}
            <span className="absolute right-[calc(50%-20px)] top-1"><Bublina pocet={pocetPro(p)} /></span>
          </NavLink>
        ))}
      </nav>
      <NoveHesloModal />
    </div>
  )
}

function Avatar({ url, jmeno }: { url?: string; jmeno: string }) {
  const [chyba, setChyba] = useState(false)
  if (url && !chyba) return <img src={url} alt="" onError={() => setChyba(true)} className="size-10 rounded-full object-cover" />
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-remexo-500 font-bold text-white">{jmeno.charAt(0).toUpperCase()}</span>
}

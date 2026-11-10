import { Link, NavLink } from 'react-router-dom'
import { LogOut, Plus, Settings } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_LABEL } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { tridyTlacitka } from '@/components/ui/Button'
import { NAVIGACE } from '@/app/navigace'
import { useBubliny } from './useBubliny'

const POLOZKA = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors'
const AKTIVNI = 'bg-accent-soft font-semibold text-ink [&>svg]:text-accent-text'
const NEAKTIVNI = 'font-medium text-soft hover:bg-surface-2 hover:text-ink'

export function Sidebar() {
  const { role, jmeno, user, odhlasit } = useAuth()
  const bubliny = useBubliny()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 border-r border-line bg-surface px-3.5 py-5 lg:flex">
      <Link to="/" className="mx-2.5 mt-1 self-start" aria-label="Remexo, přehled">
        <img src="/logo.png" alt="Remexo" className="h-6" />
      </Link>

      {role === 'customer' && (
        <Link to="/nova" className={tridyTlacitka('primary', 'md', 'w-full py-2.5')}>
          <Plus className="size-[18px]" strokeWidth={2.2} /> Vytvořit poptávku
        </Link>
      )}

      <nav aria-label="Hlavní navigace" className="flex flex-col gap-0.5">
        {NAVIGACE[role].map((p) => {
          const pocet = p.bublina ? bubliny[p.bublina] : 0
          return (
            <NavLink key={p.cesta} to={p.cesta} end={p.cesta === '/'} className={({ isActive }) => `${POLOZKA} ${isActive ? AKTIVNI : NEAKTIVNI}`}>
              <p.ikona className="size-[18px]" />
              {p.nazev}
              {pocet > 0 && (
                <span className="ml-auto rounded-full bg-accent px-[7px] text-xs font-semibold leading-5 text-on-accent" aria-label={`${pocet} nových`}>
                  {pocet}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3.5">
        <NavLink to="/nastaveni" className={({ isActive }) => `${POLOZKA} ${isActive ? AKTIVNI : NEAKTIVNI}`}>
          <Settings className="size-[18px]" /> Nastavení
        </NavLink>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <Avatar jmeno={jmeno} url={user?.user_metadata?.avatar_url} velikost={32} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{jmeno}</span>
            <span className="text-xs text-muted">{ROLE_LABEL[role]}</span>
          </span>
          <button onClick={odhlasit} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Odhlásit se" title="Odhlásit se">
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  )
}

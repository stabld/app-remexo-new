import { Link, NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { MOBILNI } from '@/app/navigace'
import { useBubliny } from './useBubliny'

export function BottomNav() {
  const { role } = useAuth()
  const bubliny = useBubliny()

  return (
    <nav aria-label="Hlavní navigace" className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-line bg-surface px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 lg:hidden">
      {MOBILNI[role].map((p) =>
        p === 'nova' ? (
          <Link key="nova" to="/nova" aria-label="Vytvořit poptávku" className="grid flex-1 place-items-center">
            <span className="grid size-12 place-items-center rounded-[14px] bg-accent text-on-accent">
              <Plus className="size-[22px]" strokeWidth={2.4} />
            </span>
          </Link>
        ) : (
          <NavLink
            key={p.cesta}
            to={p.cesta}
            end={p.cesta === '/'}
            className={({ isActive }) =>
              `relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] ${isActive ? 'font-semibold text-ink [&>svg]:text-accent-text' : 'font-medium text-muted'}`
            }
          >
            <p.ikona className="size-[22px]" />
            {p.kratce ?? p.nazev}
            {p.bublina && bubliny[p.bublina] > 0 && (
              <span className="absolute left-1/2 top-1 ml-1.5 size-2 rounded-full bg-accent" aria-label="Nové" />
            )}
          </NavLink>
        ),
      )}
    </nav>
  )
}

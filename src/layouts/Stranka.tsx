import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Drobecek = { nazev: string; cesta: string }

/**
 * Obal každé stránky: horní lišta s názvem (nebo drobečkovou navigací) a akcemi, pod ní obsah.
 * Na mobilu je název velký v obsahu, horní lišta patří AppShellu.
 */
export function Stranka({
  nadpis, drobecky, akce, sirka = 'normalni', nadpisNaMobilu = true, children,
}: {
  nadpis: string
  drobecky?: Drobecek[]
  akce?: ReactNode
  sirka?: 'uzka' | 'normalni' | 'siroka' | 'plna'
  /** false, když má stránka vlastní velký nadpis (přehled, detail) */
  nadpisNaMobilu?: boolean
  children: ReactNode
}) {
  const max = { uzka: 'max-w-[760px]', normalni: 'max-w-[1120px]', siroka: 'max-w-[1200px]', plna: 'max-w-none' }[sirka]
  return (
    <>
      <header className="sticky top-0 z-20 hidden items-center gap-3 border-b border-line bg-surface px-10 py-4 lg:flex">
        {drobecky ? (
          <nav aria-label="Drobečková navigace" className="flex items-center gap-2 text-sm">
            {drobecky.map((d) => (
              <span key={d.cesta} className="flex items-center gap-2">
                <Link to={d.cesta} className="font-medium text-muted hover:text-ink">{d.nazev}</Link>
                <span className="text-line-strong" aria-hidden>/</span>
              </span>
            ))}
            <h1 className="text-sm font-semibold">{nadpis}</h1>
          </nav>
        ) : (
          <h1 className="text-lg font-semibold">{nadpis}</h1>
        )}
        {akce && <div className="ml-auto flex items-center gap-2">{akce}</div>}
      </header>
      <main className={`mx-auto w-full ${max} ${sirka === 'plna' ? '' : 'px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-9'}`}>
        {nadpisNaMobilu && (
          <div className={sirka === 'plna' ? 'px-4 pt-6 lg:hidden' : 'lg:hidden'}>
            <h1 className="mb-5 text-2xl font-semibold tracking-tight">{nadpis}</h1>
          </div>
        )}
        {drobecky && (
          <Link to={drobecky[drobecky.length - 1].cesta} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted lg:hidden">
            ← {drobecky[drobecky.length - 1].nazev}
          </Link>
        )}
        {children}
      </main>
    </>
  )
}

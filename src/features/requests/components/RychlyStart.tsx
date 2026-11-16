import { Link } from 'react-router-dom'
import { OBORY, OborIkona } from '../kategorie'

/** Rychlý začátek nové poptávky podle oboru. */
export function RychlyStart() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {OBORY.map((o) => (
        <Link
          key={o.nazev}
          to={`/nova?obor=${encodeURIComponent(o.nazev)}`}
          className="group flex items-center gap-3 rounded-[14px] border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
        >
          <OborIkona kategorie={o.nazev} velikost={40} />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{o.nazev}</span>
            <span className="block truncate text-xs text-muted">{o.popis}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

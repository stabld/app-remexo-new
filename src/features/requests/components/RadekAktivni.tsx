import { Link } from 'react-router-dom'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { rozlozPopis } from '@/lib/popis'
import type { MojePoptavka } from '../api'
import { krokPrubehu, lokalita } from '../model'
import { OborIkona, obor } from '../kategorie'

/** Řádek aktivní poptávky s průběhem zakázky. */
export function RadekAktivni({ poptavka: p }: { poptavka: MojePoptavka }) {
  const misto = lokalita(p, rozlozPopis(p.description, true).fakta.find((f) => f.popisek === 'Místo')?.hodnota)
  return (
    <Link to={`/poptavky/${p.id}`} className="flex flex-col gap-3 px-5 py-[18px] transition-colors hover:bg-surface-2/60">
      <div className="flex items-center gap-3">
        <OborIkona kategorie={p.category} velikost={36} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{p.title || 'Poptávka'}</span>
          <span className="block text-[13px] text-muted">{[obor(p.category).nazev, misto].filter(Boolean).join(' · ')}</span>
        </span>
      </div>
      <ProgressSteps aktualni={krokPrubehu(p.stav)} />
    </Link>
  )
}

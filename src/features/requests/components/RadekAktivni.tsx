import { Link } from 'react-router-dom'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { rozlozPopis } from '@/lib/popis'
import type { MojePoptavka } from '../api'
import { krokPrubehu, lokalita } from '../model'

/** Řádek aktivní poptávky s průběhem zakázky. */
export function RadekAktivni({ poptavka: p }: { poptavka: MojePoptavka }) {
  const misto = lokalita(p, rozlozPopis(p.description, true).fakta.find((f) => f.popisek === 'Místo')?.hodnota)
  return (
    <Link to={`/poptavky/${p.id}`} className="flex flex-col gap-3 px-5 py-[18px] transition-colors hover:bg-surface-2/60">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="font-semibold">{p.title || 'Poptávka'}</span>
        <span className="ml-auto text-[13px] text-muted">{[p.category, misto].filter(Boolean).join(', ')}</span>
      </div>
      <ProgressSteps aktualni={krokPrubehu(p.stav)} />
    </Link>
  )
}

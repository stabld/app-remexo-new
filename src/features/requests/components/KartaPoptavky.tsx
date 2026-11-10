import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Nahled } from '@/components/Fotky'
import { Avatar } from '@/components/ui/Avatar'
import { rozlozPopis } from '@/lib/popis'
import { kratkeDatum, relativniCas } from '@/lib/cas'
import type { MojePoptavka } from '../api'
import { lokalita, sklonujNabidky } from '../model'
import { StavBadge } from './StavBadge'

/** Pravý sloupec karty: co je u poptávky podstatné právě teď. */
function Souhrn({ p }: { p: MojePoptavka }) {
  if (p.status === 'active' || p.status === 'done') {
    return (
      <>
        <span className="flex items-center gap-2 text-sm">
          <Avatar jmeno={p.craftsman_name ?? 'Řemeslník'} velikost={28} />
          {p.craftsman_name ?? 'Řemeslník'}
        </span>
        <span className="text-[13px] text-muted">{p.stav === 'ceka-na-potvrzeni' ? 'Hlásí hotovo' : p.status === 'done' ? 'Zakázka dokončená' : 'Pracuje na tom'}</span>
      </>
    )
  }
  const posledni = [...p.nabidky].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const pocet = p.status === 'waiting' ? p.cekajiciNabidky : p.nabidky.length
  return (
    <>
      <span className="text-sm text-muted">
        <b className="text-[22px] font-semibold text-ink tabular-nums">{pocet}</b> {sklonujNabidky(pocet)}
      </span>
      <span className="text-[13px] text-muted">
        {p.status === 'cancelled'
          ? p.zruseno_duvod ? `Zrušeno: ${p.zruseno_duvod}` : 'Zrušeno'
          : posledni
            ? <>{posledni.craftsman_name ?? 'Řemeslník'} poslal nabídku<br />{relativniCas(posledni.created_at)}</>
            : <>Je na tržišti, dáme vědět<br />e-mailem, až přijde nabídka</>}
      </span>
    </>
  )
}

export function KartaPoptavky({ poptavka: p }: { poptavka: MojePoptavka }) {
  const popis = rozlozPopis(p.description, true)
  const misto = lokalita(p, popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota)

  return (
    <Link
      to={`/poptavky/${p.id}`}
      className="flex flex-wrap gap-5 rounded-[14px] border border-line bg-surface p-[18px] shadow-card transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-raised"
    >
      <Nahled soubory={popis.soubory} stare={popis.stareFotky} className="h-[90px] w-[120px]" />
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[17px] font-semibold">{p.title || 'Poptávka'}</span>
          <StavBadge stav={p.stav} />
        </div>
        <p className="line-clamp-2 text-sm text-muted">{popis.hlavni}</p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          {misto && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{misto}</span>}
          <span>Zadáno {kratkeDatum(p.created_at)}</span>
          {p.category && <span>{p.category}</span>}
        </p>
      </div>
      <div className="flex flex-[0_1_200px] flex-col items-end justify-between gap-2 text-right">
        <Souhrn p={p} />
      </div>
    </Link>
  )
}

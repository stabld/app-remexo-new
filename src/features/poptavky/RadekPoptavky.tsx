import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { rozlozPopis } from '@/lib/popis'
import { parsujDatum, stariPoptavky } from '@/lib/cas'
import { STAV_POPTAVKY } from '@/lib/types'
import { Nahled } from '@/components/Fotky'
import type { MojePoptavka } from './api'

/**
 * Jedna věta pod nadpisem: co se s poptávkou právě děje, případně co má zákazník udělat.
 * zvyraznit = čeká se na zákazníka.
 */
function coSeDeje(p: MojePoptavka): { text: string; zvyraznit: boolean } {
  if (p.status === 'active' && p.dokonceni_navrzeno) return { text: `${p.craftsman_name ?? 'Řemeslník'} hlásí hotovo, potvrď a ohodnoť`, zvyraznit: true }
  if (p.status === 'active') return { text: `Pracuje na tom ${p.craftsman_name ?? 'řemeslník'}`, zvyraznit: false }
  if (p.status === 'done') return { text: `Udělal ${p.craftsman_name ?? 'řemeslník'}`, zvyraznit: false }
  if (p.status === 'cancelled') return { text: p.zruseno_duvod ? `Zrušeno: ${p.zruseno_duvod}` : 'Zrušeno', zvyraznit: false }
  if (p.cekajiciNabidky === 1) return { text: 'Máš 1 novou nabídku', zvyraznit: true }
  if (p.cekajiciNabidky > 1) return { text: `Máš ${p.cekajiciNabidky} ${p.cekajiciNabidky < 5 ? 'nové nabídky' : 'nových nabídek'}`, zvyraznit: true }
  if (p.odstoupeni) return { text: `${p.odstoupeni.craftsman_name ?? 'Řemeslník'} odstoupil, poptávka je zpátky na tržišti`, zvyraznit: false }
  const hodin = (stariPoptavky(p.created_at)?.minut ?? 0) / 60
  if (hodin < 24) return { text: 'Řemeslníci z okolí ji vidí, ozveme se, až přijde nabídka', zvyraznit: false }
  if (hodin < 72) return { text: 'Zatím bez nabídek, pomůže doplnit fotku nebo termín', zvyraznit: false }
  return { text: 'Na tohle zatím nemáme řemeslníka, napiš nám a zkusíme někoho sehnat', zvyraznit: false }
}

function kratkeDatum(datum: string) {
  const d = parsujDatum(datum)
  if (!d) return ''
  const letos = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('cs', { day: 'numeric', month: 'numeric', ...(letos ? {} : { year: 'numeric' }) })
}

export function RadekPoptavky({ poptavka: p }: { poptavka: MojePoptavka }) {
  const popis = rozlozPopis(p.description)
  const stav = STAV_POPTAVKY[p.status] ?? STAV_POPTAVKY.waiting
  const deni = coSeDeje(p)
  const ukoncena = p.status === 'done' || p.status === 'cancelled'

  return (
    <Link
      to={`/poptavky/${p.id}`}
      className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-stone-50 sm:px-5 dark:hover:bg-stone-900"
    >
      <Nahled soubory={popis.soubory} stare={popis.stareFotky} />

      <div className="min-w-0 flex-1">
        <h3 className={`line-clamp-2 font-semibold leading-snug ${ukoncena ? 'text-stone-500' : ''}`}>{p.title || 'Poptávka'}</h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
          <span className={`size-2 shrink-0 rounded-full ${stav.tecka}`} aria-hidden />
          <span>{stav.text}</span>
          <span className="ml-auto shrink-0 text-stone-400">{kratkeDatum(p.created_at)}</span>
        </p>
        <p className={`mt-1 text-sm ${deni.zvyraznit ? 'font-semibold text-remexo-700 dark:text-remexo-500' : 'text-stone-500'}`}>
          {deni.text}
        </p>
      </div>

      <ChevronRight className="mt-0.5 size-5 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

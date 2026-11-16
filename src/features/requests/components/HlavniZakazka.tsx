import { Link } from 'react-router-dom'
import { MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { KROKY } from '@/components/ui/ProgressSteps'
import { rozlozPopis } from '@/lib/popis'
import { kratkeDatum } from '@/lib/cas'
import { useFotka } from '@/components/Fotky'
import type { MojePoptavka } from '../api'
import { useRemeslnik } from '../api'
import { krokPrubehu, lokalita, nejnizsiCena, sklonujNabidky } from '../model'
import { OborIkona, obor } from '../kategorie'

/** Velká karta zakázky, na které se teď nejvíc děje: fotka, průběh, kdo na ní dělá a co dál. */
export function HlavniZakazka({ poptavka: p }: { poptavka: MojePoptavka }) {
  const popis = rozlozPopis(p.description, true)
  const fotka = useFotka(popis.soubory, popis.stareFotky)
  const misto = lokalita(p, popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota)
  const krok = krokPrubehu(p.stav)
  const detail = `/poptavky/${p.id}`

  return (
    <article className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-card">
      <div className="flex flex-col sm:flex-row">
        <Link to={detail} className="relative block h-28 shrink-0 sm:h-auto sm:w-[220px]" aria-label={p.title || 'Poptávka'}>
          {fotka ? (
            <img src={fotka} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className={`absolute inset-0 grid place-items-center ${obor(p.category).barva}`}>
              <OborIkona kategorie={p.category} velikost={72} />
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-5 p-6">
          <div>
            <p className="text-[13px] font-medium text-muted">
              {[obor(p.category).nazev, misto].filter(Boolean).join(' · ')}
            </p>
            <Link to={detail} className="mt-1 block text-[22px] font-semibold leading-snug tracking-tight hover:underline">
              {p.title || 'Poptávka'}
            </Link>
          </div>

          <ol className="grid grid-cols-4 gap-1.5" aria-label={`Průběh: ${KROKY[krok]}`}>
            {KROKY.map((k, i) => (
              <li key={k} className="flex flex-col gap-2">
                <span className={`h-1.5 rounded-full ${i < krok ? 'bg-ink' : i === krok ? 'bg-accent' : 'bg-line'}`} />
                <span className={`text-[13px] ${i === krok ? 'font-semibold' : i < krok ? 'text-muted' : 'text-faint'}`}>
                  {k}
                  {i === 0 && <span className="block text-xs font-normal text-faint">{kratkeDatum(p.created_at)}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="border-t border-line bg-bg/60 px-6 py-4">
        {p.craftsman_id || p.craftsman_name ? <KdoNaTomDela p={p} /> : <Nabidky p={p} />}
      </div>
    </article>
  )
}

function KdoNaTomDela({ p }: { p: MojePoptavka }) {
  const { data: r } = useRemeslnik(p.craftsman_id)
  const jmeno = p.craftsman_name || 'Řemeslník'
  const potvrdit = p.stav === 'ceka-na-potvrzeni'
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Avatar jmeno={jmeno} url={r?.avatarUrl} velikost={44} />
      <div className="min-w-0 flex-[1_1_180px]">
        <p className="flex items-center gap-1.5 font-semibold">
          {jmeno}
          {r?.overeny && <ShieldCheck className="size-4 text-success-text" aria-label="Ověřený řemeslník" />}
          {r?.prumer != null && (
            <span className="ml-1 inline-flex items-center gap-1 text-[13px] font-normal text-muted">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden />
              {r.prumer.toLocaleString('cs', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          )}
        </p>
        <p className="text-sm text-muted">
          {potvrdit ? 'Hlásí, že je hotovo. Zkontroluj práci a potvrď.' : 'Pracuje na zakázce. Termín a detaily si domluvte v chatu.'}
        </p>
      </div>
      <div className="flex gap-2 max-sm:w-full [&>a]:max-sm:flex-1">
        <ButtonLink to="/zpravy" varianta="secondary"><MessageCircle className="size-4" /> Napsat</ButtonLink>
        {potvrdit && <ButtonLink to={`/poptavky/${p.id}`}>Potvrdit a ohodnotit</ButtonLink>}
      </div>
    </div>
  )
}

function Nabidky({ p }: { p: MojePoptavka }) {
  const cekajici = p.nabidky.filter((n) => n.status === 'pending')
  if (!cekajici.length)
    return (
      <p className="text-sm text-muted">
        Zatím bez nabídek. Řemeslníci z okolí ji vidí na tržišti, dáme ti vědět e-mailem. Pomůže přidat fotku.
      </p>
    )
  const cena = nejnizsiCena(cekajici.map((n) => n.price))
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex -space-x-2">
        {cekajici.slice(0, 3).map((n, i) => (
          <span key={i} className="rounded-full ring-2 ring-surface"><Avatar jmeno={n.craftsman_name || 'Řemeslník'} velikost={36} /></span>
        ))}
      </div>
      <div className="min-w-0 flex-[1_1_160px]">
        <p className="font-semibold">{cekajici.length} {sklonujNabidky(cekajici.length)} čeká na tvoje rozhodnutí</p>
        {cena && <p className="text-sm text-muted">Nejnižší {cena}</p>}
      </div>
      <ButtonLink to={`/poptavky/${p.id}`} className="max-sm:w-full">Porovnat nabídky</ButtonLink>
    </div>
  )
}

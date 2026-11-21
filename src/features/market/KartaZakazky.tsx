import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import type { Poptavka } from '@/lib/types'
import { rozlozPopis } from '@/lib/popis'
import { stariPoptavky } from '@/lib/cas'
import { useFotka } from '@/components/Fotky'
import { tridyTlacitka } from '@/components/ui/Button'
import { OborIkona } from '@/features/requests/kategorie'
import { muzeNabidnout, MAX_POKUSU, type MojeNabidkaKPoptavce } from './api'
import { formatKm, rozpocet, specha } from './model'

function StavMeNabidky({ n }: { n: MojeNabidkaKPoptavce }) {
  if (n.stav === 'pending') return <span className="text-[13px] font-semibold text-success-text">Tvoje nabídka čeká na zákazníka</span>
  if (n.stav === 'rejected' && muzeNabidnout(n))
    return <span className="text-[13px] font-semibold text-accent-text">Nabídka odmítnuta, můžeš poslat opravenou</span>
  if (n.stav === 'rejected') return <span className="text-[13px] text-muted">Nabídka odmítnuta ({MAX_POKUSU}× z {MAX_POKUSU})</span>
  return null
}

export const KartaZakazky = forwardRef<HTMLElement, {
  z: Poptavka
  km: number | null
  moje?: MojeNabidkaKPoptavce
  ulozena: boolean
  vybrana: boolean
  onUlozit: () => void
  onVyber: () => void
}>(function KartaZakazky({ z, km, moje, ulozena, vybrana, onUlozit, onVyber }, ref) {
  const popis = rozlozPopis(z.description, true)
  const fotka = useFotka(popis.soubory, popis.stareFotky)
  const misto = z.mesto || popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota
  const stari = stariPoptavky(z.created_at)
  const cena = rozpocet(z, popis.fakta.find((f) => f.popisek === 'Rozpočet')?.hodnota)
  const vzdalenost = formatKm(km)
  const muze = muzeNabidnout(moje)
  const nazev = z.title || 'Poptávka'

  return (
    <article
      ref={ref}
      onMouseEnter={onVyber}
      onFocus={onVyber}
      className={`group relative flex flex-col gap-3 rounded-[14px] border bg-surface p-4 transition-[border-color,box-shadow] ${
        vybrana ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line hover:border-line-strong hover:shadow-raised'
      }`}
    >
      <div className="flex gap-3.5">
        {fotka ? (
          <img src={fotka} alt="" className="h-[72px] w-[88px] shrink-0 rounded-[10px] bg-placeholder object-cover" />
        ) : (
          <span className="grid h-[72px] w-[88px] shrink-0 place-items-center rounded-[10px] bg-surface-2">
            <OborIkona kategorie={z.category} velikost={40} />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">
              {/* Celá karta je klikací, tlačítka nad ní mají vyšší vrstvu. */}
              <Link to={`/trziste/${z.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[14px] focus-visible:underline">
                {nazev}
              </Link>
            </h3>
            <button
              type="button"
              onClick={onUlozit}
              aria-pressed={ulozena}
              aria-label={ulozena ? 'Odebrat z uložených' : 'Uložit zakázku'}
              className={`relative z-10 -m-1 grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-surface-2 ${ulozena ? 'text-accent' : 'text-faint hover:text-muted'}`}
            >
              <Bookmark className="size-[18px]" fill={ulozena ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="text-[13px] text-muted">
            {misto}
            {vzdalenost && <>{misto && ', '}<b className="font-semibold text-ink">{vzdalenost}</b></>}
            {stari && <>{(misto || vzdalenost) && ', '}<span className={stari.cerstve ? 'font-medium text-success-text' : ''}>{stari.text}</span></>}
          </p>
          {popis.hlavni && <p className="mt-0.5 line-clamp-2 text-sm text-soft">{popis.hlavni}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3">
        {specha(z) && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-soft-text">Spěchá</span>}
        {moje ? <StavMeNabidky n={moje} /> : <span className="text-[13px] text-muted">{cena ? `Rozpočet ${cena}` : 'Rozpočet dohodou'}</span>}
        <span className={`ml-auto ${tridyTlacitka(vybrana && muze ? 'primary' : 'secondary', 'sm')} pointer-events-none`} aria-hidden>
          {moje && !muze ? 'Zobrazit' : 'Detail a nabídka'}
        </span>
      </div>
    </article>
  )
})

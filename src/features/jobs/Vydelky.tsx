import { Link } from 'react-router-dom'
import { Info, Wallet } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { kratkeDatum, parsujDatum } from '@/lib/cas'
import { useMojePrace, type MojePrace } from './api'
import { Hvezdy } from './DalsiKrok'

/** Cena z nabídky jako číslo – jen když je to jedna pevná částka („1 800 Kč“). Rozpětí a „Dohodou“ nepočítáme. */
function castka(cena: string | null): number | null {
  if (!cena) return null
  const s = cena.replace(/ /g, ' ').trim()
  if (!/^\d[\d ]*(,\d{1,2})?\s*(Kč|,-|,–)?$/i.test(s)) return null
  const n = Number(s.replace(/[^\d,]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

const kc = (n: number) => `${Math.round(n).toLocaleString('cs')} Kč`

/** Kdy byla zakázka hotová: čas nahlášení dokončení, jinak čas nabídky. */
const kdyHotovo = (p: MojePrace) => p.dokonceniNavrzeno || p.odeslano

function mesic(datum: string) {
  const d = parsujDatum(datum)
  return d ? d.toLocaleDateString('cs', { month: 'long', year: 'numeric' }) : 'Neznámé datum'
}

export function Vydelky() {
  const { data, isPending, isError, refetch } = useMojePrace()
  if (isPending) return <NacitaniStranky />

  const hotove = (data ?? []).filter((p) => p.druh === 'hotovo').sort((a, b) => kdyHotovo(b).localeCompare(kdyHotovo(a)))
  const sCenou = hotove.filter((p) => castka(p.cena) != null)
  const soucet = sCenou.reduce((a, p) => a + castka(p.cena)!, 0)
  const bezCeny = hotove.length - sCenou.length

  const mesice: { nazev: string; pocet: number; soucet: number }[] = []
  for (const p of hotove) {
    const nazev = mesic(kdyHotovo(p))
    let m = mesice.find((x) => x.nazev === nazev)
    if (!m) mesice.push((m = { nazev, pocet: 0, soucet: 0 }))
    m.pocet++
    m.soucet += castka(p.cena) ?? 0
  }

  return (
    <Stranka nadpis="Výdělky" sirka="siroka">
      <div className="flex flex-col gap-6">
        <section className="flex max-w-[820px] items-start gap-3.5 rounded-[14px] border border-line bg-surface px-5 py-4">
          <Wallet className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Platby přes Remexo připravujeme</p>
            <p className="text-sm text-soft">
              Zatím se platí přímo mezi tebou a zákazníkem a Remexo peníze nevidí. Částky níž jsou ceny z tvých nabídek u dokončených zakázek, ne přijaté platby.
            </p>
          </div>
        </section>

        {isError ? (
          <Card className="px-6 py-10 text-center">
            <p className="font-semibold">Výdělky se nepodařilo načíst</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-accent-text hover:underline">Zkusit znovu</button>
          </Card>
        ) : hotove.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-12 text-center">
            <p className="font-semibold">Zatím žádná dokončená zakázka</p>
            <p className="mt-1 max-w-sm text-sm text-muted">Jakmile zákazník potvrdí hotovo, uvidíš tu přehled podle měsíců.</p>
            <ButtonLink to="/trziste" className="mt-4">Otevřít tržiště</ButtonLink>
          </Card>
        ) : (
          <>
            <section aria-label="Souhrn" className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
              <Card className="px-5 py-4">
                <p className="text-sm text-muted">Dokončené zakázky</p>
                <p className="text-[28px] font-semibold tabular-nums leading-tight">{hotove.length}</p>
              </Card>
              <Card className="px-5 py-4">
                <p className="text-sm text-muted">Součet podle nabídek</p>
                <p className="text-[28px] font-semibold tabular-nums leading-tight">{kc(soucet)}</p>
                {bezCeny > 0 && (
                  <p className="text-xs text-faint">
                    {bezCeny === 1 ? '1 zakázka s cenou dohodou se nepočítá' : bezCeny <= 4 ? `${bezCeny} zakázky s cenou dohodou se nepočítají` : `${bezCeny} zakázek s cenou dohodou se nepočítá`}
                  </p>
                )}
              </Card>
              <Card className="col-span-2 px-5 py-4 lg:col-span-1">
                <p className="text-sm text-muted">Průměrná zakázka</p>
                <p className="text-[28px] font-semibold tabular-nums leading-tight">{sCenou.length ? kc(soucet / sCenou.length) : '–'}</p>
              </Card>
            </section>

            <div className="flex flex-wrap items-start gap-6">
              <Card className="min-w-0 flex-[2_1_520px] overflow-hidden">
                <h2 className="border-b border-line px-5 py-3.5 text-base font-semibold">Dokončené zakázky</h2>
                <ul className="divide-y divide-line">
                  {hotove.map((p) => (
                    <li key={p.nabidkaId}>
                      <Link to={`/zakazky/${p.requestId}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2/50">
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">{p.titulek}</span>
                          <span className="truncate text-[13px] text-muted">{p.zakaznik}, {kratkeDatum(kdyHotovo(p))}</span>
                        </span>
                        {p.hodnoceni && <span className="hidden sm:block"><Hvezdy pocet={p.hodnoceni.hvezdicky} /></span>}
                        <span className={`w-24 shrink-0 text-right tabular-nums ${castka(p.cena) != null ? 'font-semibold' : 'text-muted'}`}>{p.cena || 'Dohodou'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="min-w-0 flex-[1_1_280px] overflow-hidden">
                <h2 className="border-b border-line px-5 py-3.5 text-base font-semibold">Podle měsíců</h2>
                <ul className="divide-y divide-line">
                  {mesice.map((m) => (
                    <li key={m.nazev} className="flex items-baseline gap-3 px-5 py-3">
                      <span className="flex-1 first-letter:uppercase">{m.nazev}</span>
                      <span className="text-[13px] text-muted">{m.pocet} {m.pocet === 1 ? 'zakázka' : m.pocet <= 4 ? 'zakázky' : 'zakázek'}</span>
                      <span className="w-24 text-right font-semibold tabular-nums">{kc(m.soucet)}</span>
                    </li>
                  ))}
                </ul>
                <p className="flex items-start gap-2 border-t border-line px-5 py-3 text-xs text-muted">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden />Měsíc podle data, kdy jsi nahlásil hotovo.
                </p>
              </Card>
            </div>
          </>
        )}
      </div>
    </Stranka>
  )
}

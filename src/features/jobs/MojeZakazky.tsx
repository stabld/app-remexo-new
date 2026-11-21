import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Wallet } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { rozlozPopis } from '@/lib/popis'
import { kratkeDatum } from '@/lib/cas'
import { useMojePrace, type MojePrace } from './api'
import { DalsiKrok, StavPraceBadge } from './DalsiKrok'

type Zalozka = 'rozpracovane' | 'dokoncene' | 'zrusene'

const ZALOZKY: { id: Zalozka; text: string; druh: MojePrace['druh'] }[] = [
  { id: 'rozpracovane', text: 'Rozpracované', druh: 'aktivni' },
  { id: 'dokoncene', text: 'Dokončené', druh: 'hotovo' },
  { id: 'zrusene', text: 'Zrušené', druh: 'zrusena' },
]

function misto(p: MojePrace) {
  return p.kontakt?.mesto || p.mesto || rozlozPopis(p.popis).fakta.find((f) => f.popisek === 'Místo')?.hodnota || null
}

function podtitulek(p: MojePrace) {
  const m = misto(p)
  const kdy = p.druh === 'aktivni' && p.dokonceniNavrzeno ? `hotovo nahlášeno ${kratkeDatum(p.dokonceniNavrzeno)}` : `nabídka z ${kratkeDatum(p.odeslano)}`
  return [m, kdy].filter(Boolean).join(', ')
}

const Telefon = ({ t }: { t: string | null | undefined }) =>
  t ? <a href={`tel:${t.replace(/[^\d+]/g, '')}`} className="text-[13px] text-muted hover:text-ink">{t}</a> : null

export function MojeZakazky() {
  const { data, isPending, isError, refetch } = useMojePrace()
  const [tab, setTab] = useState<Zalozka>('rozpracovane')
  if (isPending) return <NacitaniStranky />

  const vse = data ?? []
  const druh = ZALOZKY.find((z) => z.id === tab)!.druh
  const seznam = vse.filter((p) => p.druh === druh)
  const zadne = vse.every((p) => p.druh === 'ceka' || p.druh === 'odmitnuta')

  return (
    <Stranka nadpis="Moje zakázky" sirka="siroka">
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="Stav zakázek" className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
          {ZALOZKY.map((z) => {
            const pocet = vse.filter((p) => p.druh === z.druh).length
            const aktivni = tab === z.id
            return (
              <button
                key={z.id}
                role="tab"
                aria-selected={aktivni}
                onClick={() => setTab(z.id)}
                className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm transition-colors ${aktivni ? 'border-accent font-semibold text-ink' : 'border-transparent font-medium text-soft hover:text-ink'}`}
              >
                {z.text} <span className={aktivni ? 'font-medium text-muted' : 'text-faint'}>{pocet}</span>
              </button>
            )
          })}
        </div>

        {isError ? (
          <Card className="px-6 py-10 text-center">
            <p className="font-semibold">Zakázky se nepodařilo načíst</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-accent-text hover:underline">Zkusit znovu</button>
          </Card>
        ) : seznam.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-12 text-center">
            <Briefcase className="mb-3 size-8 text-faint" aria-hidden />
            <p className="font-semibold">
              {tab === 'rozpracovane' ? 'Teď nemáš žádnou rozpracovanou zakázku' : tab === 'dokoncene' ? 'Zatím žádná dokončená zakázka' : 'Žádná zrušená zakázka'}
            </p>
            {tab === 'rozpracovane' && (
              <>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  {zadne ? 'Zakázka se tu objeví, jakmile zákazník přijme tvoji nabídku.' : 'Nové zakázky najdeš na tržišti.'}
                </p>
                <ButtonLink to="/trziste" className="mt-4">Otevřít tržiště</ButtonLink>
              </>
            )}
          </Card>
        ) : (
          <>
            {/* Počítač: tabulka */}
            <Card className="hidden overflow-hidden md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    <th scope="col" className="border-b border-line px-5 py-3 font-medium">Zakázka</th>
                    <th scope="col" className="border-b border-line px-4 py-3 font-medium">Zákazník</th>
                    <th scope="col" className="border-b border-line px-4 py-3 font-medium">Stav</th>
                    <th scope="col" className="border-b border-line px-4 py-3 text-right font-medium">Cena</th>
                    <th scope="col" className="border-b border-line px-5 py-3 text-right font-medium">{tab === 'dokoncene' ? 'Hodnocení' : tab === 'zrusene' ? 'Důvod' : 'Další krok'}</th>
                  </tr>
                </thead>
                <tbody>
                  {seznam.map((p) => (
                    <tr key={p.nabidkaId} className="border-b border-line align-top last:border-0 hover:bg-surface-2/40">
                      <td className="px-5 py-4">
                        <Link to={`/zakazky/${p.requestId}`} className="font-semibold hover:underline">{p.titulek}</Link>
                        <p className="text-[13px] text-muted">{podtitulek(p)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{p.zakaznik}</p>
                        {p.druh === 'aktivni' && <Telefon t={p.kontakt?.telefon} />}
                      </td>
                      <td className="px-4 py-4"><StavPraceBadge p={p} /></td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums">{p.cena || 'Dohodou'}</td>
                      <td className="px-5 py-4 text-right"><DalsiKrok p={p} kompaktni /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobil: karty */}
            <div className="flex flex-col gap-3 md:hidden">
              {seznam.map((p) => (
                <Card key={p.nabidkaId} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/zakazky/${p.requestId}`} className="font-semibold hover:underline">{p.titulek}</Link>
                      <p className="text-[13px] text-muted">{podtitulek(p)}</p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{p.cena || 'Dohodou'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StavPraceBadge p={p} />
                    <span className="text-[13px] text-soft">{p.zakaznik}</span>
                    {p.druh === 'aktivni' && <Telefon t={p.kontakt?.telefon} />}
                  </div>
                  <div className="border-t border-line pt-3"><DalsiKrok p={p} /></div>
                </Card>
              ))}
            </div>
          </>
        )}

        <section className="flex max-w-[720px] items-start gap-3.5 rounded-[14px] border border-line bg-surface px-5 py-4">
          <Wallet className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Platby přes Remexo připravujeme</p>
            <p className="text-sm text-soft">Zatím se platí přímo mezi tebou a zákazníkem.</p>
          </div>
        </section>
      </div>
    </Stranka>
  )
}

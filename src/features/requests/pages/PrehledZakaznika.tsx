import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Stranka } from '@/layouts/Stranka'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { relativniCas } from '@/lib/cas'
import { vokativ } from '@/lib/osloveni'
import { useMojePoptavky } from '../api'
import { STAVY } from '../model'
import { posledniAktivita } from '../aktivita'
import { KartaNaTebe } from '../components/KartaNaTebe'
import { RadekAktivni } from '../components/RadekAktivni'


export function PrehledZakaznika() {
  const { jmeno } = useAuth()
  const { data: poptavky = [], isLoading, isError } = useMojePoptavky()

  const naTebe = poptavky.filter((p) => STAVY[p.stav].naTebe)
  const aktivni = poptavky.filter((p) => p.status === 'waiting' || p.status === 'active')
  const aktivita = posledniAktivita(poptavky)

  const podtitul =
    naTebe.length === 0
      ? aktivni.length ? 'Teď nic nečeká na tebe. Dáme vědět, až se něco pohne.' : 'Co potřebuješ opravit? Řemeslníci z okolí ti pošlou nabídky.'
      : naTebe.length === 1 ? 'Jedna věc čeká na tvoje rozhodnutí.' : `${naTebe.length} věci čekají na tvoje rozhodnutí.`

  return (
    <Stranka nadpis="Přehled" nadpisNaMobilu={false}>
      {isLoading ? (
        <NacitaniStranky />
      ) : isError ? (
        <p className="text-muted">Přehled se nepodařilo načíst. Zkontroluj připojení a obnov stránku.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-[1_1_360px]">
              <h2 className="text-[28px] font-semibold tracking-tight">Dobrý den, {vokativ(jmeno)}</h2>
              <p className="mt-1.5 text-base text-muted">{podtitul}</p>
            </div>
            <ButtonLink to="/nova" velikost="lg"><Plus className="size-[18px]" strokeWidth={2.2} /> Vytvořit poptávku</ButtonLink>
          </section>

          {naTebe.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="na-tebe">
              <h3 id="na-tebe" className="text-base font-semibold">Čeká na tebe</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
                {naTebe.map((p) => <KartaNaTebe key={p.id} poptavka={p} />)}
              </div>
            </section>
          )}

          {aktivni.length > 0 && (
            <div className="flex flex-wrap items-start gap-6">
              <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-3" aria-labelledby="aktivni">
                <div className="flex items-baseline">
                  <h3 id="aktivni" className="text-base font-semibold">Aktivní poptávky</h3>
                  <Link to="/poptavky" className="ml-auto text-sm font-medium text-accent-text hover:underline">Všechny poptávky</Link>
                </div>
                <Card className="divide-y divide-line overflow-hidden">
                  {aktivni.map((p) => <RadekAktivni key={p.id} poptavka={p} />)}
                </Card>
              </section>

              {aktivita.length > 0 && (
                <section className="flex min-w-0 flex-[1_1_280px] flex-col gap-3" aria-labelledby="aktivita">
                  <h3 id="aktivita" className="text-base font-semibold">Poslední aktivita</h3>
                  <ol className="flex flex-col gap-3.5 text-sm">
                    {aktivita.map((u, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className={`mt-[7px] size-2 shrink-0 rounded-full ${u.nova ? 'bg-accent' : 'bg-line-strong'}`} aria-hidden />
                        <Link to={`/poptavky/${u.poptavkaId}`} className="hover:underline">
                          <span className={u.nova ? 'text-ink' : 'text-soft'}>{u.text}</span>
                          <span className="block text-xs text-faint">{u.kde}, {relativniCas(u.kdy)}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </Stranka>
  )
}

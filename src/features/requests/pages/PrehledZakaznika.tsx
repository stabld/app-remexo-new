import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardPlus, Inbox, UserRoundX } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Stranka } from '@/layouts/Stranka'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { relativniCas } from '@/lib/cas'
import { vokativ } from '@/lib/osloveni'
import { useMojePoptavky, type MojePoptavka } from '../api'
import { STAVY } from '../model'
import { posledniAktivita, type Udalost } from '../aktivita'
import { HlavniZakazka } from '../components/HlavniZakazka'
import { RadekAktivni } from '../components/RadekAktivni'
import { RychlyStart } from '../components/RychlyStart'

/** Na čem se teď nejvíc děje: nejdřív to, co čeká na zákazníka, pak rozjeté, pak nejnovější. */
function poradi(p: MojePoptavka) {
  return (STAVY[p.stav].naTebe ? 0 : p.status === 'active' ? 1 : 2)
}

function IkonaUdalosti({ u }: { u: Udalost }) {
  const Ik = u.text.startsWith('Nová nabídka') ? Inbox : u.text.startsWith('Hlásí hotovo') ? CheckCircle2 : u.text.startsWith('Odstoupil') ? UserRoundX : ClipboardPlus
  return (
    <span className={`grid size-8 shrink-0 place-items-center rounded-full ${u.nova ? 'bg-accent-soft text-accent-text' : 'bg-surface-2 text-muted'}`} aria-hidden>
      <Ik className="size-4" />
    </span>
  )
}

export function PrehledZakaznika() {
  const { jmeno } = useAuth()
  const { data: poptavky = [], isLoading, isError } = useMojePoptavky()

  const rozpracovane = poptavky
    .filter((p) => p.status === 'waiting' || p.status === 'active')
    .sort((a, b) => poradi(a) - poradi(b) || b.created_at.localeCompare(a.created_at))
  const [hlavni, ...dalsi] = rozpracovane
  const naTebe = rozpracovane.filter((p) => STAVY[p.stav].naTebe).length
  const aktivita = posledniAktivita(poptavky, 6)

  return (
    <Stranka nadpis="Přehled" nadpisNaMobilu={false} sirka="prehled">
      {isLoading ? (
        <NacitaniStranky />
      ) : isError ? (
        <p className="text-muted">Přehled se nepodařilo načíst. Zkontroluj připojení a obnov stránku.</p>
      ) : (
        <div className="flex flex-wrap items-start gap-x-10 gap-y-10">
          <div className="flex min-w-0 flex-[2.4_1_560px] flex-col gap-10">
            <header>
              <h2 className="text-[28px] font-semibold tracking-tight">Dobrý den, {vokativ(jmeno)}</h2>
              <p className="mt-1 text-base text-muted">
                {!hlavni
                  ? 'Co je potřeba doma opravit? Vyber obor a popiš to vlastními slovy.'
                  : naTebe
                    ? naTebe === 1 ? 'Jedna zakázka čeká na tvoje rozhodnutí.' : `${naTebe} zakázky čekají na tvoje rozhodnutí.`
                    : rozpracovane.length === 1 ? 'Máš jednu rozpracovanou zakázku.' : `Máš ${rozpracovane.length} rozpracované zakázky.`}
              </p>
            </header>

            {hlavni && (
              <section className="flex flex-col gap-3" aria-label="Rozpracované zakázky">
                <HlavniZakazka poptavka={hlavni} />
                {dalsi.length > 0 && (
                  <div className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
                    {dalsi.map((p) => <RadekAktivni key={p.id} poptavka={p} />)}
                  </div>
                )}
              </section>
            )}

            <section className="flex flex-col gap-3" aria-labelledby="novy">
              <h3 id="novy" className="text-base font-semibold">{hlavni ? 'Potřebuješ opravit ještě něco?' : 'Vyber obor'}</h3>
              <RychlyStart />
            </section>
          </div>

          {aktivita.length > 0 && (
            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-[16px] border border-line bg-surface p-5 lg:mt-[72px]" aria-labelledby="aktivita">
              <div className="flex items-baseline">
                <h3 id="aktivita" className="text-base font-semibold">Co se dělo</h3>
                <Link to="/poptavky" className="ml-auto text-sm font-medium text-accent-text hover:underline">Všechny poptávky</Link>
              </div>
              <ol className="flex flex-col gap-4">
                {aktivita.map((u, i) => (
                  <li key={i}>
                    <Link to={`/poptavky/${u.poptavkaId}`} className="flex gap-3 rounded-lg hover:opacity-80">
                      <IkonaUdalosti u={u} />
                      <span className="min-w-0 text-sm">
                        <span className={u.nova ? 'font-medium' : 'text-soft'}>{u.text}</span>
                        <span className="block truncate text-xs text-faint">{u.kde}</span>
                        <span className="block text-xs text-faint">{relativniCas(u.kdy)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      )}
    </Stranka>
  )
}

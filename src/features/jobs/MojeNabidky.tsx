import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { SegmentTabs } from '@/components/ui/Tabs'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { rozlozPopis } from '@/lib/popis'
import { relativniCas } from '@/lib/cas'
import { OborIkona } from '@/features/requests/kategorie'
import { MAX_POKUSU } from '@/features/market/api'
import { DUVOD_PRO_REMESLNIKA } from '@/features/market/model'
import { useMojePrace, type MojePrace } from './api'

/** Text zprávy bez řádku s termínem, který appka připojuje na konec. */
function zpravaBezTerminu(z: string | null) {
  return (z ?? '').replace(/\n\nKdy můžu přijít:.*$/s, '').trim()
}

function KartaNabidky({ n }: { n: MojePrace }) {
  const popis = rozlozPopis(n.popis, true)
  const misto = n.mesto || popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota
  const odmitnuta = n.druh === 'odmitnuta'
  const zbyva = MAX_POKUSU - n.pokusy
  const muzeZnovu = odmitnuta && n.stavPoptavky === 'waiting' && zbyva > 0
  const zprava = zpravaBezTerminu(n.zprava)

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
      <OborIkona kategorie={n.kategorie} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link to={`/trziste/${n.requestId}`} className="font-semibold hover:underline">{n.titulek}</Link>
          {odmitnuta ? <Badge ton="muted">Odmítnuto</Badge> : <Badge ton="accent">Čeká na zákazníka</Badge>}
        </div>
        <p className="text-[13px] text-muted">
          {[misto, n.zakaznik, `odesláno ${relativniCas(n.odeslano)}`].filter(Boolean).join(' · ')}
          {n.pokusy > 1 && ' · opravená nabídka'}
        </p>
        {zprava && <p className="mt-1 line-clamp-2 text-sm text-soft">„{zprava}“</p>}
        {odmitnuta && (
          <p className="mt-2 rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-sm text-soft">
            Zákazník nabídku odmítl, protože {DUVOD_PRO_REMESLNIKA[n.duvodOdmitnuti ?? ''] ?? 'neuvedl důvod'}.{' '}
            {muzeZnovu
              ? `Můžeš poslat opravenou nabídku${zbyva === 1 ? ', je to poslední pokus' : ''}.`
              : n.stavPoptavky === 'waiting'
                ? 'Oba pokusy jsou vyčerpané.'
                : 'Zakázka už není volná.'}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <span className="text-lg font-semibold tabular-nums">{n.cena || 'Dohodou'}</span>
        {muzeZnovu ? (
          <ButtonLink to={`/trziste/${n.requestId}`} velikost="sm" className="ml-auto sm:ml-0">Poslat opravenou</ButtonLink>
        ) : !odmitnuta ? (
          <ButtonLink to={`/trziste/${n.requestId}`} varianta="secondary" velikost="sm" className="ml-auto sm:ml-0">Zobrazit zakázku</ButtonLink>
        ) : null}
      </div>
    </Card>
  )
}

export function MojeNabidky() {
  const { data, isPending, isError, refetch } = useMojePrace()
  const [tab, setTab] = useState<'ceka' | 'odmitnuta'>('ceka')

  if (isPending) return <NacitaniStranky />

  const cekajici = (data ?? []).filter((n) => n.druh === 'ceka')
  const odmitnute = (data ?? []).filter((n) => n.druh === 'odmitnuta')
  const prijatych = (data ?? []).filter((n) => n.druh === 'aktivni').length
  const seznam = tab === 'ceka' ? cekajici : odmitnute

  return (
    <Stranka nadpis="Moje nabídky" sirka="normalni">
      <div className="flex max-w-[880px] flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentTabs
            popis="Stav nabídek"
            hodnota={tab}
            zmenit={setTab}
            moznosti={[
              { id: 'ceka', text: 'Čekají na zákazníka', pocet: cekajici.length },
              { id: 'odmitnuta', text: 'Odmítnuté', pocet: odmitnute.length },
            ]}
          />
          {prijatych > 0 && (
            <Link to="/zakazky" className="text-sm font-medium text-accent-text hover:underline">
              Přijaté nabídky najdeš v Mých zakázkách ({prijatych})
            </Link>
          )}
        </div>

        {isError ? (
          <Card className="px-6 py-10 text-center">
            <p className="font-semibold">Nabídky se nepodařilo načíst</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-accent-text hover:underline">Zkusit znovu</button>
          </Card>
        ) : seznam.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-12 text-center">
            <Send className="mb-3 size-8 text-faint" aria-hidden />
            <p className="font-semibold">{tab === 'ceka' ? 'Žádná nabídka nečeká na odpověď' : 'Žádná odmítnutá nabídka'}</p>
            {tab === 'ceka' && (
              <>
                <p className="mt-1 max-w-sm text-sm text-muted">Vyber si zakázku na tržišti a pošli cenu. Zákazník dostane e-mail.</p>
                <ButtonLink to="/trziste" className="mt-4">Otevřít tržiště</ButtonLink>
              </>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {seznam.map((n) => <KartaNabidky key={n.nabidkaId} n={n} />)}
          </div>
        )}
      </div>
    </Stranka>
  )
}

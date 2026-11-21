import { useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { Badge, type Ton } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useToast } from '@/components/Toast'
import {
  useAudit, useCisla, useHlaseni, useHlaseniPoznamka, useHlaseniStav, useJeAdmin, useOverit, usePoptavky, usePozornost,
  useRemeslnici, useUzivatele, useZrusitOvereni, type Hlaseni, type Remeslnik,
} from './api'

type Zalozka = 'remeslnici' | 'cisla' | 'poptavky' | 'uzivatele' | 'hlaseni' | 'audit'
const ZALOZKY: { id: Zalozka; text: string }[] = [
  { id: 'remeslnici', text: 'Řemeslníci' },
  { id: 'hlaseni', text: 'Hlášení' },
  { id: 'poptavky', text: 'Poptávky' },
  { id: 'uzivatele', text: 'Uživatelé' },
  { id: 'cisla', text: 'Čísla' },
  { id: 'audit', text: 'Záznamy' },
]

function datum(t: string | null | undefined) {
  if (!t) return '—'
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('cs', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Stav<T>({ dotaz, children }: { dotaz: { isPending: boolean; isError: boolean; error: Error | null; data?: T }; children: (d: T) => ReactNode }) {
  if (dotaz.isPending) return <NacitaniStranky />
  if (dotaz.isError)
    return (
      <div className="py-10 text-center">
        <p className="font-semibold text-danger-text">Nepodařilo se načíst</p>
        <p className="text-sm text-muted">{dotaz.error?.message}</p>
      </div>
    )
  return <>{children(dotaz.data as T)}</>
}

function Tabulka({ hlavicky, children, prazdna }: { hlavicky: string[]; children: ReactNode; prazdna: boolean }) {
  if (prazdna) return <p className="py-10 text-center text-sm text-muted">Zatím nic.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[13px] text-muted">
            {hlavicky.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap border-b border-line px-4 py-3 font-medium first:pl-5 last:pr-5">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td:first-child]:pl-5 [&_td:last-child]:pr-5">
          {children}
        </tbody>
      </table>
    </div>
  )
}

function OveritModal({ r, zavrit }: { r: Remeslnik; zavrit: () => void }) {
  const toast = useToast()
  const overit = useOverit()
  const [ico, setIco] = useState(r.ico ?? '')
  return (
    <Modal otevreno zavrit={zavrit} nadpis={`Ověřit: ${r.jmeno || 'řemeslník'}`}>
      <p className="mb-4 text-sm text-soft">
        IČO zkontroluj v <a href="https://rzp.gov.cz" target="_blank" rel="noreferrer" className="font-semibold text-accent-text hover:underline">živnostenském rejstříku</a> a teprve pak potvrď. Prázdné pole = ověřeno bez IČO.
      </p>
      <Input label="IČO" value={ico} onChange={(e) => setIco(e.target.value)} inputMode="numeric" />
      <div className="mt-6 flex gap-2">
        <Button varianta="secondary" onClick={zavrit} className="flex-1">Zpět</Button>
        <Button
          className="flex-1"
          loading={overit.isPending}
          onClick={() => overit.mutate({ id: r.uzivatel_id, ico }, {
            onSuccess: () => { toast('Řemeslník ověřen', `${r.jmeno || 'Profil'} má teď odznak ověření.`, 'success'); zavrit() },
            onError: (e) => toast('Nepovedlo se', e.message, 'error'),
          })}
        >
          Ověřit
        </Button>
      </div>
    </Modal>
  )
}

function ZrusitModal({ r, zavrit }: { r: Remeslnik; zavrit: () => void }) {
  const toast = useToast()
  const zrusit = useZrusitOvereni()
  const [duvod, setDuvod] = useState('')
  return (
    <Modal otevreno zavrit={zavrit} nadpis={`Zrušit ověření: ${r.jmeno || 'řemeslník'}`}>
      <Input label="Proč ověření rušíš?" value={duvod} onChange={(e) => setDuvod(e.target.value)} napoveda="Zapíše se do záznamů." />
      <div className="mt-6 flex gap-2">
        <Button varianta="secondary" onClick={zavrit} className="flex-1">Zpět</Button>
        <Button
          varianta="danger"
          className="flex-1"
          loading={zrusit.isPending}
          onClick={() => zrusit.mutate({ id: r.uzivatel_id, duvod }, {
            onSuccess: () => { toast('Ověření zrušeno', 'Odznak byl odebrán.', 'info'); zavrit() },
            onError: (e) => toast('Nepovedlo se', e.message, 'error'),
          })}
        >
          Zrušit ověření
        </Button>
      </div>
    </Modal>
  )
}

function Remeslnici() {
  const dotaz = useRemeslnici(true)
  const [overit, setOverit] = useState<Remeslnik | null>(null)
  const [zrusit, setZrusit] = useState<Remeslnik | null>(null)
  return (
    <Stav dotaz={dotaz}>
      {(data) => (
        <>
          <Tabulka hlavicky={['Řemeslník', 'IČO', 'Stav', 'Nabídek', 'Registrace', '']} prazdna={!data.length}>
            {data.map((r) => (
              <tr key={r.uzivatel_id}>
                <td><p className="font-semibold">{r.jmeno || 'Bez jména'}</p><p className="text-xs text-muted">{r.email}</p></td>
                <td className="tabular-nums">{r.ico || '—'}</td>
                <td>{r.overeno ? <Badge ton="success">Ověřen</Badge> : <Badge ton="accent">Čeká</Badge>}</td>
                <td className="tabular-nums">{r.zakazek || 0}</td>
                <td className="whitespace-nowrap text-xs text-muted">{datum(r.registrovan)}</td>
                <td className="text-right">
                  {r.overeno ? (
                    <button type="button" onClick={() => setZrusit(r)} className="whitespace-nowrap text-xs font-semibold text-muted hover:text-danger-text">Zrušit ověření</button>
                  ) : (
                    <Button velikost="sm" onClick={() => setOverit(r)}>Ověřit</Button>
                  )}
                </td>
              </tr>
            ))}
          </Tabulka>
          {overit && <OveritModal r={overit} zavrit={() => setOverit(null)} />}
          {zrusit && <ZrusitModal r={zrusit} zavrit={() => setZrusit(null)} />}
        </>
      )}
    </Stav>
  )
}

const STAV_POPTAVKY: Record<string, { text: string; ton: Ton }> = {
  waiting: { text: 'Čeká', ton: 'accent' },
  active: { text: 'Běží', ton: 'info' },
  done: { text: 'Hotovo', ton: 'success' },
  completed: { text: 'Hotovo', ton: 'success' },
  cancelled: { text: 'Zrušeno', ton: 'muted' },
}

function Poptavky() {
  const dotaz = usePoptavky(true)
  return (
    <Stav dotaz={dotaz}>
      {(data) => (
        <Tabulka hlavicky={['Poptávka', 'Stav', 'Zákazník', 'Řemeslník', 'Nabídek', 'Vytvořeno']} prazdna={!data.length}>
          {data.map((r, i) => {
            const s = STAV_POPTAVKY[r.stav] ?? { text: r.stav, ton: 'neutral' as Ton }
            return (
              <tr key={i}>
                <td><p className="max-w-xs truncate font-semibold">{r.nazev}</p><p className="text-xs text-muted">{r.kategorie} · {r.mesto || '—'}</p></td>
                <td><Badge ton={s.ton}>{s.text}</Badge></td>
                <td>{r.zakaznik || '—'}</td>
                <td>{r.remeslnik || '—'}</td>
                <td className={`tabular-nums ${Number(r.nabidek) === 0 ? 'font-semibold text-danger-text' : ''}`}>{r.nabidek || 0}</td>
                <td className="whitespace-nowrap text-xs text-muted">{datum(r.vytvoreno)}</td>
              </tr>
            )
          })}
        </Tabulka>
      )}
    </Stav>
  )
}

function Uzivatele() {
  const dotaz = useUzivatele(true)
  return (
    <Stav dotaz={dotaz}>
      {(data) => (
        <Tabulka hlavicky={['Uživatel', 'Role', 'Poptávek', 'Nabídek', 'Registrace', 'Naposledy']} prazdna={!data.length}>
          {data.map((u, i) => (
            <tr key={i}>
              <td><p className="font-semibold">{u.jmeno || 'Bez jména'}</p><p className="text-xs text-muted">{u.email}</p></td>
              <td>{u.role === 'craftsman' ? 'Řemeslník' : 'Zákazník'}{u.overeno && <CheckCircle2 className="ml-1 inline size-3.5 text-success-text" aria-label="ověřen" />}</td>
              <td className="tabular-nums">{u.poptavek || 0}</td>
              <td className="tabular-nums">{u.nabidek || 0}</td>
              <td className="whitespace-nowrap text-xs text-muted">{datum(u.registrovan)}</td>
              <td className="whitespace-nowrap text-xs text-muted">{datum(u.posledni_prihlaseni)}</td>
            </tr>
          ))}
        </Tabulka>
      )}
    </Stav>
  )
}

function Cisla() {
  const dotaz = useCisla(true)
  return (
    <Stav dotaz={dotaz}>
      {(data) => (
        <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
          {data.map((x) => (
            <div key={x.ukazatel} className="rounded-[12px] border border-line bg-bg px-4 py-3.5">
              <p className="text-[13px] text-muted">{x.ukazatel}</p>
              <p className="text-2xl font-semibold tabular-nums">{x.hodnota}</p>
            </div>
          ))}
        </div>
      )}
    </Stav>
  )
}

function KartaHlaseni({ h }: { h: Hlaseni }) {
  const toast = useToast()
  const stav = useHlaseniStav()
  const poznamka = useHlaseniPoznamka()
  const [text, setText] = useState(h.poznamka ?? '')
  let kde = h.url || '—'
  try { if (h.url) { const u = new URL(h.url); kde = u.pathname + u.search } } catch { /* necháme, jak je */ }

  return (
    <div className={`flex flex-col gap-3 border-b border-line px-5 py-4 last:border-0 ${h.vyreseno ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {h.vyreseno ? <Badge ton="muted">Vyřešeno</Badge> : <Badge ton="accent">Otevřené</Badge>}
        <span>{datum(h.vytvoreno)}</span>
        <span>#{h.id}</span>
      </div>
      {/* Text píše kdokoliv – vždy jako text, nikdy jako HTML (React escapuje sám). */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{h.text}</p>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>{h.jmeno || 'Nepřihlášený'}</span>
        {h.email ? <a href={`mailto:${h.email}`} className="text-accent-text hover:underline">{h.email}</a> : <span>bez kontaktu</span>}
        <span>{kde}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Interní poznámka…"
          aria-label="Interní poznámka"
          className="h-9 min-w-[200px] flex-1 rounded-[10px] border border-line-strong bg-surface px-3 text-sm outline-none focus:border-accent"
        />
        <Button
          varianta="secondary"
          velikost="sm"
          loading={poznamka.isPending}
          onClick={() => poznamka.mutate({ id: h.id, text }, { onSuccess: () => toast('Poznámka uložena', undefined, 'success'), onError: (e) => toast('Nepovedlo se', e.message, 'error') })}
        >
          Uložit
        </Button>
        <Button
          varianta={h.vyreseno ? 'secondary' : 'primary'}
          velikost="sm"
          loading={stav.isPending}
          onClick={() => stav.mutate({ id: h.id, vyreseno: !h.vyreseno }, { onError: (e) => toast('Nepovedlo se', e.message, 'error') })}
        >
          {h.vyreseno ? 'Znovu otevřít' : 'Označit vyřešené'}
        </Button>
      </div>
    </div>
  )
}

function HlaseniSeznam() {
  const dotaz = useHlaseni(true)
  return (
    <Stav dotaz={dotaz}>
      {(data) => {
        const otevrena = data.filter((h) => !h.vyreseno)
        const vyresena = data.filter((h) => h.vyreseno)
        return (
          <>
            {otevrena.length ? otevrena.map((h) => <KartaHlaseni key={h.id} h={h} />) : <p className="py-8 text-center text-sm text-muted">Žádné otevřené hlášení.</p>}
            {vyresena.length > 0 && (
              <>
                <h3 className="border-y border-line bg-bg px-5 py-2.5 text-sm font-semibold">Vyřešená ({vyresena.length})</h3>
                {vyresena.map((h) => <KartaHlaseni key={h.id} h={h} />)}
              </>
            )}
          </>
        )
      }}
    </Stav>
  )
}

function Audit() {
  const dotaz = useAudit(true)
  return (
    <Stav dotaz={dotaz}>
      {(data) => (
        <Tabulka hlavicky={['Kdy', 'Událost', 'Kdo', 'Podrobnosti']} prazdna={!data.length}>
          {data.map((z, i) => (
            <tr key={i}>
              <td className="whitespace-nowrap text-xs text-muted">{datum(z.cas)}</td>
              <td className="font-semibold">{z.udalost}</td>
              <td>{z.uzivatel || '—'}</td>
              <td className="max-w-md break-all font-mono text-xs text-muted">{JSON.stringify(z.detail ?? {})}</td>
            </tr>
          ))}
        </Tabulka>
      )}
    </Stav>
  )
}

function PozornostBox() {
  const { data, isSuccess } = usePozornost()
  if (!isSuccess) return null
  const dulezite = (data ?? []).filter((x) => Number(x.pocet) > 0)
  if (!dulezite.length)
    return (
      <p className="flex items-center gap-2 rounded-[12px] border border-success-soft bg-success-soft px-4 py-3 text-sm font-semibold text-success-text">
        <CheckCircle2 className="size-4" aria-hidden />Nic nečeká na zásah.
      </p>
    )
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {dulezite.map((x) => (
        <div key={x.typ} className="rounded-[12px] border border-accent/30 bg-accent-soft px-4 py-3.5">
          <p className="flex items-baseline gap-2">
            <AlertTriangle className="size-4 self-center text-accent-text" aria-hidden />
            <span className="text-2xl font-semibold tabular-nums text-accent-soft-text">{x.pocet}</span>
            <span className="text-sm font-semibold">{x.typ}</span>
          </p>
          <p className="mt-1 text-xs text-soft">{x.popis}</p>
        </div>
      ))}
    </div>
  )
}

export function Sprava() {
  const admin = useJeAdmin()
  const [tab, setTab] = useState<Zalozka>('remeslnici')
  if (admin.isPending) return <NacitaniStranky />
  if (!admin.data) return <Navigate to="/" replace />

  return (
    <Stranka nadpis="Správa" sirka="siroka">
      <div className="flex flex-col gap-5">
        <PozornostBox />
        <div role="tablist" aria-label="Části správy" className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
          {ZALOZKY.map((z) => (
            <button
              key={z.id}
              role="tab"
              aria-selected={tab === z.id}
              onClick={() => setTab(z.id)}
              className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm transition-colors ${tab === z.id ? 'border-accent font-semibold text-ink' : 'border-transparent font-medium text-soft hover:text-ink'}`}
            >
              {z.text}
            </button>
          ))}
        </div>
        <Card className="overflow-hidden">
          {tab === 'remeslnici' && <Remeslnici />}
          {tab === 'cisla' && <Cisla />}
          {tab === 'poptavky' && <Poptavky />}
          {tab === 'uzivatele' && <Uzivatele />}
          {tab === 'hlaseni' && <HlaseniSeznam />}
          {tab === 'audit' && <Audit />}
        </Card>
      </div>
    </Stranka>
  )
}

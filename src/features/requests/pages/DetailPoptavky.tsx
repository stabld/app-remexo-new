import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { Fotky } from '@/components/Fotky'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useToast } from '@/components/Toast'
import { rozlozPopis } from '@/lib/popis'
import { formatDatumCas, relativniCas } from '@/lib/cas'
import {
  useDetailPoptavky, useOdmitnoutNabidku, usePotvrditDokonceni, usePrijmoutNabidku, useSmazatPoptavku, type NabidkaVDetailu,
} from '../api'
import { krokPrubehu, lokalita, sklonujNabidky, type ZobrazenyStav } from '../model'
import { StavBadge } from '../components/StavBadge'
import { NabidkaKarta } from '../components/NabidkaKarta'
import { OdmitnutiModal } from '../components/OdmitnutiModal'
import { HodnoceniModal } from '../components/HodnoceniModal'

const CO_TED: Record<ZobrazenyStav, string> = {
  'ceka-na-nabidky': 'Poptávka je na tržišti. Jakmile řemeslník pošle nabídku, dáme ti vědět e-mailem. Pomůže doplnit fotku nebo termín.',
  'nove-nabidky': 'Vyber jednu nabídku. Po přijetí uvidíte navzájem telefon a adresu a otevře se chat. Ostatní nabídky se uzavřou.',
  realizace: 'Řemeslník na zakázce pracuje. Domluvte se v chatu. Až nahlásí dokončení, potvrdíš ho a ohodnotíš.',
  'ceka-na-potvrzeni': 'Řemeslník hlásí, že je hotovo. Zkontroluj práci, potvrď dokončení a ohodnoť ho.',
  hotovo: 'Zakázka je dokončená. Díky za hodnocení, pomáhá dalším zákazníkům.',
  zruseno: 'Poptávka je zrušená a řemeslníci ji už nevidí.',
}

export function DetailPoptavky() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isLoading, isError } = useDetailPoptavky(id)
  const prijmout = usePrijmoutNabidku()
  const odmitnout = useOdmitnoutNabidku()
  const potvrdit = usePotvrditDokonceni()
  const smazat = useSmazatPoptavku()

  const [keOdmitnuti, setKeOdmitnuti] = useState<NabidkaVDetailu | null>(null)
  const [hodnotit, setHodnotit] = useState(false)
  const [mazat, setMazat] = useState(false)

  if (isLoading) return <Stranka nadpis="Poptávka" drobecky={[{ nazev: 'Moje poptávky', cesta: '/poptavky' }]}><NacitaniStranky /></Stranka>
  if (isError || !data)
    return (
      <Stranka nadpis="Poptávka" drobecky={[{ nazev: 'Moje poptávky', cesta: '/poptavky' }]}>
        <p className="text-muted">Tuhle poptávku jsme nenašli. Možná byla smazaná.</p>
        <ButtonLink to="/poptavky" varianta="secondary" className="mt-4">Zpět na poptávky</ButtonLink>
      </Stranka>
    )

  const { poptavka: p, stav, nabidky } = data
  const popis = rozlozPopis(p.description)
  const misto = lokalita(p, popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota)
  const lzeRozhodnout = p.status === 'waiting'
  const nazev = p.title || 'Poptávka'

  const historie = [
    { kdy: p.created_at, text: 'Poptávka zveřejněná na tržišti', nova: false },
    ...nabidky.map((n) => ({ kdy: n.created_at, text: `Nová nabídka: ${n.craftsman_name || 'řemeslník'}`, nova: n.status === 'pending' })),
    ...(typeof p.dokonceni_navrzeno === 'string' ? [{ kdy: p.dokonceni_navrzeno, text: `Hlásí hotovo: ${p.craftsman_name || 'řemeslník'}`, nova: stav === 'ceka-na-potvrzeni' }] : []),
  ].sort((a, b) => b.kdy.localeCompare(a.kdy))

  const naPrijeti = (n: NabidkaVDetailu) =>
    prijmout.mutate(n, {
      onSuccess: () => toast(`Nabídka přijata`, `${n.craftsman_name || 'Řemeslník'} dostane zprávu. Teď se můžete domluvit v chatu.`, 'success'),
      onError: (e) => toast('Nabídku se nepodařilo přijmout', e.message, 'error'),
    })

  return (
    <Stranka nadpis={nazev} drobecky={[{ nazev: 'Moje poptávky', cesta: '/poptavky' }]} sirka="siroka" nadpisNaMobilu={false}>
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-7">
          <section className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[26px] font-semibold tracking-tight">{nazev}</h2>
              <StavBadge stav={stav} />
            </div>
            <p className="flex flex-wrap gap-x-[18px] gap-y-1 text-sm text-muted">
              {misto && <span className="inline-flex items-center gap-1.5"><MapPin className="size-[15px]" aria-hidden />{misto}</span>}
              <span className="inline-flex items-center gap-1.5"><Calendar className="size-[15px]" aria-hidden />Zadáno {formatDatumCas(p.created_at)}</span>
              {p.category && <span>{p.category}</span>}
            </p>
            {stav !== 'zruseno' && (
              <Card className="px-5 py-[18px]"><ProgressSteps aktualni={krokPrubehu(stav)} velke /></Card>
            )}
          </section>

          {(nabidky.length > 0 || p.status === 'waiting') && (
            <section className="flex flex-col gap-3.5" aria-labelledby="nabidky">
              <div className="flex items-baseline gap-2.5">
                <h3 id="nabidky" className="text-lg font-semibold">Nabídky</h3>
                {nabidky.length > 0 && <span className="text-sm text-muted">{nabidky.length} {sklonujNabidky(nabidky.length)} od řemeslníků z okolí</span>}
              </div>
              {nabidky.length ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                  {nabidky.map((n) => (
                    <NabidkaKarta
                      key={n.id}
                      nabidka={n}
                      lzeRozhodnout={lzeRozhodnout && n.status === 'pending'}
                      pracuji={prijmout.isPending && prijmout.variables?.id === n.id}
                      onPrijmout={() => naPrijeti(n)}
                      onOdmitnout={() => setKeOdmitnuti(n)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-5 text-sm text-muted">Zatím žádná nabídka. Řemeslníci z okolí poptávku vidí na tržišti.</Card>
              )}
            </section>
          )}

          <section className="flex flex-col gap-3.5" aria-labelledby="zadani">
            <h3 id="zadani" className="text-lg font-semibold">Zadání</h3>
            <Card className="flex flex-col gap-[18px] p-5">
              <Fotky soubory={popis.soubory} stare={popis.stareFotky} />
              <p className="max-w-[68ch] whitespace-pre-line">{popis.hlavni}</p>
              {popis.fakta.length > 0 && (
                <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5 border-t border-line pt-4">
                  {popis.fakta.map((f, i) => (
                    <div key={i}>
                      <dt className="text-xs text-muted">{f.popisek}</dt>
                      <dd className="text-sm font-medium">{f.hodnota}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Card>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-5">
          <Card className="flex flex-col gap-2 p-5">
            <h3 className="text-[15px] font-semibold">Co teď</h3>
            <p className="text-sm text-soft">{CO_TED[stav]}</p>
            {stav === 'ceka-na-potvrzeni' && <Button onClick={() => setHodnotit(true)} className="mt-2 self-start">Potvrdit a ohodnotit</Button>}
            {(p.status === 'active') && <ButtonLink to="/zpravy" varianta="secondary" className="mt-2 self-start">Otevřít chat</ButtonLink>}
          </Card>

          <Card className="flex flex-col gap-3.5 p-5">
            <h3 className="text-[15px] font-semibold">Historie</h3>
            <ol className="flex flex-col gap-3.5 text-sm">
              {historie.map((u, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className={`mt-[7px] size-2 shrink-0 rounded-full ${u.nova ? 'bg-accent' : 'bg-line-strong'}`} aria-hidden />
                  <span className={u.nova ? '' : 'text-soft'}>{u.text}<span className="block text-xs text-faint">{relativniCas(u.kdy)}</span></span>
                </li>
              ))}
            </ol>
          </Card>

          {p.status === 'waiting' && (
            <Card className="flex flex-col p-2">
              <button onClick={() => setMazat(true)} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger-text hover:bg-surface-2">Smazat poptávku</button>
            </Card>
          )}
        </aside>
      </div>

      <OdmitnutiModal
        key={keOdmitnuti?.id}
        otevreno={!!keOdmitnuti}
        zavrit={() => setKeOdmitnuti(null)}
        pracuji={odmitnout.isPending}
        potvrdit={(duvod) =>
          keOdmitnuti &&
          odmitnout.mutate(
            { id: keOdmitnuti.id, requestId: p.id, duvod },
            {
              onSuccess: () => { toast('Nabídka odmítnuta', 'Řemeslník uvidí důvod.', 'info'); setKeOdmitnuti(null) },
              onError: (e) => toast('Nabídku se nepodařilo odmítnout', e.message, 'error'),
            },
          )
        }
      />

      <HodnoceniModal
        otevreno={hodnotit}
        zavrit={() => setHodnotit(false)}
        remeslnik={p.craftsman_name || 'řemeslník'}
        pracuji={potvrdit.isPending}
        potvrdit={(hvezdicky, komentar) =>
          potvrdit.mutate(
            { requestId: p.id, hvezdicky, komentar },
            {
              onSuccess: () => { toast('Hotovo', 'Děkujeme za hodnocení, pomůže ostatním zákazníkům.', 'success'); setHodnotit(false) },
              onError: (e) => toast('Nepodařilo se dokončit', e.message, 'error'),
            },
          )
        }
      />

      <Modal otevreno={mazat} zavrit={() => setMazat(false)} nadpis="Smazat poptávku?">
        <p className="text-sm text-muted">„{nazev}“ zmizí z tržiště i s fotkami a nabídkami. Tohle nejde vrátit.</p>
        <div className="mt-6 flex gap-2">
          <Button varianta="secondary" onClick={() => setMazat(false)} className="flex-1">Nechat</Button>
          <Button
            varianta="danger"
            className="flex-1"
            loading={smazat.isPending}
            onClick={() =>
              smazat.mutate(p, {
                onSuccess: () => { toast('Poptávka smazána'); navigate('/poptavky') },
                onError: (e) => { toast('Poptávku nelze smazat', e.message, 'error'); setMazat(false) },
              })
            }
          >
            Smazat
          </Button>
        </div>
      </Modal>
    </Stranka>
  )
}

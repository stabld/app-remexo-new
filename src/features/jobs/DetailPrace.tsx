import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { LogOut, MapPin, MessageSquare, Phone } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Fotky } from '@/components/Fotky'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useToast } from '@/components/Toast'
import { rozlozPopis } from '@/lib/popis'
import { formatDatumCas } from '@/lib/cas'
import { useMojePrace, useOdstoupit } from './api'
import { DalsiKrok, StavPraceBadge } from './DalsiKrok'

const DROBECKY = [{ nazev: 'Moje zakázky', cesta: '/zakazky' }]

function Odstoupit({ requestId }: { requestId: number }) {
  const toast = useToast()
  const navigate = useNavigate()
  const odstoupit = useOdstoupit()
  const [otevreno, setOtevreno] = useState(false)
  const [duvod, setDuvod] = useState('')
  return (
    <>
      <button type="button" onClick={() => setOtevreno(true)} className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-danger-text">
        <LogOut className="size-4" aria-hidden />Odstoupit ze zakázky
      </button>
      <Modal otevreno={otevreno} zavrit={() => setOtevreno(false)} nadpis="Odstoupit ze zakázky?">
        <p className="mb-4 text-sm text-soft">Zakázka se vrátí na tržiště, aby si zákazník mohl vybrat někoho jiného. Tvoje nabídka se zruší.</p>
        <Textarea label="Důvod pro zákazníka" rows={3} value={duvod} onChange={(e) => setDuvod(e.target.value)} placeholder="Např. onemocněl jsem, nestihnu termín…" napoveda="Nepovinné, ale zákazník to ocení." />
        <div className="mt-6 flex gap-2">
          <Button varianta="secondary" onClick={() => setOtevreno(false)} className="flex-1">Zpět</Button>
          <Button
            varianta="danger"
            className="flex-1"
            loading={odstoupit.isPending}
            onClick={() => odstoupit.mutate({ requestId, duvod }, {
              onSuccess: () => {
                toast('Odstoupil jsi ze zakázky', duvod.trim() ? 'Zákazník uvidí tvůj důvod a vybere si jiného řemeslníka.' : 'Zakázka je zpět na tržišti.', 'info')
                navigate('/zakazky')
              },
              onError: (e) => toast('Nepodařilo se odstoupit', e.message, 'error'),
            })}
          >
            Odstoupit
          </Button>
        </div>
      </Modal>
    </>
  )
}

export function DetailPrace() {
  const id = Number(useParams().id)
  const { data, isPending, isError } = useMojePrace()

  if (isPending) return <Stranka nadpis="Zakázka" drobecky={DROBECKY}><NacitaniStranky /></Stranka>
  const p = data?.find((x) => x.requestId === id)
  // Nabídka, o které se ještě nerozhodlo, má svůj detail na tržišti.
  if (p && (p.druh === 'ceka' || p.druh === 'odmitnuta')) return <Navigate to={`/trziste/${id}`} replace />
  if (isError || !p)
    return (
      <Stranka nadpis="Zakázka" drobecky={DROBECKY} sirka="uzka">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Zakázku jsme nenašli</h2>
          <p className="mt-1 text-sm text-muted">Možná jsi z ní odstoupil, nebo patří jinému řemeslníkovi.</p>
          <ButtonLink to="/zakazky" varianta="secondary" className="mt-4">Moje zakázky</ButtonLink>
        </Card>
      </Stranka>
    )

  const popis = rozlozPopis(p.popis)
  const fakta = popis.fakta.filter((f) => f.popisek !== 'Telefon' && f.popisek !== 'Místo')
  const adresa = [p.kontakt?.ulice, p.kontakt?.mesto].filter(Boolean).join(', ') || popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota
  const telefon = p.kontakt?.telefon || popis.fakta.find((f) => f.popisek === 'Telefon')?.hodnota
  const aktivni = p.druh === 'aktivni'
  const kontaktVidet = p.druh !== 'zrusena'

  return (
    <Stranka nadpis={p.titulek} drobecky={DROBECKY} sirka="siroka" nadpisNaMobilu={false}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-[2] flex-col gap-6">
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight lg:text-[26px]">{p.titulek}</h1>
              <StavPraceBadge p={p} />
            </div>
            <p className="text-sm text-muted">{[p.kategorie, `nabídka odeslána ${formatDatumCas(p.odeslano)}`].filter(Boolean).join(' · ')}</p>
          </section>

          {kontaktVidet && (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="text-base font-semibold">Zákazník</h2>
              <p className="text-[15px] font-medium">{p.zakaznik}</p>
              <div className="flex flex-wrap gap-2">
                {telefon && (
                  <a href={`tel:${telefon.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 rounded-[10px] border border-line-strong px-3 py-2 text-sm font-medium hover:bg-surface-2">
                    <Phone className="size-4 text-muted" aria-hidden />{telefon}
                  </a>
                )}
                {adresa && (
                  <a
                    href={`https://mapy.cz/zakladni?q=${encodeURIComponent(adresa)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-[10px] border border-line-strong px-3 py-2 text-sm font-medium hover:bg-surface-2"
                  >
                    <MapPin className="size-4 text-muted" aria-hidden />{adresa}
                  </a>
                )}
              </div>
            </Card>
          )}

          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-base font-semibold">Zadání</h2>
            <p className="max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed">{popis.hlavni || 'Zákazník nepřidal popis.'}</p>
            {fakta.length > 0 && (
              <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 border-t border-line pt-4">
                {fakta.map((f) => (
                  <div key={f.popisek + f.hodnota}>
                    <dt className="text-xs text-muted">{f.popisek}</dt>
                    <dd className="text-sm font-medium">{f.hodnota}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Fotky soubory={popis.soubory} stare={popis.stareFotky} />
        </div>

        <aside className="flex w-full min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-24 lg:max-w-[380px]">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">Tvoje nabídka</h2>
              <span className="text-lg font-semibold tabular-nums">{p.cena || 'Dohodou'}</span>
            </div>
            {p.zprava && <p className="whitespace-pre-line text-sm text-soft">{p.zprava}</p>}
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{p.druh === 'hotovo' ? 'Hodnocení' : p.druh === 'zrusena' ? 'Zákazník zakázku zrušil' : 'Další krok'}</p>
              <DalsiKrok p={p} chat={false} />
            </div>
            {aktivni && (
              <ButtonLink to={`/zpravy/${p.requestId}`} varianta="secondary">
                <MessageSquare className="size-4" aria-hidden />Napsat zákazníkovi
              </ButtonLink>
            )}
          </Card>
          {aktivni && !p.dokonceniNavrzeno && <div className="px-1"><Odstoupit requestId={p.requestId} /></div>}
        </aside>
      </div>
    </Stranka>
  )
}

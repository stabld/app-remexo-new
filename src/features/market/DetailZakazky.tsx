import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Clock, MapPin, ShieldCheck, Tag, User } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Fotky } from '@/components/Fotky'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useToast } from '@/components/Toast'
import { rozlozPopis } from '@/lib/popis'
import { stariPoptavky } from '@/lib/cas'
import type { Poptavka } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'
import { chybiVProfilu } from '@/features/profile/api'
import {
  MAX_POKUSU, NabidkaChyba, muzeNabidnout, useMojeNabidkyMapa, useOdeslatNabidku, usePolohaRemeslnika, useZakazka,
  type MojeNabidkaKPoptavce,
} from './api'
import { DUVOD_PRO_REMESLNIKA, formatKm, rozpocet, specha, vzdalenost } from './model'

const DROBECKY = [{ nazev: 'Tržiště', cesta: '/trziste' }]

/** „1500“ → „1 500 Kč“. Jiný text (Dohodou, 800–1 200 Kč) necháme, jak je – v DB je cena volný text. */
function upravCenu(t: string) {
  const s = t.trim()
  if (/^\d[\d\s]*$/.test(s)) return `${Number(s.replace(/\s/g, '')).toLocaleString('cs')} Kč`
  return s
}

const krestni = (jmeno: string | null) => (jmeno ?? '').trim().split(/\s+/)[0] || ''

function FormularNabidky({ z, moje }: { z: Poptavka; moje?: MojeNabidkaKPoptavce }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const odeslat = useOdeslatNabidku()
  const popis = rozlozPopis(z.description, true)
  const odhad = rozpocet(z, popis.fakta.find((f) => f.popisek === 'Rozpočet')?.hodnota)
  const komu = krestni(z.customer_name)

  const [cena, setCena] = useState(odhad ?? '')
  const [kdy, setKdy] = useState('')
  const [zprava, setZprava] = useState('')
  const [chyba, setChyba] = useState('')

  const chybi = chybiVProfilu(user)
  const opakovani = moje?.stav === 'rejected'
  const posledni = opakovani && moje.pokusy + 1 >= MAX_POKUSU

  const potvrdit = (e: FormEvent) => {
    e.preventDefault()
    if (!zprava.trim()) return setChyba('Napiš zákazníkovi aspoň krátkou zprávu.')
    const text = zprava.trim() + (kdy.trim() ? `\n\nKdy můžu přijít: ${kdy.trim()}` : '')
    odeslat.mutate(
      { poptavkaId: z.id, cena: upravCenu(cena), zprava: text, predchozi: moje },
      {
        onSuccess: () => {
          toast('Nabídka odeslána', 'Jakmile ji zákazník přijme, otevře se vám chat.', 'success')
          navigate('/nabidky')
        },
        onError: (e) => {
          if (e instanceof NabidkaChyba) {
            toast('Nabídku nejde poslat', e.message, 'info')
            if (e.druh === 'neni' || e.druh === 'obsazeno' || e.druh === 'zamitnuto') navigate('/trziste')
          } else toast('Nabídku se nepodařilo odeslat', e.message, 'error')
        },
      },
    )
  }

  if (chybi.length)
    return (
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg font-semibold">Tvoje nabídka</h2>
        <p className="text-sm text-soft">Než pošleš nabídku, doplň v profilu {chybi.join(', ')}. Zákazník podle toho pozná, s kým jedná.</p>
        <ButtonLink to="/profil">Doplnit profil</ButtonLink>
      </Card>
    )

  return (
    <form onSubmit={potvrdit} noValidate>
      <Card className="flex flex-col gap-4 p-5 shadow-raised">
        <h2 className="text-lg font-semibold">{opakovani ? 'Opravená nabídka' : 'Tvoje nabídka'}</h2>
        {opakovani && (
          <p className="rounded-[10px] bg-accent-soft px-3.5 py-3 text-sm text-accent-soft-text">
            <span className="font-semibold">
              Předchozí nabídku zákazník odmítl{moje.duvod && DUVOD_PRO_REMESLNIKA[moje.duvod] ? `, protože ${DUVOD_PRO_REMESLNIKA[moje.duvod]}` : ''}.
            </span>{' '}
            {posledni ? 'Tohle je tvůj poslední pokus.' : 'Můžeš poslat opravenou.'}
          </p>
        )}
        <Input
          label="Cena"
          value={cena}
          onChange={(e) => setCena(e.target.value)}
          placeholder="např. 1 500 Kč"
          napoveda={odhad ? `Zákazník počítá s: ${odhad}. Prázdné pole = dohodou.` : 'Odhad včetně materiálu. Prázdné pole = dohodou.'}
        />
        <Input label="Kdy můžeš přijít" value={kdy} onChange={(e) => setKdy(e.target.value)} placeholder="např. zítra odpoledne" napoveda="Nepovinné." />
        <Textarea
          label="Zpráva pro zákazníka"
          rows={4}
          value={zprava}
          onChange={(e) => { setZprava(e.target.value); setChyba('') }}
          placeholder="Krátce, jak to vyřešíš a co s sebou vezmeš."
          chyba={chyba}
          napoveda={komu ? `Uvidí ji ${komu} spolu s cenou.` : undefined}
        />
        <Button type="submit" velikost="lg" loading={odeslat.isPending}>Odeslat nabídku</Button>
        <p className="text-[13px] text-muted">
          K jedné zakázce můžeš poslat nejvýš {MAX_POKUSU} nabídky. Když zákazník první odmítne, můžeš ji jednou upravit.
        </p>
      </Card>
    </form>
  )
}

function StavNabidky({ moje, id }: { moje: MojeNabidkaKPoptavce; id: number }) {
  const ceka = moje.stav === 'pending'
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-lg font-semibold">{ceka ? 'Nabídka odeslána' : moje.stav === 'accepted' ? 'Zakázka je tvoje' : 'Nabídka odmítnuta'}</h2>
      <p className="text-sm text-soft">
        {ceka
          ? 'Zákazník ji teď vidí. Jakmile ji přijme, ukáže se ti telefon a adresa a otevře se chat.'
          : moje.stav === 'accepted'
            ? 'Zákazník tvoji nabídku přijal. Domluvte se v chatu.'
            : `Zákazník nabídku odmítl${moje.duvod && DUVOD_PRO_REMESLNIKA[moje.duvod] ? `, protože ${DUVOD_PRO_REMESLNIKA[moje.duvod]}` : ''}. Další už u téhle zakázky poslat nejde.`}
      </p>
      <ButtonLink to={moje.stav === 'accepted' ? `/zakazky/${id}` : '/nabidky'} varianta="secondary">
        {moje.stav === 'accepted' ? 'Otevřít zakázku' : 'Moje nabídky'}
      </ButtonLink>
    </Card>
  )
}

export function DetailZakazky() {
  const id = Number(useParams().id)
  const { user } = useAuth()
  const { data: z, isPending, isError } = useZakazka(id)
  const moje = useMojeNabidkyMapa()
  const poloha = usePolohaRemeslnika()

  if (isPending || moje.isPending) return <Stranka nadpis="Zakázka" drobecky={DROBECKY}><NacitaniStranky /></Stranka>

  const mojeNabidka = moje.data?.get(id)
  if (isError || !z || (z.status !== 'waiting' && mojeNabidka?.stav !== 'accepted'))
    return (
      <Stranka nadpis="Zakázka" drobecky={DROBECKY} sirka="uzka">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Zakázka už není volná</h2>
          <p className="mt-1 text-sm text-muted">Zákazník si mezitím vybral jiného řemeslníka, nebo poptávku smazal.</p>
          <ButtonLink to="/trziste" varianta="secondary" className="mt-4">Zpět na tržiště</ButtonLink>
        </Card>
      </Stranka>
    )

  const popis = rozlozPopis(z.description, true)
  const misto = z.mesto || popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota
  const km = formatKm(vzdalenost(z, poloha.data))
  const stari = stariPoptavky(z.created_at)
  const fakta = popis.fakta.filter((f) => f.popisek !== 'Místo')
  const nazev = z.title || 'Poptávka'
  const vlastni = z.customer_id === user?.id

  return (
    <Stranka nadpis={nazev} drobecky={DROBECKY} sirka="siroka" nadpisNaMobilu={false}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-[2] flex-col gap-6">
          <section className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight lg:text-[26px]">{nazev}</h1>
              {specha(z) && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-soft-text">Spěchá</span>}
            </div>
            <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
              {misto && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden />{misto}{km && <>, <b className="font-semibold text-ink">{km} od tebe</b></>}
                </span>
              )}
              {stari && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />Zadáno {stari.text}</span>}
              {z.category && <span className="inline-flex items-center gap-1.5"><Tag className="size-4" aria-hidden />{z.category}</span>}
              {z.customer_name && <span className="inline-flex items-center gap-1.5"><User className="size-4" aria-hidden />{krestni(z.customer_name)}</span>}
            </p>
          </section>

          <Fotky soubory={popis.soubory} stare={popis.stareFotky} />

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

          <p className="flex items-start gap-2.5 text-sm text-soft">
            <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-muted" aria-hidden />
            Telefon a přesnou adresu uvidíš, až zákazník tvoji nabídku přijme.
          </p>
        </div>

        <aside className="w-full min-w-0 flex-1 lg:sticky lg:top-24 lg:max-w-[380px]">
          {vlastni ? (
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Tohle je tvoje poptávka</h2>
              <p className="mt-1 text-sm text-muted">Nabídku jí může poslat jen jiný řemeslník.</p>
            </Card>
          ) : mojeNabidka && !muzeNabidnout(mojeNabidka) ? (
            <StavNabidky moje={mojeNabidka} id={z.id} />
          ) : (
            <FormularNabidky z={z} moje={mojeNabidka} />
          )}
          <Link to="/trziste" className="mt-4 hidden text-sm font-medium text-muted hover:text-ink lg:inline-block">← Zpět na tržiště</Link>
        </aside>
      </div>
    </Stranka>
  )
}

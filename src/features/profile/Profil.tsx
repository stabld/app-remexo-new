import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ChevronRight, LogOut, Palette, Repeat2, ShieldCheck } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type Ton } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { zkontrolujHeslo } from '@/features/auth/heslo'
import { ROLE_LABEL } from '@/lib/types'
import {
  chybiVProfilu, cisteIco, cistyTelefon, stavOvereni, TELEFON,
  useNahratFotku, useSoukromyProfil, useUlozitProfil, useZmenitHeslo,
  type SoukromyProfil, type StavOvereni,
} from './api'

/** Sekce nastavení: popis vlevo, pole vpravo. Na mobilu pod sebou. */
function Sekce({ nadpis, popis, children }: { nadpis: string; popis?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line px-5 py-6 first:border-t-0 md:grid-cols-[220px_1fr] md:gap-8 md:px-6">
      <div>
        <h2 className="text-[15px] font-semibold">{nadpis}</h2>
        {popis && <p className="mt-1 text-[13px] leading-relaxed text-muted">{popis}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  )
}

const OVERENI: Record<StavOvereni, { text: string; ton: Ton; popis: string }> = {
  overeno: { text: 'Ověřeno', ton: 'success', popis: 'Živnostenské oprávnění jsme zkontrolovali. Zákazníci u tebe vidí odznak.' },
  ceka: { text: 'Čeká na kontrolu', ton: 'accent', popis: 'IČO máme. Živnostenské oprávnění teď zkontrolujeme v rejstříku.' },
  neovereno: { text: 'Neověřeno', ton: 'muted', popis: 'Vyplň IČO a my ověříme živnostenské oprávnění.' },
}

function Prepinac({ zapnuto, onZmena, disabled, popisek, napoveda }: {
  zapnuto: boolean; onZmena: (v: boolean) => void; disabled?: boolean; popisek: string; napoveda: string
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input type="checkbox" role="switch" className="peer sr-only" checked={zapnuto} disabled={disabled} onChange={(e) => onZmena(e.target.checked)} />
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${zapnuto ? 'bg-accent' : 'bg-line-strong'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] ${zapnuto ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{popisek}</span>
        <span className="text-[13px] text-muted">{napoveda}</span>
      </span>
    </label>
  )
}

function Fotka() {
  const { user, jmeno } = useAuth()
  const toast = useToast()
  const nahrat = useNahratFotku()
  const vstup = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar jmeno={jmeno} url={user?.user_metadata?.avatar_url} velikost={72} />
        <button
          type="button"
          onClick={() => vstup.current?.click()}
          disabled={nahrat.isPending}
          className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-surface bg-ink text-surface transition-transform hover:scale-105 disabled:opacity-60"
          aria-label="Změnit profilovou fotku"
        >
          <Camera className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-col items-start gap-1">
        <Button varianta="secondary" velikost="sm" loading={nahrat.isPending} onClick={() => vstup.current?.click()}>
          {user?.user_metadata?.avatar_url ? 'Změnit fotku' : 'Nahrát fotku'}
        </Button>
        <span className="text-[13px] text-muted">JPG nebo PNG, nejvýš 10 MB.</span>
      </div>
      <input
        ref={vstup}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const soubor = e.target.files?.[0]
          e.target.value = ''
          if (!soubor || !user) return
          nahrat.mutate(
            { soubor, uid: user.id },
            {
              onSuccess: () => toast('Fotka uložena', undefined, 'success'),
              onError: (chyba) => toast('Fotku se nepodařilo nahrát', chyba.message, 'error'),
            },
          )
        }}
      />
    </div>
  )
}

function FormularUdaju({ soukromy, soukromyNacten }: { soukromy?: SoukromyProfil; soukromyNacten: boolean }) {
  const { user, role } = useAuth()
  const toast = useToast()
  const ulozit = useUlozitProfil()
  const m = user?.user_metadata ?? {}
  const remeslnik = role === 'craftsman'

  const [udaje, setUdaje] = useState({
    full_name: String(m.full_name ?? ''),
    phone: String(m.phone ?? ''),
    city: String(m.city ?? ''),
    bio: String(m.bio ?? ''),
  })
  // IČO, adresa a upozornění se doplní, až dorazí z databáze.
  const [ico, setIco] = useState<string | null>(null)
  const [adresa, setAdresa] = useState<string | null>(null)
  const [emaily, setEmaily] = useState<boolean | null>(null)
  const [chyby, setChyby] = useState<Record<string, string>>({})

  const icoHodnota = ico ?? soukromy?.ico ?? ''
  const adresaHodnota = adresa ?? soukromy?.adresa ?? ''
  const emailyHodnota = emaily ?? soukromy?.chce_emaily ?? true

  const zmeneno =
    udaje.full_name !== String(m.full_name ?? '') ||
    udaje.phone !== String(m.phone ?? '') ||
    udaje.city !== String(m.city ?? '') ||
    udaje.bio !== String(m.bio ?? '') ||
    (ico !== null && ico !== (soukromy?.ico ?? '')) ||
    (adresa !== null && adresa !== (soukromy?.adresa ?? '')) ||
    (emaily !== null && emaily !== soukromy?.chce_emaily)

  const nastav = (k: keyof typeof udaje) => (e: { target: { value: string } }) => {
    setUdaje((u) => ({ ...u, [k]: e.target.value }))
    setChyby((c) => ({ ...c, [k]: '' }))
  }

  const odeslat = (e: FormEvent) => {
    e.preventDefault()
    const nove: Record<string, string> = {}
    if (!udaje.full_name.trim()) nove.full_name = 'Vyplň jméno a příjmení.'
    const tel = cistyTelefon(udaje.phone)
    if (tel && !TELEFON.test(tel)) nove.phone = 'Telefonní číslo musí mít 9 číslic.'
    const cisteIc = cisteIco(icoHodnota)
    if (remeslnik && cisteIc && !/^\d{8}$/.test(cisteIc)) nove.ico = 'IČO má osm číslic.'
    setChyby(nove)
    if (Object.keys(nove).length) return

    ulozit.mutate(
      {
        udaje: {
          ...udaje,
          ...(remeslnik && soukromyNacten ? { ico: icoHodnota, adresa: adresaHodnota } : {}),
          ...(soukromyNacten ? { chce_emaily: emailyHodnota } : {}),
        },
        puvodni: soukromy,
      },
      {
        onSuccess: ({ varovani }) => {
          setIco(null); setAdresa(null); setEmaily(null)
          if (varovani.length) toast('Uloženo jen částečně', varovani.join(' '), 'error')
          else toast('Profil uložen', undefined, 'success')
        },
        onError: (chyba) => toast('Profil se nepodařilo uložit', chyba.message, 'error'),
      },
    )
  }

  const overeni = OVERENI[stavOvereni(soukromy)]

  return (
    <form onSubmit={odeslat} noValidate>
      <Card>
        <Sekce nadpis="Osobní údaje" popis={remeslnik ? 'Jméno, fotku a město uvidí zákazníci u tvých nabídek.' : 'Telefon dostane jen řemeslník, kterého si vybereš.'}>
          <Fotka />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Jméno a příjmení" autoComplete="name" value={udaje.full_name} onChange={nastav('full_name')} chyba={chyby.full_name} />
            <Input label="E-mail" value={user?.email ?? ''} disabled napoveda="E-mail změnit nejde." />
            <Input label="Telefon" type="tel" autoComplete="tel" inputMode="tel" placeholder="777 123 456" value={udaje.phone} onChange={nastav('phone')} chyba={chyby.phone} />
            <Input
              label={remeslnik ? 'Město / působnost' : 'Město'}
              autoComplete="address-level2"
              placeholder={remeslnik ? 'Olomouc a okolí' : 'Olomouc'}
              value={udaje.city}
              onChange={nastav('city')}
              napoveda={remeslnik ? 'Uvidí zákazníci v tvém profilu.' : undefined}
            />
          </div>
        </Sekce>

        {remeslnik && (
          <Sekce nadpis="O tobě" popis="Krátce, co děláš a jak dlouho. Zákazníci to čtou, než přijmou nabídku.">
            <Textarea
              label="O mně / popis služeb"
              rows={5}
              maxLength={1000}
              placeholder="Elektrikář s 12 lety praxe. Rozvody, revize, opravy po bytech i domech."
              value={udaje.bio}
              onChange={nastav('bio')}
              napoveda={`${udaje.bio.length} / 1000`}
            />
            <Input
              label="Odkud vyjíždíš"
              autoComplete="street-address"
              placeholder="Ulice a město"
              value={adresaHodnota}
              onChange={(e) => setAdresa(e.target.value)}
              disabled={!soukromyNacten}
              napoveda="Neveřejné. Podle toho na tržišti ukážeme, jak daleko je zakázka."
            />
          </Sekce>
        )}

        {remeslnik && (
          <Sekce nadpis="Ověření" popis={overeni.popis}>
            <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-surface-2/60 px-4 py-3">
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <ShieldCheck className="size-[18px] text-muted" aria-hidden /> Živnostenské oprávnění
              </span>
              {soukromyNacten ? <Badge ton={overeni.ton}>{overeni.text}</Badge> : <span className="text-[13px] text-muted">Načítám…</span>}
            </div>
            <Input
              label="IČO"
              inputMode="numeric"
              placeholder="12345678"
              value={icoHodnota}
              onChange={(e) => { setIco(e.target.value); setChyby((c) => ({ ...c, ico: '' })) }}
              disabled={!soukromyNacten}
              chyba={chyby.ico}
              napoveda={
                <>Osm číslic. Najdeš ho na <a href="https://rzp.gov.cz" target="_blank" rel="noreferrer" className="font-medium text-accent-text underline-offset-2 hover:underline">rzp.gov.cz</a>.</>
              }
            />
          </Sekce>
        )}

        {!remeslnik && (
          <Sekce nadpis="O tobě" popis="Nepovinné. Řemeslníci to uvidí v tvém profilu.">
            <Textarea label="Pár slov o tobě" rows={3} maxLength={500} value={udaje.bio} onChange={nastav('bio')} />
          </Sekce>
        )}

        <Sekce nadpis="Upozornění">
          <Prepinac
            zapnuto={emailyHodnota}
            onZmena={setEmaily}
            disabled={!soukromyNacten}
            popisek="Posílat upozornění e-mailem"
            napoveda={remeslnik ? 'Nové poptávky v tvém okolí, nepřečtené zprávy a potvrzené zakázky.' : 'Nové nabídky, nepřečtené zprávy a hotové zakázky.'}
          />
        </Sekce>

        <div className="flex items-center justify-end gap-3 rounded-b-[14px] border-t border-line bg-surface-2/50 px-5 py-3.5 md:px-6">
          {zmeneno && <span className="mr-auto text-[13px] text-muted">Máš neuložené změny</span>}
          <Button type="submit" loading={ulozit.isPending} disabled={!zmeneno}>Uložit změny</Button>
        </div>
      </Card>
    </form>
  )
}

function Heslo() {
  const toast = useToast()
  const zmenit = useZmenitHeslo()
  const [heslo, setHeslo] = useState('')
  const [znovu, setZnovu] = useState('')
  const [chyba, setChyba] = useState<{ heslo?: string; znovu?: string }>({})

  const odeslat = (e: FormEvent) => {
    e.preventDefault()
    const problem = zkontrolujHeslo(heslo)
    if (problem) return setChyba({ heslo: problem })
    if (heslo !== znovu) return setChyba({ znovu: 'Hesla se neshodují.' })
    zmenit.mutate(heslo, {
      onSuccess: () => {
        setHeslo(''); setZnovu(''); setChyba({})
        toast('Heslo změněno', 'Příště se přihlásíš novým heslem.', 'success')
      },
      onError: (e) => toast('Heslo se nepodařilo změnit', e.message, 'error'),
    })
  }

  return (
    <form onSubmit={odeslat} noValidate>
      <Card>
        <Sekce nadpis="Heslo" popis="Aspoň 8 znaků, jedno velké písmeno a číslice. Když se přihlašuješ přes Google, heslo nepotřebuješ.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nové heslo" type="password" autoComplete="new-password" value={heslo} onChange={(e) => { setHeslo(e.target.value); setChyba({}) }} chyba={chyba.heslo} />
            <Input label="Heslo znovu" type="password" autoComplete="new-password" value={znovu} onChange={(e) => { setZnovu(e.target.value); setChyba({}) }} chyba={chyba.znovu} />
          </div>
          <div>
            <Button type="submit" varianta="secondary" loading={zmenit.isPending} disabled={!heslo}>Změnit heslo</Button>
          </div>
        </Sekce>
      </Card>
    </form>
  )
}

function Radek({ ikona: Ikona, nadpis, popis, akce, onClick, to, nebezpecne }: {
  ikona: typeof LogOut; nadpis: string; popis?: string; akce?: ReactNode; onClick?: () => void; to?: string; nebezpecne?: boolean
}) {
  const obsah = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${nebezpecne ? 'bg-danger/10 text-danger-text' : 'bg-surface-2 text-soft'}`}>
        <Ikona className="size-[18px]" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className={`text-sm font-medium ${nebezpecne ? 'text-danger-text' : ''}`}>{nadpis}</span>
        {popis && <span className="text-[13px] text-muted">{popis}</span>}
      </span>
      {akce ?? <ChevronRight className="size-4 text-faint" aria-hidden />}
    </>
  )
  const tridy = 'flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60 md:px-6'
  if (to) return <Link to={to} className={tridy}>{obsah}</Link>
  return <button type="button" onClick={onClick} className={tridy}>{obsah}</button>
}

function Ucet() {
  const { role, prepniRoli, odhlasit } = useAuth()
  const toast = useToast()
  const [prepinam, setPrepinam] = useState(false)
  const druha = role === 'customer' ? 'craftsman' : 'customer'

  const prepnout = async () => {
    setPrepinam(true)
    try {
      await prepniRoli(druha)
      toast(`Teď jsi ${ROLE_LABEL[druha].toLowerCase()}`, 'Tvoje poptávky, nabídky i zprávy zůstávají, jen se přepne prostředí.', 'success')
    } catch (e) {
      toast('Roli se nepodařilo přepnout', e instanceof Error ? e.message : undefined, 'error')
    } finally {
      setPrepinam(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-line">
        <Radek
          ikona={Repeat2}
          nadpis={druha === 'craftsman' ? 'Nabízet práci jako řemeslník' : 'Zadávat poptávky jako zákazník'}
          popis={`Teď používáš Remexo jako ${ROLE_LABEL[role].toLowerCase()}. Jeden účet zvládne obojí.`}
          onClick={prepnout}
          akce={<Button varianta="secondary" velikost="sm" loading={prepinam} tabIndex={-1} className="pointer-events-none">Přepnout</Button>}
        />
        <Radek ikona={Palette} nadpis="Vzhled" popis="Světlý, tmavý nebo podle zařízení" to="/nastaveni" />
        <Radek ikona={LogOut} nadpis="Odhlásit se" onClick={odhlasit} akce={<span />} nebezpecne />
      </div>
    </Card>
  )
}

export function Profil() {
  const { user, role } = useAuth()
  const soukromy = useSoukromyProfil()
  const chybi = chybiVProfilu(user)

  return (
    <Stranka nadpis="Profil" sirka="normalni">
      <div className="flex max-w-[880px] flex-col gap-5">
        {chybi.length > 0 && (
          <div className="rounded-[12px] border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-soft-text">
            <span className="font-semibold">Doplň {chybi.join(', ')}.</span>{' '}
            {role === 'customer' ? 'Bez toho nepůjde poslat poptávku.' : 'Zákazníci tě podle toho poznají a snáz se domluví.'}
          </div>
        )}
        {/* key: formulář se po načtení uživatele postaví znovu s čerstvými hodnotami */}
        <FormularUdaju key={`${user?.id}-${role}`} soukromy={soukromy.data} soukromyNacten={soukromy.isSuccess} />
        <Heslo />
        <Ucet />
      </div>
    </Stranka>
  )
}

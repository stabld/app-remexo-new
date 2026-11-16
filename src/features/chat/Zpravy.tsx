import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, MessageCircle, SendHorizontal } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useToast } from '@/components/Toast'
import { parsujDatum } from '@/lib/cas'
import { useKonverzace, useOdeslatZpravu, useZpravy, type Konverzace, type Zprava } from './api'

const cas = (d: string) => parsujDatum(d)?.toLocaleTimeString('cs', { hour: 'numeric', minute: '2-digit' }) ?? ''

function denPopisek(d: string) {
  const x = parsujDatum(d)
  if (!x) return ''
  const dnes = new Date()
  const vcera = new Date(dnes.getFullYear(), dnes.getMonth(), dnes.getDate() - 1)
  if (x.toDateString() === dnes.toDateString()) return 'Dnes'
  if (x.toDateString() === vcera.toDateString()) return 'Včera'
  return x.toLocaleDateString('cs', { weekday: 'long', day: 'numeric', month: 'numeric' })
}

function kdyVSeznamu(d: string) {
  const x = parsujDatum(d)
  if (!x) return ''
  return x.toDateString() === new Date().toDateString() ? cas(d) : x.toLocaleDateString('cs', { day: 'numeric', month: 'numeric' })
}

/** Zprávy: na počítači seznam a chat vedle sebe, na mobilu seznam a chat přes celou obrazovku. */
export function Zpravy() {
  const { id } = useParams()
  const { data: konverzace = [], isLoading, isError } = useKonverzace()
  const vybrana = konverzace.find((k) => k.id === id) ?? null

  if (isLoading) return <div className="p-10"><NacitaniStranky /></div>
  if (isError) return <p className="p-10 text-muted">Zprávy se nepodařilo načíst. Zkontroluj připojení a obnov stránku.</p>

  // Na počítači rovnou otevřít první konverzaci
  if (!id && konverzace.length && window.matchMedia('(min-width: 1024px)').matches) return <Navigate to={`/zpravy/${konverzace[0].id}`} replace />

  return (
    <div className="flex min-h-0 flex-1 lg:h-dvh">
      <section aria-label="Konverzace" className={`w-full flex-col border-line bg-surface lg:flex lg:w-[340px] lg:shrink-0 lg:border-r ${id ? 'hidden' : 'flex'}`}>
        <h1 className="border-b border-line px-5 py-4 text-lg font-semibold">Zprávy</h1>
        {!konverzace.length ? (
          <PrazdneZpravy />
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {konverzace.map((k) => <PolozkaKonverzace key={k.id} k={k} aktivni={k.id === id} />)}
          </ul>
        )}
      </section>

      {id && (vybrana ? <Chat k={vybrana} /> : <p className="p-10 text-muted">Tuhle konverzaci jsme nenašli.</p>)}
      {!id && konverzace.length > 0 && <div className="hidden flex-1 lg:block" />}
    </div>
  )
}

function PrazdneZpravy() {
  const { role } = useAuth()
  return (
    <div className="flex flex-col items-start gap-2 p-6">
      <MessageCircle className="size-8 text-faint" aria-hidden />
      <p className="font-semibold">Zatím žádné zprávy</p>
      <p className="text-sm text-muted">
        {role === 'customer'
          ? 'Chat se otevře, jakmile přijmeš nabídku řemeslníka. Pak si tu domluvíte termín a detaily.'
          : 'Chat se otevře, jakmile zákazník přijme tvoji nabídku.'}
      </p>
      {role === 'customer' && <ButtonLink to="/poptavky" varianta="secondary" className="mt-2">Moje poptávky</ButtonLink>}
    </div>
  )
}

function PolozkaKonverzace({ k, aktivni }: { k: Konverzace; aktivni: boolean }) {
  const { user } = useAuth()
  const moje = k.posledni?.sender_id === user?.id
  return (
    <li>
      <Link
        to={`/zpravy/${k.id}`}
        aria-current={aktivni ? 'page' : undefined}
        className={`flex gap-3 border-b border-line px-5 py-3.5 transition-colors ${aktivni ? 'bg-accent-soft' : k.neprectene ? 'bg-accent-soft/40 hover:bg-surface-2' : 'hover:bg-surface-2'}`}
      >
        <Avatar jmeno={k.protistrana.jmeno} velikost={40} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-semibold">{k.protistrana.jmeno}</span>
            {k.posledni && <span className="ml-auto shrink-0 text-xs text-faint">{kdyVSeznamu(k.posledni.created_at)}</span>}
          </span>
          <span className="truncate text-xs text-muted">{k.nazev}</span>
          <span className="flex items-center gap-2">
            <span className={`truncate text-sm ${k.neprectene ? 'font-medium text-ink' : 'text-muted'}`}>
              {k.posledni ? `${moje ? 'Ty: ' : ''}${k.posledni.text}` : 'Zatím bez zpráv'}
            </span>
            {k.neprectene > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-accent px-[7px] text-xs font-semibold leading-5 text-on-accent" aria-label={`${k.neprectene} nepřečtených`}>{k.neprectene}</span>
            )}
          </span>
        </span>
      </Link>
    </li>
  )
}

function Chat({ k }: { k: Konverzace }) {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: zpravy = [], isLoading } = useZpravy(k.id)
  const odeslat = useOdeslatZpravu(k.id)
  const [text, setText] = useState('')
  const konec = useRef<HTMLDivElement>(null)
  const hotovo = k.stav === 'done'

  useEffect(() => { konec.current?.scrollIntoView({ block: 'end' }) }, [zpravy.length])

  const poslat = (e?: FormEvent) => {
    e?.preventDefault()
    const t = text.trim()
    if (!t) return
    setText('')
    odeslat.mutate(t, { onError: () => { setText(t); toast('Zpráva se neodeslala', 'Zkontroluj připojení a zkus to znovu.', 'error') } })
  }

  const enter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); poslat() }
  }

  return (
    <section aria-label={`Konverzace s ${k.protistrana.jmeno}`} className="fixed inset-0 z-40 flex flex-col bg-bg lg:static lg:z-auto lg:min-w-0 lg:flex-1">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-3 py-3 lg:px-6">
        <button onClick={() => navigate('/zpravy')} className="grid size-10 place-items-center rounded-lg text-ink hover:bg-surface-2 lg:hidden" aria-label="Zpět na zprávy">
          <ArrowLeft className="size-5" />
        </button>
        <Avatar jmeno={k.protistrana.jmeno} velikost={36} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold">{k.protistrana.jmeno}</span>
          {role === 'customer' ? (
            <Link to={`/poptavky/${k.id}`} className="truncate text-[13px] font-medium text-accent-text hover:underline">{k.nazev}</Link>
          ) : (
            <span className="truncate text-[13px] text-muted">{k.nazev}</span>
          )}
        </span>
        {role === 'customer' && !hotovo && (
          <span className="ml-auto hidden shrink-0 sm:block">
            <ButtonLink to={`/poptavky/${k.id}`} varianta="secondary" velikost="sm">Detail zakázky</ButtonLink>
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        {isLoading ? (
          <NacitaniStranky />
        ) : (
          <ol className="mx-auto flex max-w-[760px] flex-col gap-2">
            {zpravy.map((z, i) => {
              const den = denPopisek(z.created_at)
              const novyDen = i === 0 || denPopisek(zpravy[i - 1].created_at) !== den
              return (
                <li key={z.id} className="flex flex-col gap-2">
                  {novyDen && <span className="my-2 self-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted first-letter:uppercase">{den}</span>}
                  {z.zNabidky && (
                    <span className="self-center text-center text-[13px] text-muted">
                      {role === 'customer' ? `Přijal jsi nabídku. Teď vidíte navzájem kontakt.` : 'Zákazník přijal tvoji nabídku. Teď vidíte navzájem kontakt.'}
                    </span>
                  )}
                  <Bublina z={z} moje={z.sender_id === user?.id} />
                </li>
              )
            })}
            {!zpravy.length && <li className="py-10 text-center text-sm text-muted">Napiš první zprávu, třeba kdy se ti hodí termín.</li>}
            {hotovo && <li className="mt-3 self-center text-center text-[13px] text-muted">Zakázka je dokončená. Psát si můžete dál.</li>}
          </ol>
        )}
        <div ref={konec} />
      </div>

      <form onSubmit={poslat} className="flex items-end gap-2 border-t border-line bg-surface px-3 py-3 pb-[max(env(safe-area-inset-bottom),12px)] lg:px-6">
        <label className="flex-1">
          <span className="sr-only">Zpráva</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={enter}
            rows={1}
            placeholder="Napiš zprávu"
            className="max-h-40 w-full resize-none rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none field-sizing-content focus:border-accent focus:ring-3 focus:ring-accent/20"
          />
        </label>
        <button type="submit" disabled={!text.trim()} aria-label="Odeslat" className="grid size-[44px] shrink-0 place-items-center rounded-[10px] bg-accent text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-40">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </section>
  )
}

function Bublina({ z, moje }: { z: Zprava; moje: boolean }) {
  return (
    <div className={`flex max-w-[80%] flex-col ${moje ? 'self-end items-end' : 'self-start items-start'}`}>
      <p
        className={`whitespace-pre-line break-words px-3.5 py-2.5 text-[15px] ${
          moje ? 'rounded-[14px] rounded-br-[4px] bg-ink text-surface' : 'rounded-[14px] rounded-bl-[4px] border border-line bg-surface'
        }`}
      >
        {z.text}
      </p>
      <span className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-faint">
        {z.odesilam ? <><LoaderCircle className="size-3 animate-spin" /> Odesílám</> : cas(z.created_at)}
        {z.zNabidky && ' · z nabídky'}
      </span>
    </div>
  )
}

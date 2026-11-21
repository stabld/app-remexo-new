import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, List, Map as MapIkona, MapPin, Search } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { useToast } from '@/components/Toast'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useAuth } from '@/features/auth/AuthProvider'
import { chybiVProfilu } from '@/features/profile/api'
import { rozlozPopis } from '@/lib/popis'
import type { Poptavka } from '@/lib/types'
import { type MojeNabidkaKPoptavce, useMojeNabidkyMapa, useOblibene, usePolohaRemeslnika, usePrepnoutOblibene, useTrziste } from './api'
import { oborSedi, vzdalenost, ZNAME_OBORY } from './model'
import { KartaZakazky } from './KartaZakazky'
import { MapaZakazek } from './MapaZakazek'

type Zobrazeni = 'seznam' | 'mapa'
const KLIC_ZOBRAZENI = 'remexo-trziste-zobrazeni'
const DOSAHY = [10, 25, 35] as const

function sklonujZakazky(n: number) {
  if (n === 1) return '1 zakázka'
  if (n >= 2 && n <= 4) return `${n} zakázky`
  return `${n} zakázek`
}

function Cip({ aktivni, onClick, children }: { aktivni: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktivni}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
        aktivni ? 'border-ink bg-ink font-semibold text-surface' : 'border-line-strong bg-surface font-medium text-soft hover:border-faint hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

const VYBER = 'h-[38px] rounded-[10px] border border-line-strong bg-surface px-2.5 text-sm text-ink disabled:opacity-50'

export function Trziste() {
  const { user } = useAuth()
  const toast = useToast()
  const trziste = useTrziste()
  const moje = useMojeNabidkyMapa()
  const oblibene = useOblibene()
  const prepnout = usePrepnoutOblibene()
  const poloha = usePolohaRemeslnika()

  const [hledat, setHledat] = useState('')
  const [obor, setObor] = useState<string>('vse')
  const [dosah, setDosah] = useState<number | null>(null)
  const [razeni, setRazeni] = useState<'nove' | 'blizko'>('nove')
  const [zobrazeni, setZobrazeni] = useState<Zobrazeni>(() => {
    try { return localStorage.getItem(KLIC_ZOBRAZENI) === 'mapa' ? 'mapa' : 'seznam' } catch { return 'seznam' }
  })
  const [vybrana, setVybrana] = useState<number | null>(null)
  const karty = useRef(new Map<number, HTMLElement>())

  const zmenZobrazeni = (z: Zobrazeni) => {
    setZobrazeni(z)
    try { localStorage.setItem(KLIC_ZOBRAZENI, z) } catch { /* bez úložiště se jen nezapamatuje */ }
  }

  const misto = poloha.data ?? null
  const chybi = chybiVProfilu(user)

  const zakazky = useMemo(() => {
    // Vlastní poptávky (když má účet obě role) na tržišti nemají co dělat.
    const vse = (trziste.data ?? []).filter((z) => z.customer_id !== user?.id)
    const q = hledat.trim().toLocaleLowerCase('cs')
    const s = vse
      .map((z) => ({ z, km: vzdalenost(z, misto) }))
      .filter(({ z, km }) => {
        if (obor === 'ulozene' && !oblibene.data?.has(z.id)) return false
        if (obor !== 'vse' && obor !== 'ulozene' && !oborSedi(z.category, obor)) return false
        if (dosah && (km == null || km > dosah)) return false
        if (q) {
          const text = `${z.title ?? ''} ${rozlozPopis(z.description, true).hlavni} ${z.mesto ?? ''}`.toLocaleLowerCase('cs')
          if (!text.includes(q)) return false
        }
        return true
      })
    if (razeni === 'blizko') s.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
    return s
  }, [trziste.data, user?.id, hledat, obor, dosah, razeni, misto, oblibene.data])

  const naMape = useMemo(() => zakazky.map((x) => x.z), [zakazky])
  const celkem = (trziste.data ?? []).filter((z) => z.customer_id !== user?.id).length

  // Klik na značku v mapě: kartu odrolujeme do zorného pole.
  const vyberZMapy = (id: number) => {
    setVybrana(id)
    karty.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  useEffect(() => {
    if (vybrana != null && !zakazky.some((x) => x.z.id === vybrana)) setVybrana(null)
  }, [zakazky, vybrana])

  const ulozit = (id: number, nazev: string | null) => {
    const ulozena = !oblibene.data?.has(id)
    prepnout.mutate(
      { id, ulozit: ulozena },
      {
        onSuccess: () => toast(ulozena ? 'Uloženo' : 'Odebráno z uložených', nazev ?? undefined, ulozena ? 'success' : 'info'),
        onError: (e) => toast('Nepodařilo se uložit', e.message, 'error'),
      },
    )
  }

  if (trziste.isPending) return <NacitaniStranky />

  const prepinac = (
    <div role="group" aria-label="Zobrazení" className="flex gap-1 rounded-[10px] bg-surface-2 p-1">
      {([['seznam', 'Seznam', List], ['mapa', 'Seznam a mapa', MapIkona]] as const).map(([id, text, Ikona]) => (
        <button
          key={id}
          type="button"
          aria-pressed={zobrazeni === id}
          onClick={() => zmenZobrazeni(id)}
          className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-sm transition-colors ${
            zobrazeni === id ? 'bg-surface font-semibold text-ink shadow-sm' : 'font-medium text-soft hover:text-ink'
          }`}
        >
          <Ikona className="size-4" aria-hidden />
          <span className={id === 'mapa' ? 'max-lg:hidden' : ''}>{text}</span>
          {id === 'mapa' && <span className="lg:hidden">Mapa</span>}
        </button>
      ))}
    </div>
  )

  const seznam = (
    <div className="flex flex-col gap-3">
      {chybi.length > 0 && (
        <div className="rounded-[12px] border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-soft-text">
          <span className="font-semibold">Než pošleš první nabídku, doplň v profilu {chybi.join(', ')}.</span>{' '}
          <Link to="/profil" className="font-semibold underline underline-offset-2">Doplnit profil</Link>
        </div>
      )}
      {!poloha.isPending && !misto && celkem > 0 && (
        <p className="flex items-start gap-2 rounded-[12px] border border-line bg-surface px-4 py-3 text-sm text-soft">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span>
            Vyplň v profilu, <Link to="/profil" className="font-semibold text-accent-text hover:underline">odkud vyjíždíš</Link>, a u zakázek uvidíš, jak jsou daleko.
          </span>
        </p>
      )}

      {trziste.isError ? (
        <div className="rounded-[14px] border border-line bg-surface px-6 py-10 text-center">
          <p className="font-semibold">Zakázky se nepodařilo načíst</p>
          <button type="button" onClick={() => trziste.refetch()} className="mt-2 text-sm font-semibold text-accent-text hover:underline">Zkusit znovu</button>
        </div>
      ) : celkem === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface px-6 py-12 text-center">
          <Inbox className="mx-auto mb-3 size-9 text-faint" aria-hidden />
          <p className="text-lg font-semibold">Zatím tu nejsou žádné poptávky</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
            Remexo v Olomouci právě začíná. Jakmile zákazník zadá poptávku, pošleme ti e-mail. Mezitím si doplň profil a IČO, ať můžeš nabídku poslat hned.
          </p>
          <Link to="/profil" className="mt-4 inline-block text-sm font-semibold text-accent-text hover:underline">Zkontrolovat profil</Link>
        </div>
      ) : zakazky.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line-strong px-6 py-10 text-center text-sm text-muted">
          {obor === 'ulozene' ? 'Zatím nemáš uložené žádné zakázky. Ukládej je záložkou na kartě.' : 'Filtrům neodpovídá žádná zakázka.'}
          {(hledat || dosah || (obor !== 'vse' && obor !== 'ulozene')) && (
            <button type="button" onClick={() => { setHledat(''); setDosah(null); setObor('vse') }} className="ml-1 font-semibold text-accent-text hover:underline">
              Zrušit filtry
            </button>
          )}
        </div>
      ) : (
        zakazky.map(({ z, km }) => (
          <KartaZakazky
            key={z.id}
            ref={(el) => { if (el) karty.current.set(z.id, el); else karty.current.delete(z.id) }}
            z={z}
            km={km}
            moje={moje.data?.get(z.id)}
            ulozena={!!oblibene.data?.has(z.id)}
            vybrana={vybrana === z.id}
            onUlozit={() => ulozit(z.id, z.title)}
            onVyber={() => setVybrana(z.id)}
          />
        ))
      )}
    </div>
  )

  const vybery = (
    <>
          <label className="flex items-center gap-2 text-sm text-soft" title={misto ? undefined : 'Vyplň v profilu, odkud vyjíždíš'}>
            Do
            <select className={VYBER} value={dosah ?? ''} disabled={!misto} onChange={(e) => setDosah(e.target.value ? Number(e.target.value) : null)}>
              <option value="">jakékoli vzdálenosti</option>
              {DOSAHY.map((d) => <option key={d} value={d}>{d} km</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-soft">
            Řadit
            <select className={VYBER} value={razeni} onChange={(e) => setRazeni(e.target.value as 'nove' | 'blizko')}>
              <option value="nove">Nejnovější</option>
              <option value="blizko" disabled={!misto}>Nejblíž</option>
            </select>
          </label>
    </>
  )

  const filtry = (
    <div className="flex flex-col gap-2.5 border-b border-line bg-surface px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="mr-auto text-sm text-muted">{sklonujZakazky(zakazky.length)}</span>
        {prepinac}
      </div>
      <label className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line-strong px-3 text-muted focus-within:border-accent lg:w-[240px] lg:shrink-0">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          type="search"
          value={hledat}
          onChange={(e) => setHledat(e.target.value)}
          placeholder="Hledat zakázky"
          aria-label="Hledat zakázky"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </label>
      {/* Na mobilu jeden vodorovně posuvný pruh, na počítači se zalomí. */}
      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-1 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        <Cip aktivni={obor === 'vse'} onClick={() => setObor('vse')}>Všechny obory</Cip>
        {[...ZNAME_OBORY, 'Ostatní'].map((o) => (
          <Cip key={o} aktivni={obor === o} onClick={() => setObor(o)}>{o}</Cip>
        ))}
        <Cip aktivni={obor === 'ulozene'} onClick={() => setObor('ulozene')}>
          Uložené{oblibene.data?.size ? ` ${oblibene.data.size}` : ''}
        </Cip>
        <div className="ml-2 flex shrink-0 items-center gap-2.5 lg:hidden">{vybery}</div>
      </div>
    </div>
  )

  return (
    <Stranka
      nadpis="Tržiště"
      sirka="plna"
      nadpisNaMobilu={zobrazeni === 'seznam'}
      akce={
        <>
          <span className="mr-auto text-sm text-muted">{sklonujZakazky(zakazky.length)}{zakazky.length !== celkem && ` z ${celkem}`}</span>
          <div className="mr-2 flex items-center gap-2.5">{vybery}</div>
          {prepinac}
        </>
      }
    >
      {zobrazeni === 'seznam' ? (
        <>
          <div className="lg:sticky lg:top-[73px] lg:z-10">{filtry}</div>
          <div className="max-w-[880px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-14">{seznam}</div>
        </>
      ) : (
        // Výška = obrazovka bez horní lišty (mobil 47 px + spodní navigace 65 px, počítač 73 px).
        <div className="flex h-[calc(100dvh-112px)] flex-col lg:h-[calc(100dvh-73px)]">
          {filtry}
          <div className="flex min-h-0 flex-1">
            <section aria-label="Seznam zakázek" className="hidden min-w-0 flex-1 overflow-y-auto px-4 pb-14 pt-5 sm:px-6 lg:block lg:max-w-[640px] lg:px-8">
              {seznam}
            </section>
            <section aria-label="Mapa zakázek" className="relative min-w-0 flex-1 border-line lg:border-l">
              <MapaZakazek zakazky={naMape} poloha={misto} vybrana={vybrana} onVyber={vyberZMapy} />
              {vybrana != null && (
                <VybranaNaMobilu
                  z={zakazky.find((x) => x.z.id === vybrana)}
                  moje={moje.data?.get(vybrana)}
                  ulozena={!!oblibene.data?.has(vybrana)}
                  onUlozit={() => ulozit(vybrana, zakazky.find((x) => x.z.id === vybrana)?.z.title ?? null)}
                  onZavrit={() => setVybrana(null)}
                />
              )}
            </section>
          </div>
        </div>
      )}
    </Stranka>
  )
}

/** Na mobilu je seznam schovaný, vybraná zakázka se ukáže jako lístek nad mapou. */
function VybranaNaMobilu({ z, moje, ulozena, onUlozit, onZavrit }: {
  z?: { z: Poptavka; km: number | null }; moje?: MojeNabidkaKPoptavce; ulozena: boolean; onUlozit: () => void; onZavrit: () => void
}) {
  if (!z) return null
  return (
    <div className="absolute inset-x-3 bottom-24 z-[500] lg:hidden">
      <div className="relative">
        <KartaZakazky z={z.z} km={z.km} moje={moje} ulozena={ulozena} vybrana onUlozit={onUlozit} onVyber={() => {}} />
        <button type="button" onClick={onZavrit} aria-label="Zavřít" className="absolute -top-2.5 right-3 z-20 grid size-7 place-items-center rounded-full border border-line bg-surface text-muted shadow-raised">
          ×
        </button>
      </div>
    </div>
  )
}

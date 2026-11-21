import { Link } from 'react-router-dom'
import { ChevronRight, ShieldAlert, ShieldCheck, Star } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useFotka } from '@/components/Fotky'
import { Avatar } from '@/components/ui/Avatar'
import { rozlozPopis } from '@/lib/popis'
import { relativniCas, stariPoptavky } from '@/lib/cas'
import { vokativ } from '@/lib/osloveni'
import type { Poptavka } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'
import { chybiVProfilu, stavOvereni, useSoukromyProfil } from '@/features/profile/api'
import { OborIkona } from '@/features/requests/kategorie'
import { useKonverzace } from '@/features/chat/api'
import { useMojeNabidkyMapa, usePolohaRemeslnika, useTrziste } from '@/features/market/api'
import { formatKm, specha, vzdalenost } from '@/features/market/model'
import { useMojePrace, type MojePrace } from './api'
import { DalsiKrok, stavPrace, StavPraceBadge } from './DalsiKrok'

function RadekZakazky({ z, km }: { z: Poptavka; km: number | null }) {
  const popis = rozlozPopis(z.description, true)
  const fotka = useFotka(popis.soubory, popis.stareFotky)
  const misto = z.mesto || popis.fakta.find((f) => f.popisek === 'Místo')?.hodnota
  const stari = stariPoptavky(z.created_at)
  const vzd = formatKm(km)
  return (
    <Link to={`/trziste/${z.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50">
      {fotka ? (
        <img src={fotka} alt="" className="size-14 shrink-0 rounded-[10px] bg-placeholder object-cover" />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-[10px] bg-surface-2"><OborIkona kategorie={z.category} velikost={36} /></span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold">{z.title || 'Poptávka'}</span>
        <span className="truncate text-[13px] text-muted">
          {[misto, vzd && `${vzd} od tebe`, stari?.text].filter(Boolean).join(', ')}
        </span>
      </span>
      {specha(z) && <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-soft-text">Spěchá</span>}
      <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden />
    </Link>
  )
}

function Rozpracovana({ p }: { p: MojePrace }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/zakazky/${p.requestId}`} className="font-semibold hover:underline">{p.titulek}</Link>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{p.cena || 'Dohodou'}</span>
      </div>
      <p className="text-[13px] text-muted">{[p.zakaznik, p.kontakt?.mesto || p.mesto].filter(Boolean).join(', ')}</p>
      <div><StavPraceBadge p={p} /></div>
      <div className="pt-1"><DalsiKrok p={p} /></div>
    </div>
  )
}

function Cislo({ popis, hodnota, to, zvyraznit }: { popis: string; hodnota: string | number; to: string; zvyraznit?: boolean }) {
  return (
    <Link to={to} className={`flex flex-col gap-0.5 rounded-[14px] border bg-surface px-5 py-4 transition-colors hover:border-line-strong ${zvyraznit ? 'border-accent/50' : 'border-line'}`}>
      <span className="text-sm text-muted">{popis}</span>
      <span className="text-[28px] font-semibold tabular-nums leading-tight">{hodnota}</span>
    </Link>
  )
}

/** Priorita v pravém sloupci: co čeká na řemeslníka, pak rozjeté. */
const poradi = (p: MojePrace) => ({ 'zakaznik-hlasi-hotovo': 0, realizace: 1, 'ceka-na-zakaznika': 2, hotovo: 3, zruseno: 4 })[stavPrace(p)]

export function PrehledRemeslnika() {
  const { user, jmeno } = useAuth()
  const trziste = useTrziste()
  const moje = useMojeNabidkyMapa()
  const prace = useMojePrace()
  const poloha = usePolohaRemeslnika()
  const soukromy = useSoukromyProfil()
  const konverzace = useKonverzace()

  if (trziste.isPending || prace.isPending) return <Stranka nadpis="Přehled" nadpisNaMobilu={false}><NacitaniStranky /></Stranka>

  const volne = (trziste.data ?? [])
    .filter((z) => z.customer_id !== user?.id && !moje.data?.has(z.id))
    .map((z) => ({ z, km: vzdalenost(z, poloha.data) }))
  const vse = prace.data ?? []
  const cekajici = vse.filter((p) => p.druh === 'ceka').length
  const rozpracovane = vse.filter((p) => p.druh === 'aktivni').sort((a, b) => poradi(a) - poradi(b))
  const naTobe = rozpracovane.filter((p) => stavPrace(p) === 'zakaznik-hlasi-hotovo').length
  const hodnoceni = vse.flatMap((p) => (p.hodnoceni ? [p.hodnoceni.hvezdicky] : []))
  const prumer = hodnoceni.length ? (hodnoceni.reduce((a, b) => a + b, 0) / hodnoceni.length).toFixed(1).replace('.', ',') : null
  const zpravy = (konverzace.data ?? []).filter((k) => k.neprectene > 0 && k.posledni)
  const chybi = chybiVProfilu(user)
  const overeni = soukromy.isSuccess ? stavOvereni(soukromy.data) : null

  const podnadpis = naTobe
    ? naTobe === 1 ? 'Zákazník hlásí hotovo, potvrď prosím dokončení.' : `${naTobe} zákazníci hlásí hotovo, potvrď prosím dokončení.`
    : volne.length === 0
      ? 'Na tržišti teď nejsou žádné nové zakázky. Jakmile nějaká přibude, pošleme ti e-mail.'
      : volne.length === 1 ? 'Na tržišti je 1 zakázka, na kterou můžeš poslat nabídku.'
        : `Na tržišti je ${volne.length} ${volne.length <= 4 ? 'zakázky' : 'zakázek'}, na které můžeš poslat nabídku.`

  return (
    <Stranka nadpis="Přehled" nadpisNaMobilu={false} sirka="prehled">
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-[1_1_360px]">
            <h2 className="text-[28px] font-semibold tracking-tight">Dobrý den, {vokativ(jmeno)}</h2>
            <p className="mt-1 text-base text-muted">{podnadpis}</p>
          </div>
          {overeni === 'overeno' ? (
            <span className="inline-flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-2 text-sm font-semibold text-success-text">
              <ShieldCheck className="size-4" aria-hidden />Ověřený profil{soukromy.data?.ico ? `, IČO ${soukromy.data.ico}` : ''}
            </span>
          ) : overeni ? (
            <Link to="/profil" className="inline-flex items-center gap-2 rounded-[10px] bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-soft-text hover:underline">
              <ShieldAlert className="size-4" aria-hidden />{overeni === 'ceka' ? 'IČO čeká na kontrolu' : 'Doplň IČO a získej odznak ověření'}
            </Link>
          ) : null}
        </header>

        {chybi.length > 0 && (
          <div className="rounded-[12px] border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-soft-text">
            <span className="font-semibold">Než pošleš první nabídku, doplň v profilu {chybi.join(', ')}.</span>{' '}
            <Link to="/profil" className="font-semibold underline underline-offset-2">Doplnit profil</Link>
          </div>
        )}

        <section aria-label="Souhrn" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Cislo popis="Volné zakázky" hodnota={volne.length} to="/trziste" />
          <Cislo popis="Nabídky čekají na zákazníka" hodnota={cekajici} to="/nabidky" />
          <Cislo popis="Rozpracované zakázky" hodnota={rozpracovane.length} to="/zakazky" zvyraznit={naTobe > 0} />
          <Link to="/zakazky" className="flex flex-col gap-0.5 rounded-[14px] border border-line bg-surface px-5 py-4 transition-colors hover:border-line-strong">
            <span className="text-sm text-muted">Hodnocení</span>
            <span className="flex items-center gap-1.5 text-[28px] font-semibold leading-tight tabular-nums">
              {prumer ?? '–'}
              {prumer && <Star className="size-5 fill-accent text-accent" aria-hidden />}
            </span>
            <span className="text-xs text-faint">{hodnoceni.length ? `${hodnoceni.length} ${hodnoceni.length === 1 ? 'hodnocení' : 'hodnocení'}` : 'Zatím bez hodnocení'}</span>
          </Link>
        </section>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-8">
          <section className="flex min-w-0 flex-[2_1_520px] flex-col gap-3" aria-labelledby="volne">
            <div className="flex items-baseline">
              <h3 id="volne" className="text-base font-semibold">Nové zakázky na tržišti</h3>
              <Link to="/trziste" className="ml-auto text-sm font-medium text-accent-text hover:underline">Otevřít tržiště</Link>
            </div>
            {volne.length ? (
              <div className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
                {volne.slice(0, 6).map(({ z, km }) => <RadekZakazky key={z.id} z={z} km={km} />)}
              </div>
            ) : (
              <p className="rounded-[14px] border border-dashed border-line-strong px-5 py-8 text-center text-sm text-muted">
                Teď tu nic nového není. Remexo v Olomouci právě začíná, nové poptávky ti pošleme e-mailem.
              </p>
            )}
          </section>

          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-8">
            <section className="flex flex-col gap-3" aria-labelledby="rozpracovane">
              <div className="flex items-baseline">
                <h3 id="rozpracovane" className="text-base font-semibold">Rozpracované</h3>
                {rozpracovane.length > 2 && <Link to="/zakazky" className="ml-auto text-sm font-medium text-accent-text hover:underline">Všechny</Link>}
              </div>
              {rozpracovane.length ? (
                rozpracovane.slice(0, 2).map((p) => <Rozpracovana key={p.nabidkaId} p={p} />)
              ) : (
                <p className="rounded-[14px] border border-dashed border-line-strong px-5 py-6 text-sm text-muted">
                  Žádná rozpracovaná zakázka. Objeví se tu, jakmile zákazník přijme tvoji nabídku.
                </p>
              )}
            </section>

            {zpravy.length > 0 && (
              <section className="flex flex-col gap-3" aria-labelledby="zpravy">
                <h3 id="zpravy" className="text-base font-semibold">Nové zprávy</h3>
                {zpravy.slice(0, 3).map((k) => (
                  <Link key={k.id} to={`/zpravy/${k.id}`} className="flex gap-3 rounded-[14px] border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong">
                    <Avatar jmeno={k.protistrana.jmeno} velikost={36} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold">{k.protistrana.jmeno}</span>
                        <span className="ml-auto shrink-0 text-xs text-faint">{relativniCas(k.posledni!.created_at)}</span>
                      </span>
                      <span className="truncate text-sm text-soft">{k.posledni!.text}</span>
                    </span>
                  </Link>
                ))}
              </section>
            )}
          </aside>
        </div>
      </div>
    </Stranka>
  )
}

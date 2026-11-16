import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { overAdresu } from '@/services/geo'
import { OBLASTI } from '@/config/region'
import { obor, OborIkona } from '../kategorie'
import { PRAZDNY, nactiKoncept, smazKoncept, ulozKoncept, vezmiPoptavkuZWebu, zkontrolujKontakt, type Koncept } from './koncept'
import { useZverejnitPoptavku } from './odeslat'
import { KrokFotky, KrokMisto, KrokPopis } from './KrokyZakladni'
import { KrokUpresneni } from './KrokUpresneni'

const KROKY = [
  { nazev: 'Fotky problému', nadpis: 'Vyfoť, co je potřeba opravit', podnadpis: 'Fotka řemeslníkovi řekne víc než dlouhý popis a nabídky budou přesnější. Bez fotky to jde taky.' },
  { nazev: 'Popis', nadpis: 'Co je potřeba udělat?', podnadpis: 'Napiš to vlastními slovy, jako bys to vysvětloval sousedovi.' },
  { nazev: 'Upřesnění', nadpis: 'Upřesni podrobnosti', podnadpis: 'Řemeslník podle toho pozná, kdy a za kolik to zvládne.' },
  { nazev: 'Místo a kontakt', nadpis: 'Kde to je a jak se ti ozvat', podnadpis: `Zatím fungujeme v oblasti ${OBLASTI.map((o) => `${o.nazev} (do ${o.polomerKm} km)`).join(', ')}.` },
  { nazev: 'Kontrola a odeslání', nadpis: 'Zkontroluj a zveřejni', podnadpis: 'Po zveřejnění poptávku uvidí řemeslníci z okolí a začnou posílat nabídky.' },
]

export function NovaPoptavka() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const zverejnit = useZverejnitPoptavku()

  const [k, setK] = useState<Koncept>(() => {
    const meta = user?.user_metadata ?? {}
    const zWebu = vezmiPoptavkuZWebu()
    const ulozeny = zWebu ? null : nactiKoncept()
    const predvybranyObor = params.get('obor')
    return {
      ...PRAZDNY,
      telefon: meta.phone ?? '',
      mesto: meta.city ?? '',
      ...ulozeny,
      ...zWebu,
      ...(predvybranyObor ? { obor: obor(predvybranyObor).nazev } : {}),
      fotky: [],
    }
  })
  const [krok, setKrok] = useState(() => (k.popis ? 1 : 0))
  const [chyby, setChyby] = useState<Record<string, string>>({})
  const [overuji, setOveruji] = useState(false)

  useEffect(() => { ulozKoncept(k) }, [k])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [krok])

  const zmen = (z: Partial<Koncept>) => {
    setK((p) => ({ ...p, ...z }))
    setChyby((c) => Object.fromEntries(Object.entries(c).filter(([pole]) => !(pole in z))))
  }

  const kontrolaKroku = (i: number): Record<string, string> => {
    if (i === 1) {
      const c: Record<string, string> = {}
      if (k.popis.trim().length < 10) c.popis = 'Napiš aspoň jednu větu, co se stalo.'
      if (!k.obor) c.obor = 'Vyber obor. Když si nejsi jistý, dej Ostatní.'
      return c
    }
    if (i === 3) return zkontrolujKontakt(k) as Record<string, string>
    return {}
  }

  const dal = () => {
    const c = kontrolaKroku(krok)
    setChyby(c)
    if (Object.keys(c).length) return
    setKrok((s) => Math.min(s + 1, KROKY.length - 1))
  }

  const prejdiNa = (i: number) => {
    // dopředu jen přes vyplněné kroky
    for (let j = 0; j < i; j++) {
      const c = kontrolaKroku(j)
      if (Object.keys(c).length) { setKrok(j); setChyby(c); return }
    }
    setKrok(i)
  }

  const odeslat = async () => {
    const c = { ...kontrolaKroku(1), ...kontrolaKroku(3) }
    if (Object.keys(c).length) { setChyby(c); setKrok(c.popis || c.obor ? 1 : 3); return }
    setOveruji(true)
    const misto = await overAdresu(k.ulice.trim(), k.mesto.trim())
    setOveruji(false)
    if (misto.stav !== 'v-oblasti') {
      setKrok(3)
      setChyby(misto.stav === 'mimo'
        ? { mesto: `Tahle adresa je mimo oblast, kde zatím fungujeme (${OBLASTI[0].nazev}, do ${OBLASTI[0].polomerKm} km). Mrzí nás to.` }
        : { ulice: 'Adresu jsme nenašli na mapě. Zkontroluj ulici, číslo popisné a obec.' })
      return
    }
    zverejnit.mutate(
      { k, lat: misto.lat, lon: misto.lon },
      {
        onSuccess: ({ id, problemy }) => {
          smazKoncept()
          toast('Poptávka je zveřejněná', problemy.length ? problemy.join(' ') : 'Až přijde první nabídka, dáme ti vědět e-mailem.', problemy.length ? 'error' : 'success')
          navigate(`/poptavky/${id}`)
        },
        onError: (e) => toast('Poptávku se nepodařilo zveřejnit', `${e.message}. Vyplněné údaje zůstaly, zkus to znovu.`, 'error'),
      },
    )
  }

  const zavrit = () => {
    if (k.popis || k.nazev) toast('Rozpracovaná poptávka je uložená', 'Až se vrátíš, budeš pokračovat, kde jsi skončil. Fotky bude potřeba přidat znovu.')
    navigate('/')
  }

  const posledni = krok === KROKY.length - 1
  const info = KROKY[krok]

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center gap-4 border-b border-line bg-surface px-4 py-3.5 sm:px-8">
        <Link to="/" aria-label="Remexo, přehled"><img src="/logo.png" alt="Remexo" className="h-[22px]" /></Link>
        <span className="hidden h-5 w-px bg-line sm:block" />
        <h1 className="hidden text-base font-semibold sm:block">Nová poptávka</h1>
        <button onClick={zavrit} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-soft hover:bg-surface-2 hover:text-ink">
          <X className="size-[18px]" /> <span className="hidden sm:inline">Zavřít a uložit rozpracované</span><span className="sm:hidden">Zavřít</span>
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-wrap items-start gap-10 px-4 pb-32 pt-8 sm:px-8 sm:pt-10">
        <nav aria-label="Kroky poptávky" className="w-full lg:w-[230px]">
          <p className="mb-2 text-sm text-muted lg:hidden">Krok {krok + 1} z {KROKY.length}</p>
          <div className="grid grid-cols-5 gap-1 lg:hidden" aria-hidden>
            {KROKY.map((s, i) => <span key={s.nazev} className={`h-1.5 rounded-full ${i < krok ? 'bg-ink' : i === krok ? 'bg-accent' : 'bg-line'}`} />)}
          </div>
          <ol className="hidden flex-col gap-1 lg:flex">
            {KROKY.map((s, i) => (
              <li key={s.nazev}>
                <button
                  type="button"
                  onClick={() => prejdiNa(i)}
                  aria-current={i === krok ? 'step' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg py-2 text-left text-sm ${i === krok ? 'font-semibold' : i < krok ? 'text-soft hover:text-ink' : 'text-faint hover:text-soft'}`}
                >
                  <span className={`grid size-[26px] shrink-0 place-items-center rounded-full text-[13px] ${i < krok ? 'bg-ink text-surface' : i === krok ? 'bg-accent text-on-accent' : 'border-[1.5px] border-line-strong'}`}>
                    {i < krok ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  {s.nazev}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="flex min-w-0 max-w-[680px] flex-[999_1_480px] flex-col gap-7">
          <div>
            <h2 className="text-[26px] font-semibold tracking-tight">{info.nadpis}</h2>
            <p className="mt-1.5 text-muted">{info.podnadpis}</p>
          </div>

          {krok === 0 && <KrokFotky k={k} zmen={zmen} chyby={chyby} />}
          {krok === 1 && <KrokPopis k={k} zmen={zmen} chyby={chyby} />}
          {krok === 2 && <KrokUpresneni k={k} zmen={zmen} chyby={chyby} />}
          {krok === 3 && <KrokMisto k={k} zmen={zmen} chyby={chyby} />}
          {krok === 4 && <Kontrola k={k} upravit={setKrok} />}

          <div className="flex items-center gap-3 border-t border-line pt-5">
            {krok > 0 && <Button varianta="secondary" velikost="lg" onClick={() => setKrok(krok - 1)}>Zpět</Button>}
            {posledni ? (
              <Button velikost="lg" className="ml-auto" onClick={odeslat} loading={overuji || zverejnit.isPending}>
                {overuji ? 'Ověřuji adresu…' : zverejnit.isPending ? 'Zveřejňuji…' : 'Zveřejnit poptávku'}
              </Button>
            ) : (
              <Button velikost="lg" className="ml-auto" onClick={dal}>
                {krok === 0 && !k.fotky.length ? 'Pokračovat bez fotky' : 'Pokračovat'}
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Kontrola({ k, upravit }: { k: Koncept; upravit: (krok: number) => void }) {
  const fakta = useMemo(
    () => [
      ['Kdy', k.termin], ['Typ objektu', k.objekt], ['Parkování', k.parkovani],
      ...(k.rozpocet.trim() ? [['Rozpočet', k.rozpocet.trim()]] : []),
    ],
    [k],
  )
  const Upravit = ({ krok }: { krok: number }) => (
    <button type="button" onClick={() => upravit(krok)} className="ml-auto text-sm font-medium text-accent-text hover:underline">Upravit</button>
  )
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      <section className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <OborIkona kategorie={k.obor} velikost={40} />
          <div className="min-w-0">
            <p className="text-[13px] text-muted">{obor(k.obor).nazev}</p>
            <p className="text-lg font-semibold">{k.nazev.trim() || k.popis.trim().split(/[.\n]/)[0].slice(0, 80)}</p>
          </div>
          <Upravit krok={1} />
        </div>
        <p className="whitespace-pre-line">{k.popis}</p>
        {k.fotky.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {k.fotky.map((f, i) => <img key={f.id} src={f.nahled} alt={`Fotka ${i + 1}`} className="size-20 rounded-[10px] object-cover" />)}
          </div>
        )}
      </section>
      <section className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line p-5">
        <dl className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
          {fakta.map(([a, b]) => (
            <div key={a}><dt className="text-xs text-muted">{a}</dt><dd className="text-sm font-medium">{b}</dd></div>
          ))}
        </dl>
        <Upravit krok={2} />
      </section>
      <section className="flex items-start gap-3 border-t border-line p-5">
        <dl className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
          <div><dt className="text-xs text-muted">Adresa</dt><dd className="text-sm font-medium">{k.ulice}, {k.mesto}</dd></div>
          <div><dt className="text-xs text-muted">Telefon</dt><dd className="text-sm font-medium">{k.telefon}</dd></div>
        </dl>
        <Upravit krok={3} />
      </section>
    </div>
  )
}

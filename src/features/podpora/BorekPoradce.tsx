import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp, LoaderCircle, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { BorekChyba, poradSeSBorkem } from '@/services/borek'

type Zprava = { kdo: 'ja' | 'borek'; text: string }

const RYCHLE = [
  { text: 'Nevím, jakého řemeslníka potřebuju', dotaz: 'Nevím, jakého řemeslníka na svůj problém potřebuji. Jak to zjistím?' },
  { text: 'Co mám napsat do poptávky?', dotaz: 'Co všechno mám napsat do poptávky, aby jí řemeslník rozuměl?' },
  { text: 'Jak to celé funguje?', dotaz: 'Jak Remexo funguje a co se stane potom, co zadám poptávku?' },
]

/**
 * Plovoucí Bořek-poradce pro zákazníka (jako v pilotu). Odpověď je vždy text, nikdy HTML.
 * Na stránkách, kde by překážel (zprávy, zadávání poptávky), se neukazuje.
 */
export function BorekPoradce() {
  const { role } = useAuth()
  const { pathname } = useLocation()
  const [otevreno, setOtevreno] = useState(false)
  const [zpravy, setZpravy] = useState<Zprava[]>([])
  const [dotaz, setDotaz] = useState('')
  const [pracuje, setPracuje] = useState(false)
  const telo = useRef<HTMLDivElement>(null)
  const vstup = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    telo.current?.scrollTo({ top: telo.current.scrollHeight, behavior: 'smooth' })
  }, [zpravy, pracuje])

  useEffect(() => {
    if (!otevreno) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOtevreno(false)
    window.addEventListener('keydown', esc)
    // Na mobilu by klávesnice zakryla půl obrazovky, fokus jen na počítači.
    if (window.innerWidth >= 1024) setTimeout(() => vstup.current?.focus(), 50)
    return () => window.removeEventListener('keydown', esc)
  }, [otevreno])

  if (role !== 'customer' || pathname.startsWith('/zpravy') || pathname.startsWith('/nova')) return null

  const zeptat = async (text: string) => {
    const t = text.trim()
    if (!t || pracuje) return
    if (t.length > 500) {
      setZpravy((z) => [...z, { kdo: 'borek', text: 'Zkus dotaz napsat kratší, ať se v tom vyznám.' }])
      return
    }
    setZpravy((z) => [...z, { kdo: 'ja', text: t }])
    setDotaz('')
    setPracuje(true)
    try {
      const odpoved = await poradSeSBorkem(t)
      setZpravy((z) => [...z, { kdo: 'borek', text: odpoved }])
    } catch (e) {
      setZpravy((z) => [...z, {
        kdo: 'borek',
        text: e instanceof BorekChyba && e.pretizeno
          ? 'Jsem zrovna zavalený, moc lidí se ptá naráz. Zkus to prosím za minutu.'
          : e instanceof Error && e.message.includes('hodně lidem')
            ? e.message
            : 'Teď se mi nedaří odpovědět. Zkus to prosím za chvíli, nebo rovnou zadej poptávku a já ti s ní pomůžu.',
      }])
    } finally {
      setPracuje(false)
    }
  }

  const odeslat = (e: FormEvent) => {
    e.preventDefault()
    void zeptat(dotaz)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOtevreno(true)}
        aria-label="Zeptat se Bořka"
        className={`fixed bottom-[88px] right-4 z-40 grid size-14 place-items-center overflow-hidden rounded-full bg-accent shadow-[0_8px_24px_rgba(245,160,0,0.35)] transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6 ${otevreno ? 'hidden' : ''}`}
      >
        <img src="/borek.png" alt="" className="mt-3 size-14 object-cover object-top" />
      </button>

      {otevreno && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-end lg:justify-end lg:bg-transparent lg:p-6" onClick={() => setOtevreno(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Zeptej se Bořka"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-raised lg:h-[560px] lg:max-w-[400px] lg:rounded-2xl lg:shadow-[0_16px_48px_rgba(23,27,36,0.18)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <img src="/borek.png" alt="" className="size-10 shrink-0 rounded-[12px] bg-accent-soft object-cover object-top" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">Zeptej se Bořka</h2>
                <p className="text-[13px] text-muted">Poradí, koho potřebuješ a co napsat do poptávky.</p>
              </div>
              <button type="button" onClick={() => setOtevreno(false)} className="-m-1 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Zavřít">
                <X className="size-5" />
              </button>
            </div>

            <div ref={telo} className="flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {zpravy.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="mb-1 text-sm font-medium">S čím potřebuješ pomoct?</p>
                  {RYCHLE.map((r) => (
                    <button
                      key={r.text}
                      type="button"
                      onClick={() => zeptat(r.dotaz)}
                      className="rounded-[10px] border border-line-strong px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:border-accent hover:bg-accent-soft"
                    >
                      {r.text}
                    </button>
                  ))}
                </div>
              ) : (
                zpravy.map((z, i) =>
                  z.kdo === 'ja' ? (
                    <p key={i} className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-tr-md bg-accent px-3.5 py-2.5 text-sm text-on-accent">{z.text}</p>
                  ) : (
                    <div key={i} className="flex max-w-[90%] gap-2">
                      <img src="/borek.png" alt="" className="size-7 shrink-0 rounded-full bg-accent-soft object-cover object-top" />
                      <p className="whitespace-pre-wrap rounded-2xl rounded-tl-md bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed">{z.text}</p>
                    </div>
                  ),
                )
              )}
              {pracuje && (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />Bořek přemýšlí…
                </p>
              )}
            </div>

            <form onSubmit={odeslat} className="flex items-end gap-2 border-t border-line p-3">
              <textarea
                ref={vstup}
                value={dotaz}
                onChange={(e) => setDotaz(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void zeptat(dotaz) } }}
                rows={1}
                maxLength={500}
                placeholder="Napiš otázku…"
                aria-label="Otázka pro Bořka"
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-accent"
              />
              <button type="submit" disabled={!dotaz.trim() || pracuje} aria-label="Odeslat" className="grid size-[42px] shrink-0 place-items-center rounded-[10px] bg-accent text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-40">
                <ArrowUp className="size-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

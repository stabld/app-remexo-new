import { useRef, useState, type FormEvent } from 'react'
import { LoaderCircle, Sparkles, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { BorekChyba, zeptejSeBorka } from '@/services/borek'
import { obor } from '../kategorie'
import type { KrokProps } from './KrokyZakladni'

export const TERMINY = ['Co nejdřív', 'Během několika dnů', 'Tento týden', 'Příští týden', 'Termín je flexibilní']
export const OBJEKTY = ['Byt', 'Rodinný dům', 'Chata nebo chalupa', 'Kancelář nebo provozovna', 'Jiné']
export const PARKOVANI = ['Bez problémů', 'Placené parkování', 'Těžko se parkuje']

type Zprava = { od: 'ty' | 'borek'; text: string }

function Bublina({ z }: { z: Zprava }) {
  if (z.od === 'ty') return <p className="max-w-[85%] self-end whitespace-pre-line rounded-[14px] rounded-br-[4px] bg-ink px-3.5 py-2.5 text-sm text-surface">{z.text}</p>
  const varovani = z.text.startsWith('POZOR')
  return (
    <div className="flex max-w-[90%] items-start gap-2.5 self-start">
      <img src="/borek.png" alt="" className="size-8 shrink-0 rounded-full bg-accent-soft object-cover" />
      <p className={`whitespace-pre-line rounded-[14px] rounded-bl-[4px] px-3.5 py-2.5 text-sm ${varovani ? 'border border-danger bg-[#FEF3F2] text-danger-text dark:bg-danger/15' : 'border border-line bg-surface'}`}>
        {varovani ? z.text.replace(/[ \t]+(?=[1-9]\.\s)/g, '\n') : z.text}
      </p>
    </div>
  )
}

/** Krok 3: Bořek se doptá (volitelně) a vedle toho jdou údaje vyplnit ručně. */
export function KrokUpresneni({ k, zmen }: KrokProps) {
  const [chat, setChat] = useState<Zprava[]>([])
  const [historie, setHistorie] = useState('')
  const [odpoved, setOdpoved] = useState('')
  const [pracuje, setPracuje] = useState(false)
  const [chyba, setChyba] = useState('')
  const [puvodni, setPuvodni] = useState<{ nazev: string; popis: string; obor: string } | null>(null)
  const dolu = useRef<HTMLDivElement>(null)

  const posli = async (text: string, nova: boolean) => {
    const celaHistorie = nova ? text : `${historie}\nUpřesnění od uživatele: ${text}`
    setHistorie(celaHistorie)
    setChat((c) => [...c, { od: 'ty', text }])
    setPracuje(true); setChyba('')
    try {
      const o = await zeptejSeBorka(celaHistorie, k.fotky)
      if (o.status === 'question') {
        setChat((c) => [...c, { od: 'borek', text: o.message }])
      } else {
        setPuvodni({ nazev: k.nazev, popis: k.popis, obor: k.obor })
        zmen({ nazev: o.nazev, popis: o.popis, obor: obor(o.kategorie).nazev, nalehavost: o.nalehavost, odhadCeny: o.odhad_ceny, odBorka: true, radaBorka: o.rada ?? '' })
        setChat((c) => [...c, { od: 'borek', text: 'Hotovo, zadání jsem učesal. Zkontroluj ho níž, můžeš ho dál upravit.' }])
      }
    } catch (e) {
      setChyba(e instanceof BorekChyba && e.pretizeno ? 'Bořek je teď zavalený. Zkus to za minutu, nebo pokračuj bez něj.' : 'Bořek teď neodpovídá. Klidně pokračuj bez něj, nic se neztratí.')
    } finally {
      setPracuje(false)
      setTimeout(() => dolu.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }

  const odeslatOdpoved = (e: FormEvent) => {
    e.preventDefault()
    if (!odpoved.trim() || pracuje) return
    posli(odpoved.trim(), false)
    setOdpoved('')
  }

  const vratit = () => {
    if (!puvodni) return
    zmen({ ...puvodni, odBorka: false, radaBorka: '', nalehavost: 'Střední', odhadCeny: 'Dohodou' })
    setPuvodni(null)
  }

  const cekaNaOdpoved = chat.length > 0 && chat[chat.length - 1].od === 'borek' && !k.odBorka

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[16px] border border-line bg-surface">
        <div className="flex items-start gap-3.5 p-5">
          <img src="/borek.png" alt="" className="size-10 shrink-0 rounded-[12px] bg-accent-soft object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Bořek se může doptat na podrobnosti</p>
            <p className="mt-0.5 text-sm text-soft">Zeptá se na dvě tři věci, které řemeslníci potřebují k nacenění, a zadání učeše. Nemusíš, klidně to přeskoč.</p>
            {!chat.length && (
              <Button varianta="secondary" className="mt-3" onClick={() => posli(k.popis.trim() || 'Posílám fotografie k analýze.', true)} disabled={!k.popis.trim() && !k.fotky.length}>
                <Sparkles className="size-4" /> Doplnit s Bořkem
              </Button>
            )}
          </div>
        </div>

        {chat.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-line p-5">
            {chat.map((z, i) => <Bublina key={i} z={z} />)}
            {pracuje && <p className="flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Bořek přemýšlí…</p>}
            {chyba && <p className="text-sm text-danger-text">{chyba}</p>}
            {cekaNaOdpoved && !pracuje && (
              <form onSubmit={odeslatOdpoved} className="mt-1 flex gap-2">
                <label className="flex-1">
                  <span className="sr-only">Odpověď Bořkovi</span>
                  <input value={odpoved} onChange={(e) => setOdpoved(e.target.value)} autoFocus placeholder="Napiš odpověď" className="w-full rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-accent focus:ring-3 focus:ring-accent/20" />
                </label>
                <Button type="submit" disabled={!odpoved.trim()}>Odpovědět</Button>
              </form>
            )}
            {k.odBorka && (
              <div className="mt-1 flex flex-col gap-2 rounded-[12px] bg-accent-soft px-4 py-3 text-sm">
                <p><b className="font-semibold">{k.nazev}</b> · {k.obor}</p>
                <p className="whitespace-pre-line text-soft">{k.popis}</p>
                {k.odhadCeny && <p className="text-soft">Odhad ceny: {k.odhadCeny}</p>}
                {k.radaBorka && <p className="text-soft">Tip: {k.radaBorka}</p>}
                {puvodni && (
                  <button type="button" onClick={vratit} className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-accent-text hover:underline">
                    <Undo2 className="size-4" /> Vrátit můj původní text
                  </button>
                )}
              </div>
            )}
            <div ref={dolu} />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <h3 className="text-base font-semibold">Pár praktických věcí</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Kdy to potřebuješ" value={k.termin} onChange={(e) => zmen({ termin: e.target.value })}>
            {TERMINY.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select label="Typ objektu" value={k.objekt} onChange={(e) => zmen({ objekt: e.target.value })}>
            {OBJEKTY.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select label="Parkování" value={k.parkovani} onChange={(e) => zmen({ parkovani: e.target.value })}>
            {PARKOVANI.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Rozpočet (nepovinný)" value={k.rozpocet} onChange={(e) => zmen({ rozpocet: e.target.value })} placeholder="Třeba do 2 000 Kč" />
        </div>
      </section>
    </div>
  )
}

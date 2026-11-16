import { useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MAX_FOTEK, pripravFotku } from '@/services/fotky'
import { OBORY } from '../kategorie'
import type { Koncept } from './koncept'

export type KrokProps = { k: Koncept; zmen: (z: Partial<Koncept>) => void; chyby: Record<string, string> }

export function KrokFotky({ k, zmen }: KrokProps) {
  const vstup = useRef<HTMLInputElement>(null)
  const [nacitam, setNacitam] = useState(false)
  const [chyba, setChyba] = useState('')

  const pridej = async (soubory: FileList | null) => {
    if (!soubory?.length) return
    setNacitam(true); setChyba('')
    const volno = MAX_FOTEK - k.fotky.length
    const nove = (await Promise.all([...soubory].slice(0, volno).map(pripravFotku))).filter((f) => f !== null)
    if (nove.length < Math.min(soubory.length, volno)) setChyba('Některý soubor nešel načíst. Musí to být fotka (JPG, PNG, HEIC z iPhonu převeď prosím na JPG).')
    if (soubory.length > volno) setChyba(`Přidat jde nejvýš ${MAX_FOTEK} fotek.`)
    zmen({ fotky: [...k.fotky, ...nove] })
    setNacitam(false)
    if (vstup.current) vstup.current.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {k.fotky.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {k.fotky.map((f, i) => (
            <li key={f.id} className="relative aspect-square overflow-hidden rounded-[12px] bg-placeholder">
              <img src={f.nahled} alt={`Fotka ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => zmen({ fotky: k.fotky.filter((x) => x.id !== f.id) })}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label={`Odebrat fotku ${i + 1}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {k.fotky.length < MAX_FOTEK && (
        <button
          type="button"
          onClick={() => vstup.current?.click()}
          disabled={nacitam}
          className="flex flex-col items-center gap-3 rounded-[16px] border-2 border-dashed border-line-strong bg-surface px-6 py-10 text-center transition-colors hover:border-accent hover:bg-accent-soft/40"
        >
          <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent-text">
            {k.fotky.length ? <ImagePlus className="size-6" /> : <Camera className="size-6" />}
          </span>
          <span className="text-base font-semibold">{nacitam ? 'Načítám…' : k.fotky.length ? 'Přidat další fotku' : 'Vyfotit nebo nahrát fotky'}</span>
          <span className="text-sm text-muted">Až {MAX_FOTEK} fotek. Vyfoť závadu zblízka a pak celé místo, ať je vidět souvislost.</span>
        </button>
      )}
      <input ref={vstup} type="file" accept="image/*" multiple hidden onChange={(e) => pridej(e.target.files)} />
      {chyba && <p className="text-sm text-danger-text">{chyba}</p>}
    </div>
  )
}

export function KrokPopis({ k, zmen, chyby }: KrokProps) {
  return (
    <div className="flex flex-col gap-5">
      <Textarea
        label="Co se stalo a co je potřeba udělat"
        rows={6}
        value={k.popis}
        onChange={(e) => zmen({ popis: e.target.value })}
        placeholder="Třeba: Zásuvka u kuchyňské linky jiskří, když zapojím konvici, a je volná ve zdi. Potřebuji ji vyměnit."
        chyba={chyby.popis}
        napoveda="Telefon a adresu sem nepiš. Zadáš je za chvíli a uvidí je jen řemeslník, kterého vybereš."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Obor" value={k.obor} onChange={(e) => zmen({ obor: e.target.value })} chyba={chyby.obor}>
          <option value="">Vyber obor</option>
          {OBORY.map((o) => <option key={o.nazev} value={o.nazev}>{o.nazev}</option>)}
        </Select>
        <Input
          label="Krátký název (nepovinný)"
          value={k.nazev}
          onChange={(e) => zmen({ nazev: e.target.value })}
          placeholder="Výměna zásuvky v kuchyni"
          maxLength={80}
        />
      </div>
    </div>
  )
}

export function KrokMisto({ k, zmen, chyby }: KrokProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <Input label="Ulice a číslo popisné" autoComplete="street-address" value={k.ulice} onChange={(e) => zmen({ ulice: e.target.value })} chyba={chyby.ulice} placeholder="Nová Ulice 12" />
        <Input label="Obec" autoComplete="address-level2" value={k.mesto} onChange={(e) => zmen({ mesto: e.target.value })} chyba={chyby.mesto} placeholder="Olomouc" />
      </div>
      <Input label="Telefon" type="tel" autoComplete="tel" value={k.telefon} onChange={(e) => zmen({ telefon: e.target.value })} chyba={chyby.telefon} placeholder="731 573 644" className="sm:max-w-xs" />
      <p className="rounded-[12px] bg-surface-2 px-4 py-3 text-sm text-soft">
        Na tržišti uvidí řemeslníci jen obec a přibližné místo na mapě. Ulici a telefon ukážeme jen tomu, jehož nabídku přijmeš.
      </p>
    </div>
  )
}

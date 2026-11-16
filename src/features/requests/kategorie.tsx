import { Droplet, Hammer, KeyRound, PaintRoller, Wrench, Zap, type LucideIcon } from 'lucide-react'

/** Obory podle pilotu. Každý má vlastní ikonu a barvu – podle nich se poptávky poznají na první pohled. */
export const OBORY: { nazev: string; ikona: LucideIcon; barva: string; popis: string }[] = [
  { nazev: 'Instalatérství', ikona: Droplet, barva: 'bg-[#E3F0FB] text-[#1665A8] dark:bg-[#16324D] dark:text-[#8CC4F2]', popis: 'Kapající kohoutek, WC, odpad' },
  { nazev: 'Elektrikář', ikona: Zap, barva: 'bg-[#FFF1D1] text-[#9A5B00] dark:bg-[#3A2C10] dark:text-[#FFC55C]', popis: 'Zásuvky, světla, jistič' },
  { nazev: 'Malíř', ikona: PaintRoller, barva: 'bg-[#F1E9FB] text-[#6B3FA8] dark:bg-[#2E2346] dark:text-[#C9A9F2]', popis: 'Vymalování, opravy omítky' },
  { nazev: 'Tesař', ikona: Hammer, barva: 'bg-[#F6EADF] text-[#8A4B17] dark:bg-[#3A2A1C] dark:text-[#E8B48A]', popis: 'Dřevo, podlahy, pergoly' },
  { nazev: 'Zámečník', ikona: KeyRound, barva: 'bg-[#E4F3EE] text-[#1C6B52] dark:bg-[#15352B] dark:text-[#86D5B8]', popis: 'Zámky, dveře, kování' },
  { nazev: 'Ostatní', ikona: Wrench, barva: 'bg-[#EDEFF3] text-[#475467] dark:bg-[#232D3E] dark:text-[#B6C1D1]', popis: 'Cokoli dalšího doma' },
]

/** DB občas vrací obor velkými písmeny nebo jinak skloněný – sjednotíme na název oboru. */
export function obor(kategorie: string | null | undefined) {
  const k = (kategorie ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  return OBORY.find((o) => k && o.nazev.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().startsWith(k.slice(0, 5))) ?? OBORY[OBORY.length - 1]
}

export function OborIkona({ kategorie, velikost = 44 }: { kategorie: string | null | undefined; velikost?: number }) {
  const o = obor(kategorie)
  return (
    <span style={{ width: velikost, height: velikost }} className={`grid shrink-0 place-items-center rounded-[12px] ${o.barva}`} aria-hidden>
      <o.ikona style={{ width: velikost * 0.45, height: velikost * 0.45 }} strokeWidth={2} />
    </span>
  )
}

import type { Ton } from '@/components/ui/Badge'
import type { Poptavka } from '@/lib/types'

/**
 * Zobrazený stav poptávky odvozený jen ze sloupců, které v DB existují.
 * Obchodní logika se tu nemění, jen se pojmenovává.
 */
export type ZobrazenyStav = 'ceka-na-nabidky' | 'nove-nabidky' | 'realizace' | 'ceka-na-potvrzeni' | 'hotovo' | 'zruseno'

export const STAVY: Record<ZobrazenyStav, { text: string; ton: Ton; krok: number; naTebe: boolean }> = {
  'ceka-na-nabidky': { text: 'Čeká na nabídky', ton: 'neutral', krok: 0, naTebe: false },
  'nove-nabidky': { text: 'Má nové nabídky', ton: 'accent', krok: 1, naTebe: true },
  realizace: { text: 'Probíhá realizace', ton: 'info', krok: 2, naTebe: false },
  'ceka-na-potvrzeni': { text: 'Čeká na potvrzení dokončení', ton: 'accent', krok: 2, naTebe: true },
  hotovo: { text: 'Dokončeno', ton: 'success', krok: 3, naTebe: false },
  zruseno: { text: 'Zrušeno', ton: 'muted', krok: 0, naTebe: false },
}

export function zobrazenyStav(p: Pick<Poptavka, 'status' | 'dokonceni_navrzeno'>, cekajiciNabidky: number): ZobrazenyStav {
  switch (p.status) {
    case 'waiting':
      return cekajiciNabidky > 0 ? 'nove-nabidky' : 'ceka-na-nabidky'
    case 'active':
      return p.dokonceni_navrzeno ? 'ceka-na-potvrzeni' : 'realizace'
    case 'done':
      return 'hotovo'
    case 'cancelled':
      return 'zruseno'
  }
}

/** Index kroku v průběhu zakázky (0 Zadáno … 3 Hotovo). */
export const krokPrubehu = (s: ZobrazenyStav) => STAVY[s].krok

/** Z adresy (nebo města) pro veřejné zobrazení jen obec / část obce. */
export function lokalita(p: Pick<Poptavka, 'mesto'>, mistoZPopisu?: string) {
  if (p.mesto) return p.mesto
  if (!mistoZPopisu) return null
  const casti = mistoZPopisu.split(',')
  return casti[casti.length - 1].trim() || null
}

export const sklonujNabidky = (n: number) => (n === 1 ? 'nabídka' : n >= 2 && n <= 4 ? 'nabídky' : 'nabídek')

/** Nejnižší cena z nabídek, kde je cena číslo („850 Kč“). Texty jako „Dohodou“ se přeskočí. */
export function nejnizsiCena(ceny: (string | null)[]): string | null {
  const cisla = ceny
    .map((c) => (c ? Number(c.replace(/[^\d,]/g, '').replace(',', '.')) : NaN))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!cisla.length) return null
  return Math.min(...cisla).toLocaleString('cs') + ' Kč'
}

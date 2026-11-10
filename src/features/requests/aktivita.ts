import type { MojePoptavka } from './api'

/** co = co se stalo, kde = u které poptávky. Věty bez skloňování názvů, ať nevznikají krkolomnosti. */
export type Udalost = { kdy: string; text: string; kde: string; nova: boolean; poptavkaId: number }

/** Poslední dění napříč poptávkami, poskládané ze skutečných záznamů (nabídky, zadání, odstoupení). */
export function posledniAktivita(poptavky: MojePoptavka[], limit = 5): Udalost[] {
  const udalosti: Udalost[] = []
  for (const p of poptavky) {
    const kde = p.title || 'Poptávka'
    udalosti.push({ kdy: p.created_at, text: 'Poptávka zadána', kde, nova: false, poptavkaId: p.id })
    for (const n of p.nabidky) {
      udalosti.push({ kdy: n.created_at, text: `Nová nabídka: ${n.craftsman_name || 'řemeslník'}`, kde, nova: n.status === 'pending', poptavkaId: p.id })
    }
    if (p.odstoupeni) {
      udalosti.push({ kdy: p.odstoupeni.created_at, text: `Odstoupil: ${p.odstoupeni.craftsman_name || 'řemeslník'}`, kde, nova: false, poptavkaId: p.id })
    }
    // dokonceni_navrzeno je v DB čas návrhu; kdyby byl jen příznak, událost bez času nepřidáme
    if (typeof p.dokonceni_navrzeno === 'string' && p.status === 'active') {
      udalosti.push({ kdy: p.dokonceni_navrzeno, text: `Hlásí hotovo: ${p.craftsman_name || 'řemeslník'}`, kde, nova: true, poptavkaId: p.id })
    }
  }
  return udalosti.sort((a, b) => b.kdy.localeCompare(a.kdy)).slice(0, limit)
}

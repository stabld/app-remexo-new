import type { NovaFotka } from '@/services/fotky'

/** Vše, co zákazník při zadávání vyplní. Fotky se do konceptu v prohlížeči neukládají (jsou velké). */
export type Koncept = {
  nazev: string
  popis: string
  obor: string
  termin: string
  objekt: string
  parkovani: string
  rozpocet: string
  nalehavost: string
  odhadCeny: string
  ulice: string
  mesto: string
  telefon: string
  fotky: NovaFotka[]
  /** Bořek dodal zadání (pak se ukáže jeho tip a odhad ceny) */
  odBorka: boolean
  radaBorka: string
}

export const PRAZDNY: Koncept = {
  nazev: '', popis: '', obor: '', termin: 'Během několika dnů', objekt: 'Byt', parkovani: 'Bez problémů', rozpocet: '',
  nalehavost: 'Střední', odhadCeny: 'Dohodou', ulice: '', mesto: '', telefon: '', fotky: [], odBorka: false, radaBorka: '',
}

const KLIC = 'remexo-koncept-poptavky'
const KLIC_WEB = 'remexo-poptavka-z-webu'

export function nactiKoncept(): Partial<Koncept> | null {
  try {
    const s = localStorage.getItem(KLIC)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function ulozKoncept(k: Koncept) {
  try {
    const { fotky: _fotky, ...bezFotek } = k
    localStorage.setItem(KLIC, JSON.stringify(bezFotek))
  } catch { /* plné úložiště nebo soukromé okno */ }
}

export function smazKoncept() {
  try { localStorage.removeItem(KLIC) } catch { /* nic */ }
}

/**
 * Poptávka předaná z remexo.cz v adrese (?poptavka=base64 JSON), stejný formát jako pilot.
 * Uložíme ji do sessionStorage, ať přežije přihlášení i přesměrování z Googlu.
 */
export function prevezmiPoptavkuZWebu() {
  const p = new URLSearchParams(location.search).get('poptavka')
  if (!p) return
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(p))))
    sessionStorage.setItem(KLIC_WEB, json)
  } catch { /* poškozený odkaz – ignorujeme */ }
}

export function vezmiPoptavkuZWebu(): Partial<Koncept> | null {
  try {
    const s = sessionStorage.getItem(KLIC_WEB)
    if (!s) return null
    sessionStorage.removeItem(KLIC_WEB)
    const d = JSON.parse(s)
    return {
      nazev: d.title ?? '', popis: d.popis ?? '', obor: d.kategorie ?? '',
      nalehavost: d.nalehavost || 'Střední', odhadCeny: d.cena || 'Dohodou', odBorka: !!d.title,
    }
  } catch { return null }
}

export const cekaPoptavkaZWebu = () => {
  try { return !!sessionStorage.getItem(KLIC_WEB) } catch { return false }
}

/** Text popisu ve formátu, který čte pilot i nová appka (lib/popis.ts). Ulice a telefon sem nepatří. */
export function sestavPopis(k: Koncept) {
  const radky = [
    '📍 ' + k.mesto.trim(),
    '📅 Termín: ' + k.termin,
    '🏠 Typ objektu: ' + k.objekt,
    '🚗 Parkování: ' + k.parkovani,
    ...(k.rozpocet.trim() ? ['💰 Rozpočet: ' + k.rozpocet.trim()] : []),
  ]
  return k.popis.trim() + '\n\n---\n📋 DOPLŇUJÍCÍ INFORMACE:\n' + radky.join('\n')
}

/** Kontroly ze pilotu. Vrací chybu u pole, nebo nic. */
export function zkontrolujKontakt(k: Pick<Koncept, 'ulice' | 'mesto' | 'telefon'>) {
  const chyby: Partial<Record<'ulice' | 'mesto' | 'telefon', string>> = {}
  const ulice = k.ulice.trim(), mesto = k.mesto.trim()
  if (ulice.length < 5 || !/\p{L}/u.test(ulice) || !/\d/.test(ulice)) chyby.ulice = 'Zadej ulici i číslo popisné, třeba Nová Ulice 12.'
  if (mesto.length < 2 || /\d/.test(mesto)) chyby.mesto = 'Zadej název obce bez čísel.'
  if (!/^(\+420|00420)?\d{9}$/.test(k.telefon.replace(/[\s\-().]/g, ''))) chyby.telefon = 'Zadej české číslo (9 číslic), třeba 731 573 644.'
  return chyby
}

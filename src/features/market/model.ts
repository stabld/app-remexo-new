import type { Poptavka } from '@/lib/types'
import { vzdalenostKm } from '@/services/geo'
import type { Poloha } from './api'

const normalizuj = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

/** Obory s vlastním filtrem. Všechno ostatní (i staré kategorie jako „Truhlářství“) patří pod Ostatní. */
export const ZNAME_OBORY = ['Instalatérství', 'Elektrikář', 'Malíř', 'Tesař', 'Zámečník']

/** Stejné porovnání jako v pilotu, aby filtr ukazoval totéž. */
export function oborSedi(kategorie: string | null, filtr: string): boolean {
  if (normalizuj(filtr) === 'ostatni') return !ZNAME_OBORY.some((k) => oborSedi(kategorie, k))
  const a = normalizuj(kategorie)
  const b = normalizuj(filtr)
  if (!a || !b) return false
  return a === b || a.startsWith(b) || b.startsWith(a)
}

export function vzdalenost(p: Pick<Poptavka, 'lat' | 'lon'>, poloha: Poloha | null | undefined): number | null {
  if (!poloha || p.lat == null || p.lon == null) return null
  const lat = Number(p.lat)
  const lon = Number(p.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return vzdalenostKm(poloha.lat, poloha.lon, lat, lon)
}

export function formatKm(km: number | null): string | null {
  if (km == null) return null
  if (km < 1) return 'do 1 km'
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`
}

/** Naléhavost ukládá pilot jako „Vysoká“ / „Střední“ / „Nízká“. Zvýrazníme jen spěchající. */
export function specha(p: Pick<Poptavka, 'urgency'>) {
  return normalizuj(p.urgency) === 'vysoka'
}

/** Odhad zákazníka, pokud nějaký zadal. „Dohodou“ a prázdno = bez odhadu. */
export function rozpocet(p: Pick<Poptavka, 'price_estimate'>, zPopisu?: string): string | null {
  const t = (p.price_estimate || zPopisu || '').trim()
  if (!t || normalizuj(t) === 'dohodou') return null
  return t
}

/** Proč zákazník nabídku odmítl – formulace pro řemeslníka (shodná s pilotem). */
export const DUVOD_PRO_REMESLNIKA: Record<string, string> = {
  cena: 'cena je pro zákazníka příliš vysoká',
  termin: 'zákazníkovi nevyhovuje termín',
  jiny_remeslnik: 'zákazník vybral jiného řemeslníka',
  nepotrebuji: 'zákazník už práci nepotřebuje nebo ji vyřešil jinak',
  jine: 'zákazník uvedl jiný důvod',
}

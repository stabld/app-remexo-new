import { ClipboardList, Hammer, MapPinned, MessageCircle, ShieldCheck, User, Wallet, type LucideIcon } from 'lucide-react'
import type { Role } from '@/lib/types'

export type PolozkaNavigace = { cesta: string; nazev: string; ikona: LucideIcon; bublina?: 'nabidky' }

export const NAVIGACE: Record<Role, PolozkaNavigace[]> = {
  customer: [
    { cesta: '/poptavky', nazev: 'Moje poptávky', ikona: ClipboardList, bublina: 'nabidky' },
    { cesta: '/zpravy', nazev: 'Zprávy', ikona: MessageCircle },
    { cesta: '/platby', nazev: 'Platby', ikona: ShieldCheck },
    { cesta: '/profil', nazev: 'Profil', ikona: User },
  ],
  craftsman: [
    { cesta: '/trziste', nazev: 'Tržiště', ikona: MapPinned },
    { cesta: '/prace', nazev: 'Moje práce', ikona: Hammer },
    { cesta: '/zpravy', nazev: 'Zprávy', ikona: MessageCircle },
    { cesta: '/vydelky', nazev: 'Výdělky', ikona: Wallet },
    { cesta: '/profil', nazev: 'Profil', ikona: User },
  ],
}

export const DOMOVSKA_STRANKA: Record<Role, string> = { customer: '/poptavky', craftsman: '/trziste' }

/** Nadpis do hlavičky podle aktuální adresy. */
export function nadpisStranky(cesta: string, role: Role): string {
  if (cesta.startsWith('/nova')) return 'Nová poptávka'
  if (/^\/poptavky\/\d+/.test(cesta)) return 'Detail poptávky'
  return NAVIGACE[role].find((p) => cesta.startsWith(p.cesta))?.nazev ?? ''
}

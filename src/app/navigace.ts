import { Briefcase, ClipboardList, House, Map, MessageCircle, Send, User, Wallet, type LucideIcon } from 'lucide-react'
import type { Role } from '@/lib/types'

export type Bublina = 'nabidky'
export type PolozkaNavigace = { cesta: string; nazev: string; kratce?: string; ikona: LucideIcon; bublina?: Bublina }

export const NAVIGACE: Record<Role, PolozkaNavigace[]> = {
  customer: [
    { cesta: '/', nazev: 'Přehled', ikona: House },
    { cesta: '/poptavky', nazev: 'Moje poptávky', kratce: 'Poptávky', ikona: ClipboardList, bublina: 'nabidky' },
    { cesta: '/zpravy', nazev: 'Zprávy', ikona: MessageCircle },
    { cesta: '/profil', nazev: 'Profil', ikona: User },
  ],
  craftsman: [
    { cesta: '/', nazev: 'Přehled', ikona: House },
    { cesta: '/trziste', nazev: 'Tržiště', ikona: Map },
    { cesta: '/nabidky', nazev: 'Moje nabídky', kratce: 'Nabídky', ikona: Send },
    { cesta: '/zakazky', nazev: 'Moje zakázky', kratce: 'Zakázky', ikona: Briefcase },
    { cesta: '/zpravy', nazev: 'Zprávy', ikona: MessageCircle },
    { cesta: '/vydelky', nazev: 'Výdělky', ikona: Wallet },
    { cesta: '/profil', nazev: 'Profil', ikona: User },
  ],
}

/** Na mobilu nejvýš pět položek. Zákazník má uprostřed tlačítko pro novou poptávku. */
export const MOBILNI: Record<Role, (PolozkaNavigace | 'nova')[]> = {
  customer: [NAVIGACE.customer[0], NAVIGACE.customer[1], 'nova', NAVIGACE.customer[2], NAVIGACE.customer[3]],
  craftsman: [NAVIGACE.craftsman[0], NAVIGACE.craftsman[1], NAVIGACE.craftsman[3], NAVIGACE.craftsman[4], NAVIGACE.craftsman[6]],
}

export type Role = 'customer' | 'craftsman'

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Zákazník',
  craftsman: 'Řemeslník',
}

export type StavPoptavky = 'waiting' | 'active' | 'done' | 'cancelled'

/** Řádek tabulky requests (jen sloupce, které appka používá). */
export type Poptavka = {
  id: number
  created_at: string
  customer_id: string
  customer_name: string | null
  title: string | null
  category: string | null
  description: string | null
  status: StavPoptavky
  urgency: string | null
  price_estimate: string | null
  mesto: string | null
  lat: number | null
  lon: number | null
  craftsman_id: string | null
  craftsman_name: string | null
  /** Řemeslník nahlásil dokončení (čas, případně příznak) */
  dokonceni_navrzeno: string | boolean | null
  zruseno_kym: string | null
  zruseno_duvod: string | null
}

export type Odstoupeni = {
  request_id: number
  craftsman_name: string | null
  duvod: string | null
  created_at: string
}

export type StavNabidky = 'pending' | 'accepted' | 'rejected'

/** Řádek tabulky offers. Cena je v DB volný text („850 Kč“, „Dohodou“). */
export type Nabidka = {
  id: number
  request_id: number
  craftsman_id: string
  craftsman_name: string | null
  message: string | null
  price: string | null
  status: StavNabidky
  created_at: string
  pokusy?: number | null
  duvod_odmitnuti?: string | null
}

/** Kódy musí odpovídat omezení offers_duvod_odmitnuti_check v databázi. */
export const DUVODY_ODMITNUTI = [
  { kod: 'cena', text: 'Cena je pro mě příliš vysoká' },
  { kod: 'termin', text: 'Nevyhovuje mi termín' },
  { kod: 'jiny_remeslnik', text: 'Vybral jsem jiného řemeslníka' },
  { kod: 'nepotrebuji', text: 'Už to nepotřebuji nebo jsem to vyřešil jinak' },
  { kod: 'jine', text: 'Jiný důvod' },
] as const

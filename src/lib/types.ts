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
  dokonceni_navrzeno: string | null
  zruseno_kym: string | null
  zruseno_duvod: string | null
}

export type Odstoupeni = {
  request_id: number
  craftsman_name: string | null
  duvod: string | null
  created_at: string
}

export const STAV_POPTAVKY: Record<StavPoptavky, { text: string; tecka: string }> = {
  waiting: { text: 'Hledáme řemeslníka', tecka: 'bg-remexo-500' },
  active: { text: 'Probíhá', tecka: 'bg-sky-500' },
  done: { text: 'Hotovo', tecka: 'bg-emerald-500' },
  cancelled: { text: 'Zrušeno', tecka: 'bg-stone-300 dark:bg-stone-600' },
}

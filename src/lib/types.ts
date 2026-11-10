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

export const STAV_POPTAVKY: Record<StavPoptavky, { text: string; trida: string }> = {
  waiting: { text: 'Hledáme profíka', trida: 'bg-remexo-100 text-remexo-600 dark:bg-remexo-500/15' },
  active: { text: 'Probíhá oprava', trida: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  done: { text: 'Dokončeno', trida: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
  cancelled: { text: 'Zrušeno', trida: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

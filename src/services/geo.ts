import { OBLASTI, PRESNOST_POLOHY } from '@/config/region'

export function vzdalenostKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function hledej(dotaz: string) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(dotaz + ', Česká republika')
  const odpoved = await fetch(url, { headers: { 'Accept-Language': 'cs' } })
  const data = (await odpoved.json()) as { lat: string; lon: string }[]
  return data[0] ?? null
}

export type Overeni = { stav: 'v-oblasti'; lat: number; lon: number } | { stav: 'mimo' } | { stav: 'nenalezeno' }

/** Najde adresu a ověří, že leží v oblasti, kde Remexo funguje. */
export async function overAdresu(ulice: string, mesto: string): Promise<Overeni> {
  try {
    let bod = await hledej(`${ulice}, ${mesto}`)
    if (!bod) {
      const bezCisla = ulice.replace(/\d+\/?\d*[a-zA-Z]?\s*$/, '').trim()
      if (bezCisla && bezCisla !== ulice) bod = await hledej(`${bezCisla}, ${mesto}`)
    }
    if (!bod) return { stav: 'nenalezeno' }
    const lat = parseFloat(bod.lat), lon = parseFloat(bod.lon)
    const uvnitr = OBLASTI.some((o) => vzdalenostKm(lat, lon, o.lat, o.lon) <= o.polomerKm)
    if (!uvnitr) return { stav: 'mimo' }
    return { stav: 'v-oblasti', lat: Math.round(lat * PRESNOST_POLOHY) / PRESNOST_POLOHY, lon: Math.round(lon * PRESNOST_POLOHY) / PRESNOST_POLOHY }
  } catch {
    return { stav: 'nenalezeno' }
  }
}

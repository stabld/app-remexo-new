import { supabase } from '@/lib/supabase'
import type { NovaFotka } from './fotky'

export type BorekOdpoved =
  | { status: 'question'; message: string }
  | { status: 'done'; nazev: string; kategorie: string; popis: string; nalehavost: string; odhad_ceny: string; rada?: string }

export class BorekChyba extends Error {
  pretizeno: boolean
  constructor(zprava: string, pretizeno = false) { super(zprava); this.pretizeno = pretizeno }
}

const ocisti = (s: string | undefined) => (s ?? '').replace(/[*]/g, '').trim()

/** Zavolá Bořka (Vercel funkce api/borek-ai, prompty jsou na serveru). */
export async function zeptejSeBorka(text: string, fotky: NovaFotka[]): Promise<BorekOdpoved> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const parts = [{ text }, ...fotky.map((f) => ({ inlineData: { mimeType: f.mime, data: f.base64 } }))]
  const res = await fetch('/api/borek-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ parts, rezim: 'poptavka', useJson: true }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new BorekChyba(body.error || 'Bořek teď neodpovídá.', !!body.pretizeno)

  let cisty = String(body.text ?? '').replace(/```json/gi, '').replace(/```/g, '').trim()
  const s = cisty.indexOf('{'), e = cisty.lastIndexOf('}')
  if (s !== -1 && e !== -1) cisty = cisty.slice(s, e + 1)
  const d = JSON.parse(cisty)
  if (d.status === 'done')
    return { status: 'done', nazev: ocisti(d.nazev), kategorie: ocisti(d.kategorie), popis: ocisti(d.popis), nalehavost: ocisti(d.nalehavost), odhad_ceny: ocisti(d.odhad_ceny), rada: ocisti(d.rada) }
  return { status: 'question', message: ocisti(d.message) }
}

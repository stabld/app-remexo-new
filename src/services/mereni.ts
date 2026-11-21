import { supabase } from '@/lib/supabase'

const KLIC = 'remexo_session'

function relace(): string | null {
  try {
    let s = localStorage.getItem(KLIC)
    if (!s) {
      s = crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`
      localStorage.setItem(KLIC, s)
    }
    return s
  } catch {
    return null
  }
}

/** Jednoduché měření událostí do tabulky udalosti (stejně jako pilot). Nikdy nesmí shodit aplikaci. */
export async function mer(typ: string, detail?: Record<string, unknown> | null) {
  try {
    const { data } = await supabase.auth.getUser()
    await supabase.from('udalosti').insert({ typ, user_id: data.user?.id ?? null, session_id: relace(), detail: detail ?? null })
  } catch {
    /* měření je bonus */
  }
}

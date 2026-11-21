import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { StavNabidky, StavPoptavky } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'
import { DUVOD_PRO_REMESLNIKA } from '@/features/market/model'

/**
 * Jak řemeslník vidí jednu svou nabídku / zakázku.
 * O zařazení rozhoduje stav POPTÁVKY, ne nabídky (nabídka zůstává „accepted“ i po zrušení nebo odstoupení).
 */
export type Druh = 'ceka' | 'odmitnuta' | 'aktivni' | 'hotovo' | 'zrusena'

export type MojePrace = {
  nabidkaId: number
  requestId: number
  druh: Druh
  odeslano: string
  cena: string | null
  zprava: string | null
  pokusy: number
  duvodOdmitnuti: string | null
  titulek: string
  kategorie: string | null
  popis: string
  mesto: string | null
  stavPoptavky: StavPoptavky
  zakaznik: string
  /** Řemeslník nahlásil hotovo (čas) */
  dokonceniNavrzeno: string | null
  /** Zákazník označil hotovo dřív než řemeslník (čas) */
  dokonceniOdZakaznika: string | null
  zrusenoDuvod: string | null
  kontakt: { telefon: string | null; ulice: string | null; mesto: string | null } | null
  hodnoceni: { hvezdicky: number; komentar: string | null } | null
}

type Radek = {
  id: number
  request_id: number
  status: StavNabidky
  created_at: string
  price: string | null
  message: string | null
  pokusy: number | null
  duvod_odmitnuti: string | null
  requests: {
    title: string | null
    category: string | null
    status: StavPoptavky
    description: string | null
    customer_name: string | null
    mesto: string | null
    craftsman_id: string | null
    dokonceni_navrzeno: string | null
    dokonceni_navrzeno_zakaznikem: string | null
    zruseno_duvod: string | null
  } | null
}

const KLIC = 'moje-prace'

export function useMojePrace() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC, user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async (): Promise<MojePrace[]> => {
      const { data, error } = await supabase
        .from('offers')
        .select('id, request_id, status, created_at, price, message, pokusy, duvod_odmitnuti, requests(title, category, status, description, customer_name, mesto, craftsman_id, dokonceni_navrzeno, dokonceni_navrzeno_zakaznikem, zruseno_duvod)')
        .eq('craftsman_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error

      // Stejný výběr jako pilot.
      const radky = ((data ?? []) as unknown as Radek[]).filter((o) => {
        const p = o.requests
        if (!p) return false
        // Odmítnutou ukážeme jen s důvodem od zákazníka (bez důvodu = odstoupení nebo staré odmítnutí).
        if (o.status === 'rejected') return !!(o.duvod_odmitnuti && DUVOD_PRO_REMESLNIKA[o.duvod_odmitnuti])
        if (p.status === 'cancelled') return true
        if (p.status === 'waiting') return o.status === 'pending'
        return p.craftsman_id === user!.id
      })

      const prijate = radky.filter((o) => o.status === 'accepted').map((o) => o.request_id)
      const [kontakty, hodnoceni] = await Promise.all([
        prijate.length
          ? supabase.from('poptavka_kontakt').select('request_id, telefon, ulice, mesto').in('request_id', prijate)
          : Promise.resolve({ data: [] as { request_id: number; telefon: string | null; ulice: string | null; mesto: string | null }[] }),
        prijate.length
          ? supabase.from('hodnoceni').select('request_id, hvezdicky, komentar').eq('craftsman_id', user!.id).in('request_id', prijate)
          : Promise.resolve({ data: [] as { request_id: number; hvezdicky: number; komentar: string | null }[] }),
      ])
      const kontaktPodle = new Map((kontakty.data ?? []).map((k) => [Number(k.request_id), k]))
      const hodnoceniPodle = new Map((hodnoceni.data ?? []).map((h) => [Number(h.request_id), h]))

      return radky.map((o): MojePrace => {
        const p = o.requests!
        let druh: Druh
        if (o.status === 'rejected') druh = 'odmitnuta'
        else if (p.status === 'cancelled') druh = 'zrusena'
        else if (p.status === 'done') druh = 'hotovo'
        else if (p.status === 'active') druh = 'aktivni'
        else druh = 'ceka'
        const k = kontaktPodle.get(Number(o.request_id))
        const h = hodnoceniPodle.get(Number(o.request_id))
        return {
          nabidkaId: o.id,
          requestId: Number(o.request_id),
          druh,
          odeslano: o.created_at,
          cena: o.price,
          zprava: o.message,
          pokusy: o.pokusy || 1,
          duvodOdmitnuti: o.duvod_odmitnuti,
          titulek: p.title || 'Zakázka',
          kategorie: p.category,
          popis: p.description ?? '',
          mesto: p.mesto,
          stavPoptavky: p.status,
          zakaznik: p.customer_name || 'Zákazník',
          dokonceniNavrzeno: p.dokonceni_navrzeno,
          dokonceniOdZakaznika: p.dokonceni_navrzeno_zakaznikem,
          zrusenoDuvod: p.zruseno_duvod,
          kontakt: k ? { telefon: k.telefon, ulice: k.ulice, mesto: k.mesto } : null,
          hodnoceni: h ? { hvezdicky: h.hvezdicky, komentar: h.komentar } : null,
        }
      })
    },
  })
}

/** Kolik celých dní uplynulo od data. */
export function dnuOd(kdy: string | null) {
  if (!kdy) return 0
  const t = new Date(kdy).getTime()
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86_400_000) : 0
}

/** Po týdnu bez reakce zákazníka smí řemeslník zakázku uzavřít sám (stejně jako v pilotu). */
export const DNU_NA_POTVRZENI = 7

function useObnov() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: [KLIC] })
    qc.invalidateQueries({ queryKey: ['moje-nabidky-mapa'] })
    qc.invalidateQueries({ queryKey: ['trziste'] })
  }
}

export class ZmenaStavu extends Error {}

export function useNahlasitDokonceni() {
  const obnov = useObnov()
  return useMutation({
    mutationFn: async (requestId: number) => {
      const { error } = await supabase.from('requests').update({ dokonceni_navrzeno: new Date().toISOString() }).eq('id', requestId)
      if (error) throw error
    },
    onSettled: obnov,
  })
}

/** Zákazník už hotovo označil, řemeslník potvrzuje → zakázka se uzavře. */
export function usePotvrditDokonceni() {
  const obnov = useObnov()
  return useMutation({
    mutationFn: async (requestId: number) => {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'done', dokonceni_navrzeno: new Date().toISOString() })
        .eq('id', requestId)
        .eq('status', 'active')
        .select('id')
      if (error) throw error
      if (!data?.length) throw new ZmenaStavu('Stav zakázky se mezitím změnil.')
    },
    onSettled: obnov,
  })
}

/** Zákazník týden po nahlášení nereaguje → řemeslník uzavře sám. */
export function useUzavritBezOdezvy() {
  const obnov = useObnov()
  return useMutation({
    mutationFn: async (requestId: number) => {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'done' })
        .eq('id', requestId)
        .eq('status', 'active')
        .select('id')
      if (error) throw error
      if (!data?.length) throw new ZmenaStavu('Stav zakázky se mezitím změnil.')
    },
    onSettled: obnov,
  })
}

/** Odstoupení řeší databázová funkce jedním voláním (uvolní zakázku, zruší nabídku, zapíše důvod). */
export function useOdstoupit() {
  const obnov = useObnov()
  return useMutation({
    mutationFn: async ({ requestId, duvod }: { requestId: number; duvod: string }) => {
      const { error } = await supabase.rpc('odstoupit_ze_zakazky', { p_request_id: String(requestId), p_duvod: duvod.trim() || null })
      if (error) throw error
    },
    onSettled: obnov,
  })
}

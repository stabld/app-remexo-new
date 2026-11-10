import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { rozlozPopis } from '@/lib/popis'
import type { Nabidka, Odstoupeni, Poptavka } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'
import { zobrazenyStav, type ZobrazenyStav } from './model'

type NabidkaVPrehledu = Pick<Nabidka, 'request_id' | 'status' | 'price' | 'craftsman_name' | 'created_at'>

export type MojePoptavka = Poptavka & {
  stav: ZobrazenyStav
  /** Nabídky, o kterých zákazník ještě nerozhodl */
  cekajiciNabidky: number
  nabidky: NabidkaVPrehledu[]
  /** Poslední odstoupení řemeslníka, pokud nějaké je */
  odstoupeni: Odstoupeni | null
}

const KLIC_MOJE = 'moje-poptavky'

export function useMojePoptavky({ enabled = true }: { enabled?: boolean } = {}) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC_MOJE, user?.id],
    enabled: !!user && enabled,
    queryFn: async (): Promise<MojePoptavka[]> => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      const poptavky = (data ?? []) as Poptavka[]
      if (!poptavky.length) return []

      const idcka = poptavky.map((p) => p.id)
      const [nabidky, odstoupeni] = await Promise.all([
        supabase.from('offers').select('request_id, status, price, craftsman_name, created_at').in('request_id', idcka),
        supabase.from('odstoupeni').select('request_id, craftsman_name, duvod, created_at').in('request_id', idcka).order('created_at', { ascending: false }),
      ])

      const podlePoptavky = new Map<number, NabidkaVPrehledu[]>()
      for (const o of (nabidky.data ?? []) as NabidkaVPrehledu[]) {
        podlePoptavky.set(o.request_id, [...(podlePoptavky.get(o.request_id) ?? []), o])
      }
      const posledniOdstoupeni = new Map<number, Odstoupeni>()
      for (const z of (odstoupeni.data ?? []) as Odstoupeni[]) {
        if (!posledniOdstoupeni.has(z.request_id)) posledniOdstoupeni.set(z.request_id, z)
      }

      return poptavky.map((p) => {
        const n = podlePoptavky.get(p.id) ?? []
        const cekajici = n.filter((o) => o.status === 'pending').length
        return { ...p, nabidky: n, cekajiciNabidky: cekajici, odstoupeni: posledniOdstoupeni.get(p.id) ?? null, stav: zobrazenyStav(p, cekajici) }
      })
    },
  })
}

// ---------- Detail poptávky ----------

export type NabidkaVDetailu = Nabidka & {
  hodnoceni: { prumer: number; pocet: number } | null
  overeny: boolean
  avatarUrl: string | null
}

export function useDetailPoptavky(id: number) {
  return useQuery({
    queryKey: ['poptavka', id],
    queryFn: async () => {
      const { data: poptavka, error } = await supabase.from('requests').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!poptavka) return null

      const { data: nabidky } = await supabase
        .from('offers')
        .select('*')
        .eq('request_id', id)
        .neq('status', 'rejected')
        .order('created_at', { ascending: true })
      const seznam = (nabidky ?? []) as Nabidka[]
      const ids = [...new Set(seznam.map((o) => o.craftsman_id).filter(Boolean))]

      const [hodnoceni, profily] = ids.length
        ? await Promise.all([
            supabase.from('hodnoceni').select('craftsman_id, hvezdicky').in('craftsman_id', ids),
            supabase.from('public_profiles').select('id, overeno, avatar_url').in('id', ids),
          ])
        : [{ data: [] }, { data: [] }]

      const souhrn = new Map<string, { soucet: number; pocet: number }>()
      for (const h of (hodnoceni.data ?? []) as { craftsman_id: string; hvezdicky: number }[]) {
        const s = souhrn.get(h.craftsman_id) ?? { soucet: 0, pocet: 0 }
        souhrn.set(h.craftsman_id, { soucet: s.soucet + (h.hvezdicky || 0), pocet: s.pocet + 1 })
      }
      const profil = new Map(((profily.data ?? []) as { id: string; overeno: boolean; avatar_url: string | null }[]).map((p) => [p.id, p]))

      const cekajici = seznam.filter((o) => o.status === 'pending').length
      return {
        poptavka: poptavka as Poptavka,
        stav: zobrazenyStav(poptavka as Poptavka, cekajici),
        nabidky: seznam.map((o): NabidkaVDetailu => {
          const s = souhrn.get(o.craftsman_id)
          const p = profil.get(o.craftsman_id)
          return { ...o, hodnoceni: s && s.pocet ? { prumer: s.soucet / s.pocet, pocet: s.pocet } : null, overeny: !!p?.overeno, avatarUrl: p?.avatar_url ?? null }
        }),
      }
    },
  })
}

function useObnovPoptavky() {
  const qc = useQueryClient()
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: [KLIC_MOJE] })
    if (id) qc.invalidateQueries({ queryKey: ['poptavka', id] })
  }
}

/**
 * Přijetí nabídky – stejný postup jako v pilotu:
 * 1. ověřit, že poptávka ještě čeká, 2. nabídku přijmout,
 * 3. poptávku přidělit jen pokud pořád čeká (ochrana proti dvojkliku / druhé záložce),
 * 4. ostatní čekající nabídky uzavřít s důvodem „jiný řemeslník“.
 */
export function usePrijmoutNabidku() {
  const obnov = useObnovPoptavky()
  return useMutation({
    mutationFn: async (n: Pick<Nabidka, 'id' | 'request_id' | 'craftsman_id' | 'craftsman_name'>) => {
      const { data: akt } = await supabase.from('requests').select('status').eq('id', n.request_id).maybeSingle()
      if (akt && akt.status !== 'waiting') throw new Error(akt.status === 'done' ? 'Zakázka je už dokončená.' : 'Zakázka je už přidělená.')

      const { error: e1 } = await supabase.from('offers').update({ status: 'accepted' }).eq('id', n.id)
      if (e1) throw e1

      const { data: zmenene, error: e2 } = await supabase
        .from('requests')
        .update({ status: 'active', craftsman_name: n.craftsman_name, craftsman_id: n.craftsman_id })
        .eq('id', n.request_id)
        .eq('status', 'waiting')
        .select('id')
      if (e2 || !zmenene?.length) {
        await supabase.from('offers').update({ status: 'pending' }).eq('id', n.id)
        throw e2 ?? new Error('Zakázka je už přidělená.')
      }

      await supabase
        .from('offers')
        .update({ status: 'rejected', duvod_odmitnuti: 'jiny_remeslnik' })
        .eq('request_id', n.request_id)
        .neq('id', n.id)
        .eq('status', 'pending')
    },
    onSettled: (_d, _e, n) => obnov(n.request_id),
  })
}

export function useOdmitnoutNabidku() {
  const obnov = useObnovPoptavky()
  return useMutation({
    mutationFn: async ({ id, duvod }: { id: number; requestId: number; duvod: string }) => {
      const { error } = await supabase.from('offers').update({ status: 'rejected', duvod_odmitnuti: duvod }).eq('id', id)
      if (error) throw error
    },
    onSettled: (_d, _e, v) => obnov(v.requestId),
  })
}

/** Potvrzení dokončení + hodnocení (jako submitRating v pilotu). */
export function usePotvrditDokonceni() {
  const obnov = useObnovPoptavky()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ requestId, hvezdicky, komentar }: { requestId: number; hvezdicky: number; komentar: string }) => {
      const { data: p, error: e0 } = await supabase.from('requests').select('craftsman_id').eq('id', requestId).maybeSingle()
      if (e0) throw e0
      const { error: e1 } = await supabase.from('requests').update({ status: 'done' }).eq('id', requestId)
      if (e1) throw e1
      if (p?.craftsman_id) {
        const { error: e2 } = await supabase.from('hodnoceni').insert({
          request_id: requestId,
          craftsman_id: p.craftsman_id,
          customer_id: user!.id,
          hvezdicky,
          komentar: komentar.trim() || null,
        })
        // 23505 = zakázka už jednou hodnocená, to není chyba k řešení
        if (e2 && e2.code !== '23505') throw new Error('Zakázka je dokončená, ale hodnocení se neuložilo: ' + e2.message)
      }
    },
    onSettled: (_d, _e, v) => obnov(v.requestId),
  })
}

/** Smaže fotky ve složce poptávky + cesty z popisu (jen z vlastní složky, nikdy cizí). */
async function smazFotky(poptavka: Poptavka) {
  const id = String(poptavka.id)
  const cesty = new Set<string>()
  const { data } = await supabase.storage.from('poptavky').list(id, { limit: 100 })
  for (const f of data ?? []) cesty.add(`${id}/${f.name}`)
  for (const c of rozlozPopis(poptavka.description).soubory) {
    if (c.startsWith(id + '/') && !c.includes('..')) cesty.add(c)
  }
  if (cesty.size) await supabase.storage.from('poptavky').remove([...cesty])
}

export function useSmazatPoptavku() {
  const obnov = useObnovPoptavky()
  return useMutation({
    mutationFn: async (poptavka: Poptavka) => {
      // Stav ověříme znovu v DB – stránka mohla být zastaralá a smazání fotek nejde vrátit
      const { data: akt } = await supabase.from('requests').select('status').eq('id', poptavka.id).maybeSingle()
      if (akt && akt.status !== 'waiting') {
        throw new Error(akt.status === 'done' ? 'Dokončené zakázky zůstávají v historii kvůli hodnocení.' : 'Řemeslník už na ní pracuje.')
      }
      await smazFotky(poptavka)
      await supabase.from('offers').delete().eq('request_id', poptavka.id)
      await supabase.from('messages').delete().eq('conversation_id', String(poptavka.id))
      const { error } = await supabase.from('requests').delete().eq('id', poptavka.id)
      if (error) throw error
    },
    onSuccess: () => obnov(),
  })
}

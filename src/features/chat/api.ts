import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import { oznacVideno, videno } from './precteni'

export type Zprava = {
  id: string | number
  conversation_id: string
  sender_id: string | null
  sender_name: string | null
  text: string
  senderrole?: string | null
  created_at: string
  /** Text přijaté nabídky zobrazený jako první zpráva (v DB jako zpráva není) */
  zNabidky?: boolean
  odesilam?: boolean
}

export type Konverzace = {
  id: string
  nazev: string
  stav: string
  protistrana: { id: string | null; jmeno: string }
  posledni: Zprava | null
  neprectene: number
}

const OBNOVA_MS = 7000

/** Konverzace vznikají až přijetím nabídky: zákazník je má u poptávek v realizaci a hotových, řemeslník u přijatých nabídek. */
export function useKonverzace() {
  const { user, role } = useAuth()
  return useQuery({
    queryKey: ['konverzace', user?.id, role],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async (): Promise<Konverzace[]> => {
      let zaklad: Omit<Konverzace, 'posledni' | 'neprectene'>[] = []
      if (role === 'customer') {
        const { data, error } = await supabase
          .from('requests')
          .select('id, title, status, craftsman_id, craftsman_name')
          .eq('customer_id', user!.id)
          .in('status', ['active', 'done'])
        if (error) throw error
        zaklad = (data ?? []).map((r) => ({ id: String(r.id), nazev: r.title || 'Poptávka', stav: r.status, protistrana: { id: r.craftsman_id, jmeno: r.craftsman_name || 'Řemeslník' } }))
      } else {
        const { data, error } = await supabase
          .from('offers')
          .select('request_id, requests(id, title, status, customer_id, customer_name)')
          .eq('craftsman_id', user!.id)
          .eq('status', 'accepted')
        if (error) throw error
        zaklad = (data ?? []).map((o) => {
          const r = (Array.isArray(o.requests) ? o.requests[0] : o.requests) as { title?: string; status?: string; customer_id?: string; customer_name?: string } | null
          return { id: String(o.request_id), nazev: r?.title || 'Zakázka', stav: r?.status || 'active', protistrana: { id: r?.customer_id ?? null, jmeno: r?.customer_name || 'Zákazník' } }
        })
      }
      if (!zaklad.length) return []

      const { data: zpravy } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, sender_name, text, created_at')
        .in('conversation_id', zaklad.map((k) => k.id))
        .order('created_at', { ascending: false })
        .limit(500)

      return zaklad
        .map((k) => {
          const moje = ((zpravy ?? []) as Zprava[]).filter((z) => z.conversation_id === k.id)
          const od = videno(user!.id, k.id)
          return { ...k, posledni: moje[0] ?? null, neprectene: moje.filter((z) => z.sender_id !== user!.id && z.created_at > od).length }
        })
        .sort((a, b) => (b.posledni?.created_at ?? '').localeCompare(a.posledni?.created_at ?? ''))
    },
  })
}

/** Zprávy jedné konverzace. Realtime + záloha každých 7 s (realtime v pilotu nebyl spolehlivý). */
export function useZpravy(konverzace: string | null) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const klic = ['zpravy', konverzace]

  const dotaz = useQuery({
    queryKey: klic,
    enabled: !!konverzace,
    refetchInterval: OBNOVA_MS,
    queryFn: async (): Promise<Zprava[]> => {
      const [{ data, error }, { data: prijata }] = await Promise.all([
        supabase.from('messages').select('*').eq('conversation_id', konverzace!).order('created_at', { ascending: true }),
        supabase.from('offers').select('id, message, craftsman_id, craftsman_name, created_at').eq('request_id', konverzace!).eq('status', 'accepted').maybeSingle(),
      ])
      if (error) throw error
      const uvod: Zprava[] = prijata?.message
        ? [{ id: `nabidka-${prijata.id}`, conversation_id: konverzace!, sender_id: prijata.craftsman_id, sender_name: prijata.craftsman_name, text: prijata.message, created_at: prijata.created_at, zNabidky: true }]
        : []
      return [...uvod, ...((data ?? []) as Zprava[])]
    },
  })

  // Realtime: nová zpráva se objeví hned
  useEffect(() => {
    if (!konverzace) return
    const kanal = supabase
      .channel(`zpravy-${konverzace}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${konverzace}` }, () => {
        qc.invalidateQueries({ queryKey: ['zpravy', konverzace] })
      })
      .subscribe()
    return () => { supabase.removeChannel(kanal) }
  }, [konverzace, qc])

  // Přečtení: při otevření a při každé nové zprávě, na kterou se uživatel dívá
  const posledniId = dotaz.data?.[dotaz.data.length - 1]?.id
  useEffect(() => {
    if (!konverzace || !user) return
    oznacVideno(user.id, konverzace)
    supabase.rpc('oznac_precteno', { p_konverzace: konverzace }).then(() => {}, () => {})
    qc.invalidateQueries({ queryKey: ['konverzace'] })
  }, [konverzace, posledniId, user, qc])

  return dotaz
}

export function useOdeslatZpravu(konverzace: string) {
  const { user, jmeno, role } = useAuth()
  const qc = useQueryClient()
  const klic = ['zpravy', konverzace]
  return useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from('messages').insert({ conversation_id: konverzace, sender_id: user!.id, sender_name: jmeno, text, senderrole: role })
      if (error) throw error
    },
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: klic })
      const predtim = qc.getQueryData<Zprava[]>(klic)
      const docasna: Zprava = { id: `odesilam-${Date.now()}`, conversation_id: konverzace, sender_id: user!.id, sender_name: jmeno, text, created_at: new Date().toISOString(), odesilam: true }
      qc.setQueryData<Zprava[]>(klic, (z) => [...(z ?? []), docasna])
      return { predtim }
    },
    onError: (_e, _t, ctx) => qc.setQueryData(klic, ctx?.predtim),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: klic })
      qc.invalidateQueries({ queryKey: ['konverzace'] })
    },
  })
}

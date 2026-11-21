import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Poptavka, StavNabidky, StavPoptavky } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'

/** Na jednu poptávku smí řemeslník reagovat nejvýš dvakrát (původní nabídka + jedna opravená po odmítnutí). */
export const MAX_POKUSU = 2

const KLIC_TRZISTE = 'trziste'
const KLIC_NABIDKY = 'moje-nabidky-mapa'
const KLIC_OBLIBENE = 'oblibene'
const KLIC_POLOHA = 'poloha-remeslnika'

/** Volné poptávky. Co řemeslník smí vidět, hlídá RLS v databázi. */
export function useTrziste() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC_TRZISTE],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Poptavka[]> => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Poptavka[]
    },
  })
}

export function useZakazka(id: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC_TRZISTE, 'detail', id],
    enabled: !!user && Number.isFinite(id),
    queryFn: async (): Promise<Poptavka | null> => {
      const { data, error } = await supabase.from('requests').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return (data as Poptavka) ?? null
    },
  })
}

export type MojeNabidkaKPoptavce = {
  stav: StavNabidky
  stavZakazky: StavPoptavky | null
  pokusy: number
  duvod: string | null
}

/** Moje nabídky podle id poptávky – podle nich se na tržišti zamyká tlačítko „Poslat nabídku“. */
export function useMojeNabidkyMapa() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC_NABIDKY, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('request_id, status, pokusy, duvod_odmitnuti, requests(status)')
        .eq('craftsman_id', user!.id)
      if (error) throw error
      const mapa = new Map<number, MojeNabidkaKPoptavce>()
      for (const o of (data ?? []) as unknown as {
        request_id: number; status: StavNabidky; pokusy: number | null; duvod_odmitnuti: string | null; requests: { status: StavPoptavky } | null
      }[]) {
        mapa.set(Number(o.request_id), { stav: o.status, stavZakazky: o.requests?.status ?? null, pokusy: o.pokusy || 1, duvod: o.duvod_odmitnuti })
      }
      return mapa
    },
  })
}

/** Smí poslat (další) nabídku? Stejné pravidlo jako pilot: čekající a přijatá blokují, odmítnutá jen po vyčerpání pokusů. */
export function muzeNabidnout(n: MojeNabidkaKPoptavce | undefined) {
  if (!n) return true
  if (n.stav === 'rejected') return n.pokusy < MAX_POKUSU
  return false
}

export function useOblibene() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC_OBLIBENE, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('oblibene').select('request_id').eq('user_id', user!.id)
      if (error) throw error
      return new Set((data ?? []).map((r) => Number(r.request_id)))
    },
  })
}

export function usePrepnoutOblibene() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const klic = [KLIC_OBLIBENE, user?.id]
  return useMutation({
    mutationFn: async ({ id, ulozit }: { id: number; ulozit: boolean }) => {
      const { error } = ulozit
        ? await supabase.from('oblibene').insert({ user_id: user!.id, request_id: id })
        : await supabase.from('oblibene').delete().eq('user_id', user!.id).eq('request_id', id)
      if (error) throw error
    },
    // Hned překlopíme vzhled, při chybě vrátíme zpět.
    onMutate: async ({ id, ulozit }) => {
      await qc.cancelQueries({ queryKey: klic })
      const predtim = qc.getQueryData<Set<number>>(klic)
      const nove = new Set(predtim)
      if (ulozit) nove.add(id)
      else nove.delete(id)
      qc.setQueryData(klic, nove)
      return { predtim }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(klic, ctx?.predtim),
  })
}

export type Poloha = { lat: number; lon: number }

/** Odkud řemeslník vyjíždí (z profilu). Bez ní se vzdálenost nepočítá. */
export function usePolohaRemeslnika() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC_POLOHA, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Poloha | null> => {
      const { data, error } = await supabase.from('profiles').select('lat, lon').eq('id', user!.id).maybeSingle()
      if (error) throw error
      const lat = parseFloat(data?.lat)
      const lon = parseFloat(data?.lon)
      return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
    },
  })
}

type DruhChyby = 'neni' | 'vlastni' | 'obsazeno' | 'pokusy' | 'uz-poslano' | 'zamitnuto'

export class NabidkaChyba extends Error {
  druh: DruhChyby
  constructor(druh: DruhChyby, zprava: string) {
    super(zprava)
    this.druh = druh
  }
}

/** Odeslání nabídky. Kroky a zápisy jsou stejné jako v pilotu, aby obě appky mohly běžet vedle sebe. */
export function useOdeslatNabidku() {
  const { user, jmeno } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ poptavkaId, cena, zprava, predchozi }: {
      poptavkaId: number; cena: string; zprava: string; predchozi?: MojeNabidkaKPoptavce
    }) => {
      // Zakázku už mohl mezitím někdo dostat – ověříme čerstvě z databáze.
      const { data: aktualni, error: chybaCteni } = await supabase
        .from('requests').select('status, customer_id').eq('id', poptavkaId).maybeSingle()
      if (!chybaCteni && !aktualni)
        throw new NabidkaChyba('neni', 'Zákazník poptávku mezitím smazal, nebo ji dostal jiný řemeslník.')
      if (aktualni?.customer_id === user!.id)
        throw new NabidkaChyba('vlastni', 'Tuhle poptávku jsi zadal ty. Nabídku jí může poslat jen jiný účet.')
      if (aktualni && aktualni.status !== 'waiting')
        throw new NabidkaChyba('obsazeno', 'Zákazník si mezitím vybral jiného řemeslníka.')

      const cenaText = cena.trim() || 'Dohodou'
      let error
      if (predchozi?.stav === 'rejected') {
        const pokusy = predchozi.pokusy + 1
        if (pokusy > MAX_POKUSU)
          throw new NabidkaChyba('pokusy', `U jedné poptávky můžeš nabídku poslat nejvýš ${MAX_POKUSU}×.`)
        ;({ error } = await supabase
          .from('offers')
          .update({ message: zprava, price: cenaText, status: 'pending', craftsman_name: jmeno, pokusy })
          .eq('request_id', poptavkaId)
          .eq('craftsman_id', user!.id))
      } else {
        ;({ error } = await supabase.from('offers').insert({
          request_id: poptavkaId, craftsman_id: user!.id, craftsman_name: jmeno, message: zprava, price: cenaText, status: 'pending',
        }))
      }
      if (error) {
        if (error.code === '23505') throw new NabidkaChyba('uz-poslano', 'Na tuhle poptávku už nabídku máš.')
        if (error.code === '42501' || /row-level security/i.test(error.message))
          throw new NabidkaChyba('zamitnuto', 'Poptávka už není dostupná, nebo na ni nemůžeš reagovat.')
        throw error
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [KLIC_NABIDKY] })
      qc.invalidateQueries({ queryKey: [KLIC_TRZISTE] })
    },
  })
}

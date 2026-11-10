import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { rozlozPopis } from '@/lib/popis'
import type { Odstoupeni, Poptavka } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'

export type MojePoptavka = Poptavka & {
  /** Nabídky, o kterých zákazník ještě nerozhodl */
  cekajiciNabidky: number
  /** Poslední odstoupení řemeslníka, pokud nějaké je */
  odstoupeni: Odstoupeni | null
}

/** Nahoře to, kde se čeká na zákazníka, pak rozjeté, čekající a nakonec uzavřené. */
function priorita(p: MojePoptavka) {
  if ((p.status === 'active' && p.dokonceni_navrzeno) || (p.status === 'waiting' && p.cekajiciNabidky > 0)) return 0
  return { active: 1, waiting: 2 }[p.status as string] ?? 3
}

export function useMojePoptavky() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['moje-poptavky', user?.id],
    enabled: !!user,
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
        supabase.from('offers').select('request_id, status').in('request_id', idcka),
        supabase
          .from('odstoupeni')
          .select('request_id, craftsman_name, duvod, created_at')
          .in('request_id', idcka)
          .order('created_at', { ascending: false }),
      ])

      const pocty = new Map<number, number>()
      for (const o of nabidky.data ?? []) {
        if (o.status === 'pending') pocty.set(o.request_id, (pocty.get(o.request_id) ?? 0) + 1)
      }
      const posledniOdstoupeni = new Map<number, Odstoupeni>()
      for (const z of (odstoupeni.data ?? []) as Odstoupeni[]) {
        if (!posledniOdstoupeni.has(z.request_id)) posledniOdstoupeni.set(z.request_id, z)
      }

      return poptavky
        .map((p) => ({ ...p, cekajiciNabidky: pocty.get(p.id) ?? 0, odstoupeni: posledniOdstoupeni.get(p.id) ?? null }))
        .sort((a, b) => priorita(a) - priorita(b) || b.created_at.localeCompare(a.created_at))
    },
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (poptavka: Poptavka) => {
      // Stav ověříme znovu v DB – stránka mohla být zastaralá a smazání fotek nejde vrátit
      const { data: akt } = await supabase.from('requests').select('status').eq('id', poptavka.id).maybeSingle()
      if (akt && akt.status !== 'waiting') {
        throw new Error(
          akt.status === 'done'
            ? 'Dokončené zakázky zůstávají v historii kvůli hodnocení.'
            : 'Řemeslník už na ní pracuje. Nejdřív zakázku uzavři.',
        )
      }
      await smazFotky(poptavka)
      await supabase.from('offers').delete().eq('request_id', poptavka.id)
      await supabase.from('messages').delete().eq('conversation_id', String(poptavka.id))
      const { error } = await supabase.from('requests').delete().eq('id', poptavka.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moje-poptavky'] }),
  })
}

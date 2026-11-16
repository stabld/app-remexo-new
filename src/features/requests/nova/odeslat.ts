import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { base64NaBlob } from '@/services/fotky'
import { useAuth } from '@/features/auth/AuthProvider'
import { sestavPopis, type Koncept } from './koncept'

/**
 * Zveřejnění poptávky – stejné pořadí jako v pilotu:
 * 1. založit poptávku (bez ulice a telefonu), 2. nahrát fotky do <id>/<n>.jpg a doplnit je do popisu,
 * 3. uložit kontakt do chráněné tabulky poptavka_kontakt.
 * Vrací id nové poptávky a seznam toho, co se nepovedlo (poptávka už ale existuje).
 */
export function useZverejnitPoptavku() {
  const { user, jmeno } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ k, lat, lon }: { k: Koncept; lat: number; lon: number }) => {
      let popis = sestavPopis(k)
      const { data, error } = await supabase
        .from('requests')
        .insert({
          customer_id: user!.id,
          customer_name: jmeno,
          title: k.nazev.trim() || k.popis.trim().split(/[.\n]/)[0].slice(0, 80) || 'Nová poptávka',
          category: k.obor || 'Ostatní',
          description: popis,
          urgency: k.nalehavost || 'Střední',
          price_estimate: k.odhadCeny || 'Dohodou',
          status: 'waiting',
          mesto: k.mesto.trim(),
          lat, lon,
        })
        .select('id')
        .single()
      if (error) throw error
      const id = data.id as number
      const problemy: string[] = []

      const cesty: string[] = []
      for (const [i, f] of k.fotky.entries()) {
        const cesta = `${id}/${i + 1}.jpg`
        const { error: e } = await supabase.storage.from('poptavky').upload(cesta, base64NaBlob(f.base64, f.mime), { upsert: true, contentType: f.mime })
        if (!e) cesty.push(cesta)
      }
      if (cesty.length) {
        popis += cesty.map((c) => '\n||FOTO||' + c).join('')
        await supabase.from('requests').update({ description: popis }).eq('id', id)
      }
      if (k.fotky.length && cesty.length < k.fotky.length) problemy.push('Některé fotky se nenahrály, můžeš je doplnit později.')

      const { error: eKontakt } = await supabase.from('poptavka_kontakt').insert({ request_id: id, telefon: k.telefon.trim(), ulice: k.ulice.trim(), mesto: k.mesto.trim() })
      if (eKontakt) problemy.push('Kontakt se neuložil, řemeslník by se ti nedovolal. Napiš nám prosím.')

      // Pilot vyžaduje telefon a město v profilu – doplníme je, ať se zákazník v pilotu nezasekne
      const meta = user?.user_metadata ?? {}
      if (!meta.phone || !meta.city) {
        await supabase.auth.updateUser({ data: { phone: meta.phone || k.telefon.trim(), city: meta.city || k.mesto.trim() } }).catch(() => {})
      }
      return { id, problemy }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moje-poptavky'] }),
  })
}

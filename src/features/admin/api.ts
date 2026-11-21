import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'

/**
 * Správa. Bezpečnost tu NEŘEŠÍ frontend: každá admin_* funkce v databázi si na prvním řádku
 * ověří, že volá administrátor. Skrytí položky v menu je jen pohodlí.
 */
export function useJeAdmin() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['je-admin', user?.id],
    enabled: !!user,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('je_admin')
      return !error && data === true
    },
  })
}

async function rpc<T>(nazev: string, parametry?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(nazev, parametry)
  if (error) throw error
  return (data ?? []) as T
}

export type Pozornost = { typ: string; pocet: number; popis: string }
export type Remeslnik = { uzivatel_id: string; jmeno: string | null; email: string | null; ico: string | null; overeno: boolean; zakazek: number; registrovan: string }
export type Ukazatel = { ukazatel: string; hodnota: string | number }
export type AdminPoptavka = { nazev: string; kategorie: string | null; mesto: string | null; stav: string; zakaznik: string | null; remeslnik: string | null; nabidek: number; vytvoreno: string }
export type AdminUzivatel = { jmeno: string | null; email: string | null; role: string; overeno: boolean; poptavek: number; nabidek: number; registrovan: string; posledni_prihlaseni: string | null }
export type Hlaseni = { id: number; text: string; jmeno: string | null; email: string | null; url: string | null; vytvoreno: string; vyreseno: boolean; poznamka: string | null }
export type Zaznam = { cas: string; udalost: string; uzivatel: string | null; detail: unknown }

const q = <T,>(klic: string, nazev: string, parametry?: Record<string, unknown>, enabled = true) => ({
  queryKey: ['admin', klic],
  enabled,
  queryFn: () => rpc<T>(nazev, parametry),
})

export const usePozornost = () => useQuery(q<Pozornost[]>('pozornost', 'admin_pozornost'))
export const useRemeslnici = (enabled: boolean) => useQuery(q<Remeslnik[]>('remeslnici', 'admin_seznam_remeslniku', undefined, enabled))
export const useCisla = (enabled: boolean) => useQuery(q<Ukazatel[]>('cisla', 'admin_prehled', undefined, enabled))
export const usePoptavky = (enabled: boolean) => useQuery(q<AdminPoptavka[]>('poptavky', 'admin_poptavky', { p_limit: 100 }, enabled))
export const useUzivatele = (enabled: boolean) => useQuery(q<AdminUzivatel[]>('uzivatele', 'admin_uzivatele', { p_limit: 100 }, enabled))
export const useHlaseni = (enabled: boolean) => useQuery(q<Hlaseni[]>('hlaseni', 'admin_hlaseni', { p_limit: 200 }, enabled))
export const useAudit = (enabled: boolean) => useQuery(q<Zaznam[]>('audit', 'admin_audit', { p_limit: 100 }, enabled))

function useAdminMutace<V>(fn: (v: V) => Promise<unknown>, obnovit: string[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => obnovit.forEach((k) => qc.invalidateQueries({ queryKey: ['admin', k] })),
  })
}

export const useOverit = () =>
  useAdminMutace(
    ({ id, ico }: { id: string; ico: string }) =>
      rpc('admin_overit', { p_uzivatel: id, p_ico: ico.trim() || null, p_pozn: 'Ověřeno v rejstříku' }),
    ['remeslnici', 'pozornost', 'audit'],
  )

export const useZrusitOvereni = () =>
  useAdminMutace(
    ({ id, duvod }: { id: string; duvod: string }) => rpc('admin_zrusit_overeni', { p_uzivatel: id, p_duvod: duvod.trim() || null }),
    ['remeslnici', 'pozornost', 'audit'],
  )

export const useHlaseniStav = () =>
  useAdminMutace(({ id, vyreseno }: { id: number; vyreseno: boolean }) => rpc('admin_hlaseni_stav', { p_id: id, p_vyreseno: vyreseno }), ['hlaseni', 'pozornost'])

export const useHlaseniPoznamka = () =>
  useAdminMutace(({ id, text }: { id: number; text: string }) => rpc('admin_hlaseni_poznamka', { p_id: id, p_text: text }), ['hlaseni'])

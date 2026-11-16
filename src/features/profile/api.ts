import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/lib/types'
import { useAuth } from '@/features/auth/AuthProvider'
import { geokoduj } from '@/services/geo'

/** Neveřejná část profilu. Čte se z profiles, ne z tokenu, kde by si ji uživatel mohl přepsat sám. */
export type SoukromyProfil = {
  ico: string | null
  overeno: boolean
  adresa: string | null
  chce_emaily: boolean
}

export type StavOvereni = 'overeno' | 'ceka' | 'neovereno'

export function stavOvereni(p: SoukromyProfil | undefined): StavOvereni {
  if (p?.overeno) return 'overeno'
  return p?.ico ? 'ceka' : 'neovereno'
}

const KLIC = 'muj-profil'

export function useSoukromyProfil() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KLIC, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SoukromyProfil> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('ico, overeno, adresa, chce_emaily')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return {
        ico: data.ico ?? null,
        overeno: !!data.overeno,
        adresa: data.adresa ?? null,
        chce_emaily: data.chce_emaily !== false,
      }
    },
  })
}

export const TELEFON = /^(\+420|00420)?\d{9}$/
export const cistyTelefon = (t: string) => t.replace(/[\s\-().]/g, '')
export const cisteIco = (t: string) => t.replace(/\s/g, '')

/** Co pilot vyžaduje, než pustí uživatele k poptávce. */
export function chybiVProfilu(user: User | null) {
  const m = user?.user_metadata ?? {}
  const chybi: string[] = []
  if (!String(m.full_name ?? '').trim()) chybi.push('jméno')
  if (!String(m.phone ?? '').trim()) chybi.push('telefon')
  if (!String(m.city ?? '').trim()) chybi.push('město')
  return chybi
}

async function ulozVerejnyProfil(user: User, role: Role) {
  const m = user.user_metadata ?? {}
  const radek: Record<string, unknown> = {
    id: user.id,
    full_name: m.full_name || 'Uživatel',
    role,
    city: m.city ?? '',
    bio: m.bio ?? '',
  }
  // Bez fotky se sloupec neposílá, ať se nepřepíše to, co tam už je.
  if (m.avatar_url) radek.avatar_url = m.avatar_url
  const { error } = await supabase.from('public_profiles').upsert(radek)
  if (error) throw error
}

export type Udaje = {
  full_name: string
  phone: string
  city: string
  bio: string
  ico?: string
  adresa?: string
  chce_emaily?: boolean
}

export type VysledekUlozeni = { varovani: string[] }

export function useUlozitProfil() {
  const { role } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ udaje, puvodni }: { udaje: Udaje; puvodni?: SoukromyProfil }): Promise<VysledekUlozeni> => {
      const varovani: string[] = []
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: udaje.full_name.trim(), phone: udaje.phone.trim(), city: udaje.city.trim(), bio: udaje.bio.trim() },
      })
      if (error) throw error
      const user = data.user
      const zmeny: Record<string, unknown> = {}

      // Příznak overeno se nikdy neposílá, nastavuje ho jen admin.
      if (udaje.ico !== undefined) {
        const ico = cisteIco(udaje.ico)
        if (ico !== (puvodni?.ico ?? '')) zmeny.ico = ico || null
      }
      // Upozornění se ukládají, jen když se jejich hodnota předtím načetla.
      if (udaje.chce_emaily !== undefined && puvodni && udaje.chce_emaily !== puvodni.chce_emaily)
        zmeny.chce_emaily = udaje.chce_emaily

      if (udaje.adresa !== undefined && role === 'craftsman') {
        const adresa = udaje.adresa.trim()
        if (adresa !== (puvodni?.adresa ?? '')) {
          if (!adresa) Object.assign(zmeny, { adresa: null, lat: null, lon: null })
          else {
            const bod = await geokoduj(adresa)
            if (bod) Object.assign(zmeny, { adresa, ...bod })
            else varovani.push('Místo, odkud vyjíždíte, se nepodařilo najít. Zkuste ulici a město.')
          }
        }
      }

      if (Object.keys(zmeny).length) {
        const { error: chyba } = await supabase.from('profiles').update(zmeny).eq('id', user.id)
        if (chyba) varovani.push('IČO, adresu ani upozornění se nepodařilo uložit.')
      }

      try {
        await ulozVerejnyProfil(user, role)
      } catch {
        varovani.push('Veřejný profil se nepodařilo aktualizovat, ostatní mohou chvíli vidět staré údaje.')
      }
      return { varovani }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [KLIC] }),
  })
}

/** Zmenší fotku na 600 px a vrátí JPEG. */
function zmensiFotku(soubor: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(soubor)
    const img = new Image()
    img.onload = () => {
      const MAX = 600
      const pomer = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * pomer)
      canvas.height = Math.round(img.height * pomer)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Obrázek se nepodařilo zpracovat.'))), 'image/jpeg', 0.9)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Tenhle soubor se nedá otevřít jako obrázek.'))
    }
    img.src = url
  })
}

export function useNahratFotku() {
  const { role } = useAuth()
  return useMutation({
    mutationFn: async ({ soubor, uid }: { soubor: File; uid: string }) => {
      if (soubor.size > 10 * 1024 * 1024) throw new Error('Fotka může mít nejvýš 10 MB.')
      const blob = await zmensiFotku(soubor)
      const cesta = `${uid}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(cesta, blob, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(cesta)
      // Adresa souboru zůstává stejná, parametr v donutí prohlížeče stáhnout novou fotku.
      const { data: ulozeno, error: chyba } = await supabase.auth.updateUser({ data: { avatar_url: `${data.publicUrl}?v=${Date.now()}` } })
      if (chyba) throw chyba
      await ulozVerejnyProfil(ulozeno.user, role).catch(() => undefined)
    },
  })
}

export function useZmenitHeslo() {
  return useMutation({
    mutationFn: async (heslo: string) => {
      const { error } = await supabase.auth.updateUser({ password: heslo })
      if (error) throw error
    },
  })
}

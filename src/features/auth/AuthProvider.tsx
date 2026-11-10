import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/lib/types'

const PENDING_ROLE_KEY = 'remexo_pending_role'

type AuthState = {
  session: Session | null
  user: User | null
  role: Role
  jmeno: string
  nacitani: boolean
  obnovaHesla: boolean
  setObnovaHesla: (v: boolean) => void
  /** Uloží roli vybranou před přihlášením (přežije i přesměrování z Googlu). */
  zapamatujRoli: (role: Role) => void
  odhlasit: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * O přístupu rozhoduje profiles.role (mění se jen přes RPC zmen_roli).
 * user_metadata.role si uživatel může přepsat sám, proto slouží jen jako záloha pro vzhled.
 */
async function nastavRoli(user: User): Promise<Role> {
  let pozadovana: Role | null = null
  try {
    pozadovana = localStorage.getItem(PENDING_ROLE_KEY) as Role | null
    localStorage.removeItem(PENDING_ROLE_KEY)
  } catch { /* soukromé okno */ }

  const jmeno = user.user_metadata?.full_name || 'Uživatel'
  // Řádek v profiles zakládá spouštěč při registraci – proto update, ne upsert.
  await supabase.from('profiles').update({ full_name: jmeno }).eq('id', user.id)

  if (pozadovana === 'customer' || pozadovana === 'craftsman') {
    const { error } = await supabase.rpc('zmen_roli', { p_role: pozadovana })
    if (!error) {
      if (user.user_metadata?.role !== pozadovana) await supabase.auth.updateUser({ data: { role: pozadovana } })
      return pozadovana
    }
  }

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const zDb = data?.role
  if (zDb === 'customer' || zDb === 'craftsman') return zDb
  return user.user_metadata?.role === 'craftsman' ? 'craftsman' : 'customer'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role>('customer')
  const [nacitani, setNacitani] = useState(true)
  const [obnovaHesla, setObnovaHesla] = useState(false)

  useEffect(() => {
    let zruseno = false

    const prijmiSession = async (s: Session | null) => {
      setSession(s)
      if (s?.user) {
        const r = await nastavRoli(s.user).catch(() => 'customer' as Role)
        if (!zruseno) setRole(r)
      }
      if (!zruseno) setNacitani(false)
    }

    supabase.auth.getSession().then(({ data }) => prijmiSession(data.session))

    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setObnovaHesla(true)
      if (event === 'SIGNED_IN') {
        setNacitani(true)
        // Mimo callback – Supabase nedoporučuje await uvnitř onAuthStateChange
        setTimeout(() => prijmiSession(s), 0)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
      } else {
        setSession(s)
      }
    })

    return () => {
      zruseno = true
      data.subscription.unsubscribe()
    }
  }, [])

  const user = session?.user ?? null

  const value: AuthState = {
    session,
    user,
    role,
    jmeno: user?.user_metadata?.full_name || 'Uživatel',
    nacitani,
    obnovaHesla,
    setObnovaHesla,
    zapamatujRoli: (r) => {
      setRole(r)
      try { localStorage.setItem(PENDING_ROLE_KEY, r) } catch { /* nic */ }
    },
    odhlasit: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth musí být uvnitř <AuthProvider>')
  return ctx
}

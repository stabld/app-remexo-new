import { useAuth } from '@/features/auth/AuthProvider'
import { useMojePoptavky } from '@/features/requests/api'
import type { Bublina } from '@/app/navigace'

/** Počty do bublin v navigaci. */
export function useBubliny(): Record<Bublina, number> {
  const { role } = useAuth()
  const { data } = useMojePoptavky({ enabled: role === 'customer' })
  return { nabidky: (data ?? []).reduce((s, p) => s + p.cekajiciNabidky, 0) }
}

import { useAuth } from '@/features/auth/AuthProvider'
import { useMojePoptavky } from '@/features/requests/api'
import type { Bublina } from '@/app/navigace'
import { useKonverzace } from '@/features/chat/api'

/** Počty do bublin v navigaci. */
export function useBubliny(): Record<Bublina, number> {
  const { role } = useAuth()
  const { data } = useMojePoptavky({ enabled: role === 'customer' })
  const { data: konverzace } = useKonverzace()
  return {
    nabidky: (data ?? []).reduce((s, p) => s + p.cekajiciNabidky, 0),
    zpravy: (konverzace ?? []).reduce((s, k) => s + k.neprectene, 0),
  }
}

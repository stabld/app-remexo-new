import { useQuery } from '@tanstack/react-query'
import { MapPin, ShieldCheck, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { kratkeDatum } from '@/lib/cas'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { NacitaniStranky } from '@/components/NacitaniStranky'

type Profil = { full_name: string | null; avatar_url: string | null; role: string | null; city: string | null; bio: string | null; overeno: boolean | null }
type Hodnoceni = { hvezdicky: number; komentar: string | null; created_at: string | null }

function useVerejnyProfil(id: string | null) {
  return useQuery({
    queryKey: ['verejny-profil', id],
    enabled: !!id,
    queryFn: async () => {
      const [p, h] = await Promise.all([
        supabase.from('public_profiles').select('full_name, avatar_url, role, city, bio, overeno').eq('id', id!).maybeSingle(),
        supabase.from('hodnoceni').select('hvezdicky, komentar, created_at').eq('craftsman_id', id!).order('created_at', { ascending: false }).limit(20),
      ])
      if (p.error) throw p.error
      return { profil: p.data as Profil | null, hodnoceni: (h.data ?? []) as Hodnoceni[] }
    },
  })
}

/** Veřejný profil řemeslníka – zákazník se podle něj rozhoduje, komu dát zakázku. */
export function VerejnyProfil({ id, jmeno, zavrit }: { id: string | null; jmeno: string; zavrit: () => void }) {
  const { data, isPending, isError } = useVerejnyProfil(id)
  const p = data?.profil
  const hodnoceni = data?.hodnoceni ?? []
  const prumer = hodnoceni.length ? hodnoceni.reduce((a, h) => a + h.hvezdicky, 0) / hodnoceni.length : null
  const sKomentarem = hodnoceni.filter((h) => h.komentar?.trim())
  // avatar_url si uživatel ukládá sám, pustíme jen https odkaz
  const avatar = p?.avatar_url && /^https:\/\//i.test(p.avatar_url) ? p.avatar_url : null

  return (
    <Modal otevreno={!!id} zavrit={zavrit} nadpis="Profil řemeslníka">
      {isPending ? (
        <NacitaniStranky />
      ) : isError || !p ? (
        <p className="text-sm text-muted">{jmeno} si zatím neuložil veřejný profil.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar jmeno={p.full_name || jmeno} url={avatar} velikost={64} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-lg font-semibold">
                {p.full_name || jmeno}
                {p.overeno && <ShieldCheck className="size-[18px] text-success-text" aria-label="Ověřený" />}
              </p>
              {p.city && <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" aria-hidden />{p.city}</p>}
              {p.overeno && <p className="text-xs font-medium text-success-text">Živnostenské oprávnění ověřeno v rejstříku</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-[10px] bg-bg px-3.5 py-3">
            <Star className={`size-5 ${prumer ? 'fill-accent text-accent' : 'text-line-strong'}`} aria-hidden />
            {prumer ? (
              <span className="text-sm"><b className="text-base font-semibold">{prumer.toLocaleString('cs', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b> z {hodnoceni.length} hodnocení</span>
            ) : (
              <span className="text-sm text-muted">Zatím bez hodnocení, na Remexu je nový</span>
            )}
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">O mně</h3>
            <p className="whitespace-pre-line text-sm text-soft">{p.bio?.trim() || 'Řemeslník zatím nevyplnil popis.'}</p>
          </div>

          {sKomentarem.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Co píšou zákazníci</h3>
              <ul className="flex flex-col gap-2.5">
                {sKomentarem.slice(0, 5).map((h, i) => (
                  <li key={i} className="rounded-[10px] border border-line px-3.5 py-2.5">
                    <p className="flex items-center gap-1 text-xs text-muted">
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-3 ${n <= h.hvezdicky ? 'fill-accent text-accent' : 'text-line-strong'}`} aria-hidden />)}
                      <span className="ml-1">{kratkeDatum(h.created_at)}</span>
                    </p>
                    <p className="mt-1 text-sm">„{h.komentar}“</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

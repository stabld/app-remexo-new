import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { StaraFotka } from '@/lib/popis'
import { FotkaMisto } from './ui/FotkaMisto'

/**
 * Bucket „poptavky“ je neveřejný – na fotky se vystavují dočasné podepsané odkazy (1 h).
 * Cesty, ke kterým uživatel nemá přístup, se prostě nezobrazí.
 */
function usePodepsaneOdkazy(cesty: string[]) {
  return useQuery({
    queryKey: ['fotky', cesty],
    enabled: cesty.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('poptavky').createSignedUrls(cesty, 3600)
      if (error) throw error
      return data.map((z) => z.signedUrl).filter((u): u is string => !!u)
    },
  })
}

function useZdroje(soubory: string[], stare: StaraFotka[] = []) {
  const { data: odkazy = [] } = usePodepsaneOdkazy(soubory)
  return [...odkazy, ...stare.map((f) => `data:${f.mime || 'image/jpeg'};base64,${f.data}`)]
}

/** Galerie fotek závady, po kliknutí v plné velikosti. */
export function Fotky({ soubory, stare }: { soubory: string[]; stare?: StaraFotka[] }) {
  const zdroje = useZdroje(soubory, stare)
  if (!zdroje.length) return null
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {zdroje.map((src, i) => (
        <a key={src.slice(0, 120)} href={src} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden rounded-[10px] bg-placeholder">
          <img src={src} alt={`Fotka závady ${i + 1}`} className="size-full object-cover transition-opacity hover:opacity-90" />
        </a>
      ))}
    </div>
  )
}

/** Náhled první fotky; bez fotky šedé místo stejné velikosti. */
export function Nahled({ soubory, stare, className = 'size-[72px]' }: { soubory: string[]; stare?: StaraFotka[]; className?: string }) {
  const [prvni] = useZdroje(soubory.slice(0, 1), (stare ?? []).slice(0, 1))
  if (!prvni) return <FotkaMisto className={className} />
  return <img src={prvni} alt="" className={`shrink-0 rounded-[10px] bg-placeholder object-cover ${className}`} />
}

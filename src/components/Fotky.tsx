import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { StaraFotka } from '@/lib/popis'

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

function useZdroje(soubory: string[], stare: StaraFotka[]) {
  const { data: odkazy = [] } = usePodepsaneOdkazy(soubory)
  return [...odkazy, ...stare.map((f) => `data:${f.mime || 'image/jpeg'};base64,${f.data}`)]
}

/** Všechny fotky závady v řadě, po kliknutí v plné velikosti. */
export function Fotky({ soubory, stare = [] }: { soubory: string[]; stare?: StaraFotka[] }) {
  const zdroje = useZdroje(soubory, stare)
  if (!zdroje.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {zdroje.map((src) => (
        <a key={src.slice(0, 120)} href={src} target="_blank" rel="noreferrer">
          <img src={src} alt="Fotka závady" className="size-24 rounded-lg bg-stone-100 object-cover hover:opacity-90 dark:bg-stone-800" />
        </a>
      ))}
    </div>
  )
}

/** Malý náhled první fotky do řádku seznamu. Bez fotky nic nevykreslí. */
export function Nahled({ soubory, stare = [] }: { soubory: string[]; stare?: StaraFotka[] }) {
  const [prvni] = useZdroje(soubory.slice(0, 1), stare.slice(0, 1))
  if (!prvni) return null
  return <img src={prvni} alt="" className="size-14 shrink-0 rounded-lg bg-stone-100 object-cover dark:bg-stone-800" />
}

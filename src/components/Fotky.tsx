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

export function Fotky({ soubory, stare = [], velikost = 'size-24' }: { soubory: string[]; stare?: StaraFotka[]; velikost?: string }) {
  const { data: odkazy = [] } = usePodepsaneOdkazy(soubory)
  const vsechny = [...odkazy, ...stare.map((f) => `data:${f.mime || 'image/jpeg'};base64,${f.data}`)]
  if (!vsechny.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {vsechny.map((src) => (
        <a key={src.slice(0, 120)} href={src} target="_blank" rel="noreferrer">
          <img
            src={src}
            alt="Fotka závady"
            className={`${velikost} rounded-xl border border-slate-200 bg-slate-100 object-cover transition hover:opacity-80 dark:border-slate-700 dark:bg-slate-800`}
          />
        </a>
      ))}
    </div>
  )
}

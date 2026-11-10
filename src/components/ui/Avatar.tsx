import { useState } from 'react'

const BARVY = [
  'bg-[#DCE7F9] text-[#1D4FB8]',
  'bg-[#E7F6EE] text-[#157347]',
  'bg-[#F3E8FF] text-[#6B21A8]',
  'bg-[#FDECEC] text-[#B42318]',
  'bg-[#E0F2F1] text-[#0F766E]',
]

export function iniciály(jmeno: string) {
  const casti = jmeno.trim().split(/\s+/).filter(Boolean)
  return ((casti[0]?.[0] ?? '') + (casti.length > 1 ? casti[casti.length - 1][0] : '')).toUpperCase() || '?'
}

/** Fotka, a když není nebo se nenačte, iniciály v barvě odvozené ze jména. */
export function Avatar({ jmeno, url, velikost = 36 }: { jmeno: string; url?: string | null; velikost?: number }) {
  const [chyba, setChyba] = useState(false)
  const styl = { width: velikost, height: velikost, fontSize: Math.round(velikost * 0.36) }
  if (url && !chyba)
    return <img src={url} alt="" onError={() => setChyba(true)} style={styl} className="shrink-0 rounded-full object-cover" />
  const barva = BARVY[[...jmeno].reduce((s, z) => s + z.charCodeAt(0), 0) % BARVY.length]
  return (
    <span style={styl} className={`grid shrink-0 place-items-center rounded-full font-semibold ${barva}`} aria-hidden>
      {iniciály(jmeno)}
    </span>
  )
}

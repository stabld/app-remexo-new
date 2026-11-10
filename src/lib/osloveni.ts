/**
 * 5. pád křestního jména pro pozdrav („Dobrý den, Davide“).
 * Pokrývá běžná česká jména; když si pravidlem nejsme jistí, vrátí jméno beze změny.
 */
export function vokativ(jmeno: string): string {
  const j = jmeno.trim().split(/\s+/)[0] ?? ''
  if (j.length < 2) return j
  const nizke = j.toLowerCase()
  if (/a$/.test(nizke)) return j.slice(0, -1) + 'o'                // Jana → Jano
  if (/[eiyouáéíýů]$/.test(nizke)) return j                       // Marie, Jiří, René
  if (/ek$/.test(nizke)) return j.slice(0, -2) + 'ku'              // Marek → Marku
  if (/el$/.test(nizke)) return j.slice(0, -2) + 'le'              // Pavel → Pavle
  if (/[bcdfghjklmnpqrstvwxz]r$/.test(nizke)) return j.slice(0, -1) + 'ře' // Petr → Petře
  if (/[šžčřjc]$/.test(nizke)) return j + 'i'                       // Tomáš → Tomáši
  if (/[kgh]$/.test(nizke)) return j + 'u'                          // Radek→ výše, Oleg → Olegu
  return j + 'e'                                                    // David → Davide, Jan → Jane
}

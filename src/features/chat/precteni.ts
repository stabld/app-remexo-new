/**
 * Kdy si uživatel konverzaci naposledy prohlédl (v tomto prohlížeči).
 * Databáze si přečtení pamatuje přes RPC oznac_precteno (kvůli e-mailům),
 * ale zpět ho nevydá, takže počet nepřečtených počítáme tady.
 */
const klic = (uid: string) => `remexo-videno-${uid}`

type Mapa = { zaklad: string; konverzace: Record<string, string> }

function nacti(uid: string): Mapa {
  try {
    const s = localStorage.getItem(klic(uid))
    if (s) return JSON.parse(s)
  } catch { /* nic */ }
  // Poprvé: starší zprávy bereme jako přečtené, ať nový uživatel nemá hned 40 nepřečtených
  const m = { zaklad: new Date().toISOString(), konverzace: {} }
  try { localStorage.setItem(klic(uid), JSON.stringify(m)) } catch { /* nic */ }
  return m
}

export function videno(uid: string, konverzace: string): string {
  const m = nacti(uid)
  return m.konverzace[konverzace] ?? m.zaklad
}

export function oznacVideno(uid: string, konverzace: string) {
  const m = nacti(uid)
  m.konverzace[konverzace] = new Date().toISOString()
  try { localStorage.setItem(klic(uid), JSON.stringify(m)) } catch { /* nic */ }
}

/** Databáze vrací čas bez zóny („2026-08-11T13:40:55“), přestože je v UTC – doplníme Z. */
export function parsujDatum(datum: string | null | undefined): Date | null {
  if (!datum) return null
  const vstup = datum.includes('T') && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(datum) ? datum + 'Z' : datum
  const d = new Date(vstup)
  return isNaN(d.getTime()) ? null : d
}

export function formatDatumCas(datum: string | null | undefined): string {
  const d = parsujDatum(datum)
  if (!d) return ''
  return (
    d.toLocaleDateString('cs', { day: 'numeric', month: 'numeric', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })
  )
}

export type Stari = { text: string; cerstve: boolean; minut: number }

export function stariPoptavky(datum: string | null | undefined): Stari | null {
  const d = parsujDatum(datum)
  if (!d) return null
  const minut = Math.floor((Date.now() - d.getTime()) / 60000)
  if (minut < -60) return null // hodiny zařízení mírně napřed nevadí, nesmysl ano
  if (minut < 1) return { text: 'právě teď', cerstve: true, minut }
  if (minut < 60) return { text: `před ${minut} min`, cerstve: true, minut }
  const hodin = Math.floor(minut / 60)
  if (hodin < 24) return { text: `před ${hodin} h`, cerstve: hodin < 3, minut }
  const dnu = Math.floor(hodin / 24)
  if (dnu === 1) return { text: 'včera', cerstve: false, minut }
  if (dnu < 31) return { text: `před ${dnu} dny`, cerstve: false, minut }
  return { text: d.toLocaleDateString('cs'), cerstve: false, minut }
}

/** „dnes 9:15“, „včera 18:02“, „9. 11. 14:20“ – pro historii a aktivitu. */
export function relativniCas(datum: string | null | undefined): string {
  const d = parsujDatum(datum)
  if (!d) return ''
  const cas = d.toLocaleTimeString('cs', { hour: 'numeric', minute: '2-digit' })
  const dnes = new Date()
  const vcera = new Date(dnes.getFullYear(), dnes.getMonth(), dnes.getDate() - 1)
  if (d.toDateString() === dnes.toDateString()) return `dnes ${cas}`
  if (d.toDateString() === vcera.toDateString()) return `včera ${cas}`
  return `${kratkeDatum(datum)} ${cas}`
}

/** „9. 11.“, s rokem jen když není letošní. */
export function kratkeDatum(datum: string | null | undefined): string {
  const d = parsujDatum(datum)
  if (!d) return ''
  const letos = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('cs', { day: 'numeric', month: 'numeric', ...(letos ? {} : { year: 'numeric' }) })
}

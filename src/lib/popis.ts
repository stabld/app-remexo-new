/**
 * Popis poptávky je v databázi uložený jako jeden text:
 *   hlavní popis
 *   ---
 *   📋 DOPLŇUJÍCÍ INFORMACE:
 *   📍 Adresa: …   📅 Termín: …   …
 *   ||FOTO||cesta/ve/storage      (nové fotky)
 *   ||PHOTO||base64||MIME||typ    (staré fotky)
 * Tady ho rozložíme na části, se kterými se dá pracovat.
 */

export type StaraFotka = { data: string; mime: string }
export type Fakt = { popisek: string; hodnota: string }
export type RozlozenyPopis = {
  hlavni: string
  fakta: Fakt[]
  /** Cesty do bucketu „poptavky“ */
  soubory: string[]
  stareFotky: StaraFotka[]
}

const ZNACKA = '📋 DOPLŇUJÍCÍ INFORMACE:'

const TYPY: { re: RegExp; popisek: string }[] = [
  { re: /^📍\uFE0F?\s*(?:Adresa:\s*)?/, popisek: 'Místo' },
  { re: /^📅\uFE0F?\s*Termín:\s*/, popisek: 'Termín' },
  { re: /^🏠\uFE0F?\s*Typ objektu:\s*/, popisek: 'Typ objektu' },
  { re: /^🚗\uFE0F?\s*Parkování:\s*/, popisek: 'Parkování' },
  { re: /^💰\uFE0F?\s*Rozpočet:\s*/, popisek: 'Rozpočet' },
]

function oddelFotky(raw: string) {
  const soubory: string[] = []
  const zbytek = raw.replace(/\n?\|\|FOTO\|\|([^\n|]+)/g, (_, cesta: string) => {
    if (cesta.trim()) soubory.push(cesta.trim())
    return ''
  })
  const [text, ...stare] = zbytek.split('||PHOTO||')
  const stareFotky = stare
    .map((s) => s.split('||MIME||'))
    .filter((p) => p.length >= 2)
    .map(([data, mime]) => ({ data, mime: mime.trim() }))
  return { text: text.trim(), soubory, stareFotky }
}

/**
 * @param bezKontaktu true = vynechá telefon a z adresy nechá jen město
 *   (pro tržiště a řemeslníka před přijetím nabídky)
 */
export function rozlozPopis(raw: string | null | undefined, bezKontaktu = false): RozlozenyPopis {
  const { text, soubory, stareFotky } = oddelFotky(raw ?? '')
  const [hlavniCast, ...zbytek] = text.split('---')
  const radky = zbytek
    .join('---')
    .replace(ZNACKA, '')
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)

  const fakta: Fakt[] = []
  for (const r of radky) {
    if (r.startsWith('📞')) {
      if (!bezKontaktu) fakta.push({ popisek: 'Telefon', hodnota: r.replace(/^📞\uFE0F?\s*(Telefon:\s*)?/, '') })
      continue
    }
    const typ = TYPY.find((t) => t.re.test(r))
    let hodnota = typ ? r.replace(typ.re, '').trim() : r
    if (typ?.popisek === 'Místo' && bezKontaktu) {
      const casti = hodnota.split(',')
      hodnota = casti[casti.length - 1].trim()
    }
    if (hodnota) fakta.push({ popisek: typ?.popisek ?? 'Další informace', hodnota })
  }

  return { hlavni: hlavniCast.trim(), fakta, soubory, stareFotky }
}

export type NovaFotka = { id: string; nahled: string; base64: string; mime: 'image/jpeg' }

export const MAX_FOTEK = 5

/**
 * Zmenší fotku na max. 800 px a překóduje do JPEG (jako pilot).
 * Překódování přes plátno zahodí původní bajty, ať v souboru bylo cokoliv.
 */
export function pripravFotku(soubor: File): Promise<NovaFotka | null> {
  return new Promise((resolve) => {
    if (!soubor.type.startsWith('image/')) return resolve(null)
    const url = URL.createObjectURL(soubor)
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      let w = img.width, h = img.height
      if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX } else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const dataUrl = c.toDataURL('image/jpeg', 0.8)
      resolve({ id: crypto.randomUUID(), nahled: dataUrl, base64: dataUrl.split(',')[1], mime: 'image/jpeg' })
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

export function base64NaBlob(base64: string, mime: string) {
  const bin = atob(base64)
  const pole = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) pole[i] = bin.charCodeAt(i)
  return new Blob([pole], { type: mime })
}

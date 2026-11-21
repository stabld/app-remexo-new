import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Poptavka } from '@/lib/types'
import { OBLASTI } from '@/config/region'
import type { Poloha } from './api'

const escapuj = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function ikonaZakazky(vybrana: boolean) {
  const v = vybrana ? 38 : 26
  return L.divIcon({
    className: '',
    iconSize: [v, v],
    iconAnchor: [v / 2, v / 2],
    html: vybrana
      ? `<span class="mapa-pin mapa-pin--vybrany"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></span>`
      : '<span class="mapa-pin"></span>',
  })
}

const ikonaDomu = L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9], html: '<span class="mapa-domu"></span>' })

/**
 * Mapa volných zakázek. Polohy v DB jsou zaokrouhlené (~100 m), přesnou adresu řemeslník uvidí až po přijetí nabídky.
 */
export function MapaZakazek({ zakazky, poloha, vybrana, onVyber }: {
  zakazky: Poptavka[]
  poloha: Poloha | null | undefined
  vybrana: number | null
  onVyber: (id: number) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const vrstva = useRef<L.LayerGroup | null>(null)
  const znacky = useRef(new Map<number, L.Marker>())
  const ohraniceni = useRef<L.LatLngBounds | null>(null)
  const posunuto = useRef(false)
  const vyber = useRef(onVyber)
  useEffect(() => { vyber.current = onVyber }, [onVyber])

  useEffect(() => {
    if (!el.current) return
    const o = OBLASTI[0]
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([o.lat, o.lon], 11)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(m)
    vrstva.current = L.layerGroup().addTo(m)
    mapa.current = m
    m.on('dragstart', () => { posunuto.current = true })
    // Kontejner se může ještě roztahovat; dokud uživatel mapou nehýbal, držíme v záběru všechny zakázky.
    const ro = new ResizeObserver(() => {
      m.invalidateSize()
      if (!posunuto.current && ohraniceni.current) m.fitBounds(ohraniceni.current, { padding: [48, 48], maxZoom: 13 })
    })
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      m.remove()
      mapa.current = null
    }
  }, [])

  // Značky a výřez se přepočítají, jen když se změní seznam (ne při výběru).
  useEffect(() => {
    const m = mapa.current
    const v = vrstva.current
    if (!m || !v) return
    v.clearLayers()
    znacky.current.clear()
    const body: L.LatLngExpression[] = []
    if (poloha) {
      L.marker([poloha.lat, poloha.lon], { icon: ikonaDomu, zIndexOffset: 1000, keyboard: false })
        .bindTooltip('Odtud vyjíždíš', { direction: 'top', offset: [0, -8] })
        .addTo(v)
      body.push([poloha.lat, poloha.lon])
    }
    for (const z of zakazky) {
      const lat = Number(z.lat)
      const lon = Number(z.lon)
      if (z.lat == null || z.lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) continue
      const znacka = L.marker([lat, lon], { icon: ikonaZakazky(false), title: z.title ?? 'Zakázka' })
        .bindTooltip(`<b>${escapuj(z.title ?? 'Zakázka')}</b>${z.mesto ? `<br>${escapuj(z.mesto)}` : ''}`, { direction: 'top', offset: [0, -12] })
        .on('click', () => vyber.current(z.id))
        .addTo(v)
      znacky.current.set(z.id, znacka)
      body.push([lat, lon])
    }
    ohraniceni.current = body.length ? L.latLngBounds(body) : null
    if (ohraniceni.current) m.fitBounds(ohraniceni.current, { padding: [48, 48], maxZoom: 13 })
  }, [zakazky, poloha])

  useEffect(() => {
    for (const [id, znacka] of znacky.current) {
      const je = id === vybrana
      znacka.setIcon(ikonaZakazky(je))
      znacka.setZIndexOffset(je ? 900 : 0)
      if (je && mapa.current && !mapa.current.getBounds().pad(-0.15).contains(znacka.getLatLng()))
        mapa.current.panTo(znacka.getLatLng(), { animate: true })
    }
  }, [vybrana, zakazky, poloha])

  return <div ref={el} className="mapa-zakazek size-full" role="region" aria-label="Mapa zakázek" />
}

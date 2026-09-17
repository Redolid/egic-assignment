import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { FitBoundsIcon } from '../../../components/ui/Icons'
import { prefersReducedMotion } from '../../../lib/motion'
import { googleMapsUrl } from '../lib/traders'
import type { Trader } from '../lib/traders'
import type { Selection } from '../selection'

/*
 * Each trader is a drop in the traders' pipe colour, carrying the same number as its list row.
 * Hover and selection are CSS classes toggled on the existing marker element (see index.css),
 * so state changes animate instead of swapping icons.
 */
const dropIcon = (number: number) =>
  L.divIcon({
    className: 'trader-pin',
    html: `<span class="trader-pin__body">
        <svg viewBox="0 0 30 40" aria-hidden="true">
          <path d="M15 39C15 39 3 26 3 15a12 12 0 0 1 24 0c0 11-12 24-12 24Z" fill="currentColor" />
          <circle cx="15" cy="15" r="8.5" style="fill: var(--surface)" />
        </svg>
        <span class="trader-pin__number">${number}</span>
        <span class="trader-pin__ping"></span>
      </span>`,
    iconSize: [30, 40],
    iconAnchor: [15, 39],
    popupAnchor: [0, -40],
  })

const FOCUS_ZOOM = 15

interface TradersMapProps {
  traders: Trader[]
  selection: Selection
  hoveredId: number | null
  onMarkerSelect: (id: number) => void
  onMarkerHover: (id: number | null) => void
  onPopupClose: (id: number) => void
  onShowAll: () => void
}

export function TradersMap({
  traders,
  selection,
  hoveredId,
  onMarkerSelect,
  onMarkerHover,
  onPopupClose,
  onShowAll,
}: TradersMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const markers = useRef(new Map<number, L.Marker>())

  const bounds = useMemo(
    () => L.latLngBounds(traders.map((trader) => [trader.lat, trader.lng] as L.LatLngTuple)),
    [traders],
  )
  // Stable icon objects: react-leaflet only calls setIcon (replacing the element) when the icon changes.
  const icons = useMemo(() => new Map(traders.map((trader, index) => [trader.id, dropIcon(index + 1)])), [traders])

  // Reflect hover and selection on the markers themselves (classes → CSS transitions).
  useEffect(() => {
    markers.current.forEach((marker, id) => {
      const element = marker.getElement()
      element?.classList.toggle('is-selected', selection?.id === id)
      element?.classList.toggle('is-hovered', hoveredId === id && selection?.id !== id)
    })
  }, [selection, hoveredId, map])

  // List → map: fly to the chosen trader, then open its popup once the animation ends
  // (opening it mid-flight would auto-pan and interrupt the animation).
  useEffect(() => {
    if (!map || selection?.source !== 'list') return
    const trader = traders.find((t) => t.id === selection.id)
    const marker = markers.current.get(selection.id)
    if (!trader || !marker) return

    // No closePopup() here: Leaflet closes the previous popup when the new one opens, and closing
    // it early would fire `popupclose` and clear the selection when the same item is clicked twice.
    const openPopup = () => marker.openPopup()
    map.once('moveend', openPopup)
    const reduced = prefersReducedMotion()
    map.flyTo([trader.lat, trader.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
      duration: reduced ? 0 : 0.8,
      animate: !reduced,
    })

    // A newer selection cancels the pending popup of this one.
    return () => {
      map.off('moveend', openPopup)
    }
  }, [map, selection, traders])

  return (
    // `isolate` keeps Leaflet's high z-indexes from covering the sticky page header.
    <div className="panel relative isolate h-full w-full overflow-hidden">
      <MapContainer ref={setMap} bounds={bounds} boundsOptions={{ padding: [48, 48] }} scrollWheelZoom className="h-full w-full">
        {/* One free tile set for both themes; dark mode re-tones it with a CSS filter (index.css). */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {traders.map((trader, index) => (
          <Marker
            key={trader.id}
            position={[trader.lat, trader.lng]}
            icon={icons.get(trader.id)}
            zIndexOffset={selection?.id === trader.id ? 1000 : hoveredId === trader.id ? 500 : 0}
            title={trader.name}
            ref={(marker) => {
              if (marker) markers.current.set(trader.id, marker)
              else markers.current.delete(trader.id)
            }}
            eventHandlers={{
              click: () => onMarkerSelect(trader.id),
              mouseover: () => onMarkerHover(trader.id),
              mouseout: () => onMarkerHover(null),
              popupclose: () => onPopupClose(trader.id),
            }}
          >
            <Popup>
              <div className="min-w-48 font-sans">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <span data-active="true" className="tag">
                    {index + 1}
                  </span>
                  <span className="label">Trader {trader.id}</span>
                </div>
                <div dir="rtl" lang="ar" className="pt-2 text-base font-semibold text-fg">
                  {trader.name}
                </div>
                <div className="figures mt-0.5 text-xs text-fg-muted">
                  {trader.lat.toFixed(5)}° N, {trader.lng.toFixed(5)}° E
                </div>
                <a
                  href={googleMapsUrl(trader)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
                >
                  Directions in Google Maps
                  <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5">
                    <path d="M4 2h6v6M10 2 2 10" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        type="button"
        onClick={() => {
          // Clearing the selection also cancels a popup still waiting for an in-progress flight.
          onShowAll()
          map?.closePopup()
          map?.flyToBounds(bounds, { padding: [48, 48], duration: 0.8, animate: !prefersReducedMotion() })
        }}
        className="absolute right-3 top-3 z-[1000] inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-fg shadow-lifted transition-colors duration-150 hover:bg-accent hover:text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <FitBoundsIcon width={15} height={15} />
        Show all
      </button>
    </div>
  )
}

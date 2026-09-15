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
 * One authored SVG pin for every trader (L.divIcon). Hover and selection are CSS classes toggled
 * on the existing marker element (see index.css), so state changes animate instead of swapping
 * icons. Leaflet's default PNG icons also break under bundlers, so this sidesteps that too.
 */
const traderIcon = L.divIcon({
  className: 'trader-pin',
  html: `<span class="trader-pin__body">
      <svg viewBox="0 0 30 40" aria-hidden="true">
        <path fill="currentColor" stroke="#fff" stroke-width="2" d="M15 1.5C7.5 1.5 1.5 7.3 1.5 14.6 1.5 24.4 15 38 15 38s13.5-13.6 13.5-23.4C28.5 7.3 22.5 1.5 15 1.5Z"/>
        <circle cx="15" cy="14.5" r="5" fill="#fff"/>
      </svg>
      <span class="trader-pin__ping"></span>
    </span>`,
  iconSize: [30, 40],
  iconAnchor: [15, 38],
  popupAnchor: [0, -38],
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

  // Reflect hover and selection on the pins themselves (classes → CSS transitions).
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
    <div className="relative isolate h-full w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
      <MapContainer ref={setMap} bounds={bounds} boundsOptions={{ padding: [40, 40] }} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {traders.map((trader) => (
          <Marker
            key={trader.id}
            position={[trader.lat, trader.lng]}
            icon={traderIcon}
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
              <div className="min-w-44 font-sans">
                <div dir="rtl" className="text-base font-semibold text-slate-900">
                  {trader.name}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Code {trader.id}</div>
                <a
                  href={googleMapsUrl(trader)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                >
                  Open in Google Maps ↗
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
          map?.flyToBounds(bounds, { padding: [40, 40], duration: 0.8, animate: !prefersReducedMotion() })
        }}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[0_4px_12px_-4px_rgb(15_23_42/0.25)] ring-1 ring-slate-200 transition-[background-color,color,scale] duration-150 hover:bg-slate-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand-500 active:scale-[0.97]"
      >
        <FitBoundsIcon width={16} height={16} />
        Show all
      </button>
    </div>
  )
}

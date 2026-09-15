import { useRef, useState } from 'react'
import { TraderList } from '../features/traders-map/components/TraderList'
import { TradersMap } from '../features/traders-map/components/TradersMap'
import rawTraders from '../features/traders-map/data/traders.json'
import { normalizeTraders } from '../features/traders-map/lib/traders'
import type { Selection } from '../features/traders-map/selection'

// Static data: normalised once at module load, not on every render.
const traders = normalizeTraders(rawTraders)

export function TradersMapPage() {
  const [selection, setSelection] = useState<Selection>(null)
  // Hover is a preview of the link between a row and its pin, before anything is committed.
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const mapSectionRef = useRef<HTMLElement>(null)

  const selectFromList = (id: number) => {
    setSelection({ id, source: 'list' })
    // On small screens the map sits above the list — scroll up so the user sees the result.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">EGIC Traders Map</h1>
        <p className="mt-1 text-sm text-slate-500">
          {traders.length} customer service locations. Select a trader in the list or click a marker.
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[32rem] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section
          aria-label="Traders list"
          className="order-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:order-1"
        >
          <TraderList
            traders={traders}
            selectedId={selection?.id ?? null}
            hoveredId={hoveredId}
            onSelect={selectFromList}
            onHover={setHoveredId}
          />
        </section>

        <section ref={mapSectionRef} aria-label="Map" className="order-1 h-[55vh] min-h-80 scroll-mt-32 lg:order-2 lg:h-full">
          <TradersMap
            traders={traders}
            selection={selection}
            hoveredId={hoveredId}
            onMarkerSelect={(id) => setSelection({ id, source: 'map' })}
            onMarkerHover={setHoveredId}
            onPopupClose={(id) => setSelection((current) => (current?.id === id ? null : current))}
            onShowAll={() => setSelection(null)}
          />
        </section>
      </div>
    </div>
  )
}

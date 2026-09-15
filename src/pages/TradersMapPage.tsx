import { useRef, useState } from 'react'
import { SheetHeader } from '../components/layout/SheetHeader'
import { TraderList } from '../features/traders-map/components/TraderList'
import { TradersMap } from '../features/traders-map/components/TradersMap'
import rawTraders from '../features/traders-map/data/traders.json'
import { normalizeTraders } from '../features/traders-map/lib/traders'
import type { Selection } from '../features/traders-map/selection'

// Static data: normalised once at module load, not on every render.
const traders = normalizeTraders(rawTraders)

export function TradersMapPage() {
  const [selection, setSelection] = useState<Selection>(null)
  // Hover is a preview of the link between a row and its balloon, before anything is committed.
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const mapSectionRef = useRef<HTMLElement>(null)
  const selected = traders.find((trader) => trader.id === selection?.id)

  const selectFromList = (id: number) => {
    setSelection({ id, source: 'list' })
    // On small screens the map sits above the list — scroll up so the user sees the result.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div>
      <SheetHeader
        title="Traders Map"
        description="EGIC customer-service traders. Numbers match between the register and the map: pick a row to fly to its location, or a balloon to find its row."
        cells={[
          { label: 'Locations', value: traders.length },
          {
            label: 'Selected',
            value: selected ? (
              <span dir="rtl" lang="ar" className="block max-w-[12rem] truncate">
                {selected.name}
              </span>
            ) : (
              <span className="text-ink-400">—</span>
            ),
          },
        ]}
      />

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:h-[calc(100dvh-19rem)] lg:min-h-[34rem] lg:grid-cols-[23rem_minmax(0,1fr)]">
        <section aria-labelledby="register-heading" className="order-2 flex min-h-0 flex-col lg:order-1">
          <div className="flex items-baseline justify-between border-b-2 border-ink-950 pb-2">
            <h2 id="register-heading" className="sheet-title text-xl text-ink-950">
              Trader register
            </h2>
            <span className="spec-label">No. · Name · Lat, Lng</span>
          </div>
          <div className="min-h-0 flex-1">
            <TraderList
              traders={traders}
              selectedId={selection?.id ?? null}
              hoveredId={hoveredId}
              onSelect={selectFromList}
              onHover={setHoveredId}
            />
          </div>
        </section>

        <section ref={mapSectionRef} aria-label="Map" className="order-1 h-[58vh] min-h-80 scroll-mt-40 lg:order-2 lg:h-full">
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

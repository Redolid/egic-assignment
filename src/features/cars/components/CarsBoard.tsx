import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Announcements, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SheetHeader } from '../../../components/layout/SheetHeader'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { Button } from '../../../components/ui/Button'
import { CheckIcon } from '../../../components/ui/Icons'
import { productCatalog } from '../data/productCatalog'
import { collisionDetection } from '../dnd'
import type { DragData, DropData } from '../dnd'
import { formatAmount } from '../lib/format'
import { getFleetTotal } from '../lib/pricing'
import { useCars } from '../state/CarsContext'
import { CarCard } from './CarCard'
import { DragPreview } from './DragPreview'
import { ProductCatalog } from './ProductCatalog'
import type { RowFlash } from './ProductTable'

const dragLabel = (data: unknown) => {
  const drag = data as DragData | undefined
  if (!drag) return 'item'
  return drag.type === 'catalog' ? drag.template.name : drag.product.name
}
const dropLabel = (data: unknown) => (data as DropData | undefined)?.carName ?? 'a vehicle'

/** Screen reader announcements for keyboard / assistive-tech dragging. */
const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${dragLabel(active.data.current)}.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${dragLabel(active.data.current)} is over ${dropLabel(over.data.current)}.`
      : `${dragLabel(active.data.current)} is not over a vehicle.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${dragLabel(active.data.current)} dropped on ${dropLabel(over.data.current)}.`
      : `${dragLabel(active.data.current)} was dropped outside a vehicle.`,
  onDragCancel: ({ active }) => `Dragging ${dragLabel(active.data.current)} was cancelled.`,
}

interface Notice {
  id: number
  text: string
}

export function CarsBoard() {
  const { cars, addProduct, moveProduct, resetCars } = useCars()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(cars[0] ? [cars[0].id] : []))
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [noticeVisible, setNoticeVisible] = useState(false)
  const [dropFlashes, setDropFlashes] = useState<Record<string, RowFlash>>({})

  const sensors = useSensors(
    // A few pixels of movement before a mouse drag starts, so clicks still work.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Press-and-hold on touch so normal scrolling is not hijacked.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // The toast stays mounted while it animates out, so it leaves as deliberately as it arrived.
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNoticeVisible(false), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const showNotice = (text: string) => {
    setNotice({ id: Date.now(), text })
    setNoticeVisible(true)
  }

  const expand = (carId: string) => setExpandedIds((ids) => new Set(ids).add(carId))

  const toggle = (carId: string) =>
    setExpandedIds((ids) => {
      const next = new Set(ids)
      if (next.has(carId)) next.delete(carId)
      else next.add(carId)
      return next
    })

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDrag((active.data.current as DragData | undefined) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDrag(null)
    const drag = active.data.current as DragData | undefined
    const drop = over?.data.current as DropData | undefined
    if (!drag || !drop) return

    let productId: string
    if (drag.type === 'catalog') {
      const { name, unitPrice } = drag.template
      const outcome = addProduct(drop.carId, { name, quantity: 1, unitPrice })
      productId = outcome.productId
      showNotice(outcome.merged ? `${name}: quantity ${outcome.quantity} on ${drop.carName}` : `${name} added to ${drop.carName}`)
    } else {
      if (drag.carId === drop.carId) return
      const outcome = moveProduct(drag.carId, drop.carId, drag.product.id)
      if (!outcome) return
      productId = outcome.productId
      showNotice(
        outcome.merged
          ? `${drag.product.name} combined on ${drop.carName}: quantity ${outcome.quantity}`
          : `${drag.product.name} moved to ${drop.carName}`,
      )
    }
    setDropFlashes((flashes) => ({ ...flashes, [drop.carId]: { productId, nonce: Date.now() } }))
    expand(drop.carId)
  }

  const lineCount = cars.reduce((sum, car) => sum + car.products.length, 0)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <SheetHeader
        title="Cars & Products"
        description="Price product lines per vehicle. Drag parts from the list onto a vehicle or add a line in its section; quantities and prices edit in place and every total updates as you type."
        cells={[
          { label: 'Vehicles', value: cars.length },
          { label: 'Lines', value: lineCount },
          { label: 'Grand total, EGP', value: <AnimatedNumber value={getFleetTotal(cars)} format={formatAmount} /> },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={resetCars} className="self-end">
            Reset demo data
          </Button>
        }
      />

      {/* minmax(0,1fr) stops the scrollable parts strip from widening the column on mobile. */}
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <ProductCatalog templates={productCatalog} />

        <section aria-label="Vehicles" className="flex flex-col gap-2">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              expanded={expandedIds.has(car.id)}
              onToggle={toggle}
              dropFlash={dropFlashes[car.id] ?? null}
            />
          ))}
          <div className="border-t-2 border-ink-950" />
        </section>
      </div>

      <DragOverlay dropAnimation={null}>{activeDrag ? <DragPreview drag={activeDrag} /> : null}</DragOverlay>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        {notice && (
          <p
            key={notice.id}
            className={`flex items-center gap-2.5 bg-ink-950 py-2.5 pl-2.5 pr-4 text-sm text-white shadow-[0_14px_30px_-12px_rgb(14_14_13/0.6)] transition-[translate,opacity] ease-[var(--ease-out)] motion-reduce:transition-opacity ${
              noticeVisible ? 'translate-y-0 opacity-100 duration-300' : 'translate-y-3 opacity-0 duration-200'
            } starting:translate-y-4 starting:opacity-0`}
          >
            <span className="grid h-5 w-5 place-items-center bg-pass-600 text-white">
              <CheckIcon width={13} height={13} strokeWidth={3} />
            </span>
            {notice.text}
          </p>
        )}
      </div>
    </DndContext>
  )
}

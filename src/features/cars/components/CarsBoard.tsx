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
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { Button } from '../../../components/ui/Button'
import { CheckIcon } from '../../../components/ui/Icons'
import { productCatalog } from '../data/productCatalog'
import { collisionDetection } from '../dnd'
import type { DragData, DropData } from '../dnd'
import { formatCurrency } from '../lib/format'
import { getFleetTotal } from '../lib/pricing'
import { useCars } from '../state/CarsContext'
import { CarCard } from './CarCard'
import { DragPreview } from './DragPreview'
import { ProductCatalog } from './ProductCatalog'

const dragLabel = (data: unknown) => {
  const drag = data as DragData | undefined
  if (!drag) return 'item'
  return drag.type === 'catalog' ? drag.template.name : drag.product.name
}
const dropLabel = (data: unknown) => (data as DropData | undefined)?.carName ?? 'a car'

/** Screen reader announcements for keyboard / assistive-tech dragging. */
const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${dragLabel(active.data.current)}.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${dragLabel(active.data.current)} is over ${dropLabel(over.data.current)}.`
      : `${dragLabel(active.data.current)} is not over a car.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${dragLabel(active.data.current)} dropped on ${dropLabel(over.data.current)}.`
      : `${dragLabel(active.data.current)} was dropped outside a car.`,
  onDragCancel: ({ active }) => `Dragging ${dragLabel(active.data.current)} was cancelled.`,
}

interface Notice {
  id: number
  product: string
  verb: 'Added' | 'Moved'
  car: string
}

export function CarsBoard() {
  const { cars, addProduct, moveProduct, resetCars } = useCars()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(cars[0] ? [cars[0].id] : []))
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [noticeVisible, setNoticeVisible] = useState(false)
  const [dropPulses, setDropPulses] = useState<Record<string, number>>({})

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
    const timer = window.setTimeout(() => setNoticeVisible(false), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const showNotice = (next: Omit<Notice, 'id'>) => {
    setNotice({ id: Date.now(), ...next })
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

    if (drag.type === 'catalog') {
      const { name, unitPrice } = drag.template
      addProduct(drop.carId, { name, quantity: 1, unitPrice })
      showNotice({ product: name, verb: 'Added', car: drop.carName })
    } else {
      if (drag.carId === drop.carId) return
      moveProduct(drag.carId, drop.carId, drag.product.id)
      showNotice({ product: drag.product.name, verb: 'Moved', car: drop.carName })
    }
    setDropPulses((pulses) => ({ ...pulses, [drop.carId]: (pulses[drop.carId] ?? 0) + 1 }))
    expand(drop.carId)
  }

  const productLines = cars.reduce((sum, car) => sum + car.products.length, 0)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cars &amp; Products</h1>
            <p className="mt-1 text-sm text-slate-500">
              {cars.length} cars · {productLines} product lines · Grand total{' '}
              <AnimatedNumber value={getFleetTotal(cars)} format={formatCurrency} className="font-semibold text-slate-700" />
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetCars} className="self-start sm:self-auto">
            Reset demo data
          </Button>
        </header>

        {/* minmax(0,1fr) stops the scrollable catalog strip from widening the column on mobile. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          <ProductCatalog templates={productCatalog} />

          <section aria-label="Cars" className="flex flex-col gap-4">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                expanded={expandedIds.has(car.id)}
                onToggle={toggle}
                dropPulse={dropPulses[car.id] ?? 0}
              />
            ))}
          </section>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>{activeDrag ? <DragPreview drag={activeDrag} /> : null}</DragOverlay>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        {notice && (
          <p
            key={notice.id}
            className={`flex items-center gap-2 rounded-full bg-slate-900 py-2 pl-2 pr-4 text-sm text-white shadow-[0_12px_28px_-10px_rgb(15_23_42/0.55)] transition-[translate,opacity,scale] ease-[var(--ease-out)] motion-reduce:transition-opacity ${
              noticeVisible ? 'translate-y-0 scale-100 opacity-100 duration-300' : 'translate-y-3 scale-95 opacity-0 duration-200'
            } starting:translate-y-4 starting:scale-95 starting:opacity-0`}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
              <CheckIcon width={14} height={14} strokeWidth={3} />
            </span>
            <span>
              {notice.verb} <strong className="font-semibold">{notice.product}</strong>
              <span className="text-slate-400"> → </span>
              {notice.car}
            </span>
          </p>
        )}
      </div>
    </DndContext>
  )
}

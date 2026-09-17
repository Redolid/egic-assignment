import { useEffect, useRef, useState } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { CarIcon, ChevronDownIcon } from '../../../components/ui/Icons'
import { EASE_OUT, prefersReducedMotion } from '../../../lib/motion'
import { carDropId } from '../dnd'
import type { DragData, DropData } from '../dnd'
import { formatAmount } from '../lib/format'
import { getCarTotal, getCarUnitCount } from '../lib/pricing'
import { useCars } from '../state/CarsContext'
import type { Car, ProductInput } from '../types'
import { AddProductForm } from './AddProductForm'
import { ProductTable } from './ProductTable'
import type { RowFlash } from './ProductTable'

interface CarCardProps {
  car: Car
  expanded: boolean
  onToggle: (carId: string) => void
  /** Set by drag & drop on the board: which row received the drop (pulse + row wash). */
  dropFlash: RowFlash | null
}

/** One vehicle as a ruled sheet section: total in the header, lines unfold below. Also a drop target. */
export function CarCard({ car, expanded, onToggle, dropFlash }: CarCardProps) {
  const { addProduct, updateProduct, deleteProduct } = useCars()
  const sectionRef = useRef<HTMLElement | null>(null)
  const [formFlash, setFormFlash] = useState<RowFlash | null>(null)

  const dropData: DropData = { carId: car.id, carName: car.name }
  const { setNodeRef, isOver } = useDroppable({ id: carDropId(car.id), data: dropData })

  // Highlight vehicles that can accept what is being dragged (a line can't be dropped on its own vehicle).
  const { active } = useDndContext()
  const dragging = active?.data.current as DragData | undefined
  const canAccept = dragging !== undefined && !(dragging.type === 'product' && dragging.carId === car.id)
  const isTarget = canAccept && isOver

  // Drop feedback: a ring in the pipe colour ripples out from the panel that received the part.
  useEffect(() => {
    if (!dropFlash || !sectionRef.current || prefersReducedMotion()) return
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    sectionRef.current.animate(
      [
        { outline: `2px solid ${accent}`, outlineOffset: '0px' },
        { outline: '2px solid transparent', outlineOffset: '14px' },
      ],
      { duration: 650, easing: EASE_OUT },
    )
  }, [dropFlash])

  const handleAdd = (input: ProductInput) => {
    const outcome = addProduct(car.id, input)
    if (outcome.merged) setFormFlash({ productId: outcome.productId, nonce: Date.now() })
    return outcome
  }

  const flash = [dropFlash, formFlash].filter(Boolean).sort((a, b) => b!.nonce - a!.nonce)[0] ?? null
  const bodyId = `vehicle-body-${car.id}`
  const lineCount = car.products.length
  const unitCount = getCarUnitCount(car)

  return (
    <article
      ref={(node) => {
        sectionRef.current = node
        setNodeRef(node)
      }}
      aria-label={car.name}
      className={`panel overflow-hidden transition-[border-color,box-shadow,scale] duration-200 ease-[var(--ease-out)] ${
        isTarget
          ? 'scale-[1.01] !border-accent ring-4 ring-accent-soft'
          : canAccept
            ? 'border-dashed !border-line-strong'
            : ''
      }`}
    >
      <h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onToggle(car.id)}
          className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:gap-x-4 sm:px-5"
        >
          <span
            className={`grid h-10 w-10 place-items-center rounded-full transition-colors duration-200 ${
              isTarget ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent-strong'
            }`}
          >
            <CarIcon width={20} height={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-[1.0625rem] font-semibold leading-snug text-fg">{car.name}</span>
            <span className="figures block text-xs text-fg-muted">
              {isTarget ? (
                <span className="font-semibold text-accent-strong">Release to add to this vehicle</span>
              ) : (
                <>
                  {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {unitCount} {unitCount === 1 ? 'unit' : 'units'}
                </>
              )}
            </span>
          </span>
          <span className="text-right">
            <span className="label block">Total, EGP</span>
            <AnimatedNumber value={getCarTotal(car)} format={formatAmount} className="block text-lg font-semibold text-fg" />
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-line text-fg-muted transition-colors group-hover:border-accent group-hover:bg-accent-soft group-hover:text-accent-strong">
            <ChevronDownIcon
              width={16}
              height={16}
              className={`transition-transform duration-300 ease-[var(--ease-out)] ${expanded ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
      </h2>

      {/*
        Unfold: the body's grid row animates 0fr ↔ 1fr, so the section grows to the table's real height
        without measuring, and the content drifts down into place. Collapsing is quicker than expanding.
        `inert` keeps folded controls out of the tab order.
      */}
      <div
        id={bodyId}
        inert={!expanded}
        className={`grid transition-[grid-template-rows] motion-reduce:transition-none ${
          expanded ? 'grid-rows-[1fr] duration-[380ms] ease-[var(--ease-out)]' : 'grid-rows-[0fr] duration-[220ms] ease-[var(--ease-in)]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`flex flex-col gap-4 border-t border-line px-3 pb-4 pt-2 transition-[translate,opacity] motion-reduce:transition-opacity sm:px-5 sm:pb-5 ${
              expanded
                ? 'translate-y-0 opacity-100 delay-[40ms] duration-[380ms] ease-[var(--ease-out)]'
                : '-translate-y-3 opacity-0 duration-[180ms] ease-[var(--ease-in)]'
            }`}
          >
            <ProductTable
              carId={car.id}
              carName={car.name}
              products={car.products}
              flash={flash}
              onUpdate={(productId, patch) => updateProduct(car.id, productId, patch)}
              onDelete={(productId) => deleteProduct(car.id, productId)}
            />
            <AddProductForm carName={car.name} onAdd={handleAdd} />
          </div>
        </div>
      </div>
    </article>
  )
}

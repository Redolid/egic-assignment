import { useEffect, useRef } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { CarIcon, ChevronDownIcon } from '../../../components/ui/Icons'
import { EASE_OUT, prefersReducedMotion } from '../../../lib/motion'
import { carDropId } from '../dnd'
import type { DragData, DropData } from '../dnd'
import { formatCurrency } from '../lib/format'
import { getCarTotal, getCarUnitCount } from '../lib/pricing'
import { useCars } from '../state/CarsContext'
import type { Car } from '../types'
import { AddProductForm } from './AddProductForm'
import { ProductTable } from './ProductTable'

interface CarCardProps {
  car: Car
  expanded: boolean
  onToggle: (carId: string) => void
  /** Changes every time something is dropped on this car, to play the "caught it" pulse. */
  dropPulse: number
}

/** A car with its total in the header; unfolds to show and edit its products. Also a drop target. */
export function CarCard({ car, expanded, onToggle, dropPulse }: CarCardProps) {
  const { addProduct, updateProduct, deleteProduct } = useCars()
  const articleRef = useRef<HTMLElement | null>(null)

  const dropData: DropData = { carId: car.id, carName: car.name }
  const { setNodeRef, isOver } = useDroppable({ id: carDropId(car.id), data: dropData })

  // Highlight cars that can accept what is being dragged (a product can't be dropped on its own car).
  const { active } = useDndContext()
  const dragging = active?.data.current as DragData | undefined
  const canAccept = dragging !== undefined && !(dragging.type === 'product' && dragging.carId === car.id)
  const isTarget = canAccept && isOver

  // Drop feedback: an outline ripples out from the card that received the product.
  useEffect(() => {
    if (!dropPulse || !articleRef.current || prefersReducedMotion()) return
    articleRef.current.animate(
      [
        { outline: '2px solid rgb(47 124 246 / 0.7)', outlineOffset: '0px' },
        { outline: '2px solid rgb(47 124 246 / 0)', outlineOffset: '14px' },
      ],
      { duration: 650, easing: EASE_OUT },
    )
  }, [dropPulse])

  const bodyId = `car-body-${car.id}`
  const productCount = car.products.length
  const unitCount = getCarUnitCount(car)

  return (
    <article
      ref={(node) => {
        articleRef.current = node
        setNodeRef(node)
      }}
      aria-label={car.name}
      className={`overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow,scale] duration-200 ease-[var(--ease-out)] ${
        isTarget
          ? 'scale-[1.01] border-brand-500 shadow-[0_12px_28px_-14px_rgb(31_99_216/0.45)] ring-4 ring-brand-100'
          : canAccept
            ? 'border-dashed border-brand-500/60 shadow-xs'
            : 'border-slate-200 shadow-xs'
      }`}
    >
      <h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onToggle(car.id)}
          className="group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 sm:px-5"
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${
              isTarget ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
            }`}
          >
            <CarIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold break-words text-slate-900">{car.name}</span>
            <span className="block text-xs text-slate-500">
              {isTarget ? (
                <span className="font-medium text-brand-700">Release to add to this car</span>
              ) : (
                <>
                  {productCount} {productCount === 1 ? 'product' : 'products'} · {unitCount}{' '}
                  {unitCount === 1 ? 'unit' : 'units'}
                </>
              )}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-xs text-slate-500">Total</span>
            <AnimatedNumber value={getCarTotal(car)} format={formatCurrency} className="block font-bold text-slate-900" />
          </span>
          <ChevronDownIcon
            className={`shrink-0 text-slate-400 transition-transform duration-300 ease-[var(--ease-out)] group-hover:text-slate-600 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </h2>

      {/*
        Unfold: the body's grid row animates 0fr ↔ 1fr, so the card grows to the table's real height
        without measuring. The content itself drifts down into place as it's revealed. Collapsing is
        quicker than expanding. `inert` keeps folded controls out of the tab order.
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
            className={`flex flex-col gap-4 border-t border-slate-100 px-2 py-4 transition-[translate,opacity] motion-reduce:transition-opacity sm:px-4 ${
              expanded
                ? 'translate-y-0 opacity-100 delay-[40ms] duration-[380ms] ease-[var(--ease-out)]'
                : '-translate-y-3 opacity-0 duration-[180ms] ease-[var(--ease-in)]'
            }`}
          >
            <ProductTable
              carId={car.id}
              carName={car.name}
              products={car.products}
              onUpdate={(productId, patch) => updateProduct(car.id, productId, patch)}
              onDelete={(productId) => deleteProduct(car.id, productId)}
            />
            <AddProductForm carName={car.name} onAdd={(input) => addProduct(car.id, input)} />
          </div>
        </div>
      </div>
    </article>
  )
}

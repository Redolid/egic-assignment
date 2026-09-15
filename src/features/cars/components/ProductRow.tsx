import { useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { Button } from '../../../components/ui/Button'
import { GripIcon, TrashIcon } from '../../../components/ui/Icons'
import { EASE_IN, prefersReducedMotion } from '../../../lib/motion'
import { productDragId } from '../dnd'
import type { DragData } from '../dnd'
import { formatAmount } from '../lib/format'
import { getSubtotal } from '../lib/pricing'
import { validatePrice, validateQuantity } from '../lib/validation'
import type { Product, ProductInput } from '../types'
import { EditableNumberCell } from './EditableNumberCell'

interface ProductRowProps {
  carId: string
  product: Product
  lineNumber: number
  /** Just added or moved here: plays the arrival wash once. */
  isNew: boolean
  /** Changes when this row absorbs a merged add or move, to wash it again. */
  flashNonce: number
  onUpdate: (productId: string, patch: Partial<ProductInput>) => void
  onDelete: (productId: string) => void
}

/** Mobile label shown next to a value when the table collapses into stacked rows. */
const MobileLabel = ({ children }: { children: string }) => (
  <span className="spec-label pt-2 sm:hidden">{children}</span>
)

export function ProductRow({ carId, product, lineNumber, isNew, flashNonce, onUpdate, onDelete }: ProductRowProps) {
  const rowRef = useRef<HTMLTableRowElement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  // Captured at mount: later re-renders (toast, drag state) must not cut the arrival wash short.
  const [playArrival] = useState(isNew)
  const dragData: DragData = { type: 'product', carId, product }
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: productDragId(product.id),
    data: dragData,
    disabled: isDeleting,
  })

  // A merge landed on this row: wash it so the quantity change is traced to the right line.
  useEffect(() => {
    if (!flashNonce || !rowRef.current) return
    rowRef.current.animate([{ backgroundColor: '#dae5f7' }, { backgroundColor: 'rgba(218,229,247,0)' }], {
      duration: prefersReducedMotion() ? 600 : 1400,
      easing: 'ease-out',
    })
  }, [flashNonce])

  // The row slides out before it is removed; rows below then close the gap (FLIP in ProductTable).
  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    const row = rowRef.current
    if (row && !prefersReducedMotion()) {
      await row
        .animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(24px)' }], {
          duration: 170,
          easing: EASE_IN,
          fill: 'forwards',
        })
        .finished.catch(() => undefined)
    }
    onDelete(product.id)
  }

  return (
    <tr
      ref={(node) => {
        rowRef.current = node
        setNodeRef(node)
      }}
      data-flip-id={product.id}
      className={`relative block border-b border-ink-200 px-1 py-3 transition-opacity duration-200 sm:table-row sm:p-0 ${
        isDragging ? 'opacity-35' : ''
      } ${playArrival ? 'animate-row-arrive' : ''}`}
    >
      <td className="block pr-10 sm:table-cell sm:py-1.5 sm:pl-0 sm:pr-3">
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Drag ${product.name} to another vehicle`}
            className="grid h-8 w-5 shrink-0 cursor-grab touch-manipulation select-none place-items-center text-ink-300 transition-colors [-webkit-touch-callout:none] hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-cobalt-600 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripIcon width={14} height={14} />
          </button>
          <span className="figures w-5 text-right text-xs font-medium text-ink-500">{lineNumber}</span>
          <span className="font-medium break-words text-ink-950">{product.name}</span>
        </div>
      </td>

      <td className="flex items-start justify-between gap-3 pt-2 sm:table-cell sm:px-2 sm:py-1.5 sm:align-top">
        <MobileLabel>Qty</MobileLabel>
        <EditableNumberCell
          value={product.quantity}
          label={`Quantity of ${product.name}`}
          inputMode="numeric"
          validate={validateQuantity}
          onCommit={(quantity) => onUpdate(product.id, { quantity })}
        />
      </td>

      <td className="flex items-start justify-between gap-3 pt-2 sm:table-cell sm:px-2 sm:py-1.5 sm:align-top">
        <MobileLabel>Unit price, EGP</MobileLabel>
        <EditableNumberCell
          value={product.unitPrice}
          label={`Unit price of ${product.name}`}
          inputMode="decimal"
          formatValue={(price) => price.toFixed(2)}
          validate={validatePrice}
          onCommit={(unitPrice) => onUpdate(product.id, { unitPrice })}
        />
      </td>

      <td
        data-col="subtotal"
        className="flex items-center justify-between gap-3 pt-2 transition-[box-shadow,color] duration-200 sm:table-cell sm:py-1.5 sm:pl-2 sm:pr-3 sm:text-right"
      >
        <MobileLabel>Subtotal, EGP</MobileLabel>
        <AnimatedNumber value={getSubtotal(product)} format={formatAmount} className="font-semibold sm:leading-8" />
      </td>

      <td className="absolute right-0 top-2 sm:static sm:table-cell sm:py-1.5 sm:text-right">
        <Button
          variant="danger"
          size="icon"
          aria-label={`Delete ${product.name}`}
          title="Delete line"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <TrashIcon width={16} height={16} />
        </Button>
      </td>
    </tr>
  )
}

import { useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { Button } from '../../../components/ui/Button'
import { GripIcon, TrashIcon } from '../../../components/ui/Icons'
import { EASE_IN, prefersReducedMotion } from '../../../lib/motion'
import { productDragId } from '../dnd'
import type { DragData } from '../dnd'
import { formatCurrency } from '../lib/format'
import { getSubtotal } from '../lib/pricing'
import { validatePrice, validateQuantity } from '../lib/validation'
import type { Product, ProductInput } from '../types'
import { EditableNumberCell } from './EditableNumberCell'

interface ProductRowProps {
  carId: string
  product: Product
  /** Just added or moved here: plays the arrival wash once. */
  isNew: boolean
  onUpdate: (productId: string, patch: Partial<ProductInput>) => void
  onDelete: (productId: string) => void
}

/** Mobile label shown next to a value when the table collapses into cards. */
const MobileLabel = ({ children }: { children: string }) => (
  <span className="pt-2 text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">{children}</span>
)

export function ProductRow({ carId, product, isNew, onUpdate, onDelete }: ProductRowProps) {
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

  // The row slides out toward the delete button before it is removed; rows below then close the gap (FLIP in ProductTable).
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
      className={`relative block border-b border-slate-100 px-3 py-3 transition-opacity duration-200 last:border-b-0 sm:table-row sm:px-0 sm:py-0 ${
        isDragging ? 'opacity-40' : ''
      } ${playArrival ? 'animate-row-arrive' : ''}`}
    >
      <td className="block pr-10 sm:table-cell sm:py-2 sm:pl-2 sm:pr-3">
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Drag ${product.name} to another car`}
            className="grid h-8 w-6 shrink-0 cursor-grab touch-manipulation select-none place-items-center rounded text-slate-300 transition-colors [-webkit-touch-callout:none] hover:bg-slate-100 hover:text-slate-500 focus-visible:outline-2 focus-visible:outline-brand-500 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripIcon width={16} height={16} />
          </button>
          <span className="font-medium break-words text-slate-800">{product.name}</span>
        </div>
      </td>

      <td className="flex items-start justify-between gap-3 pt-2 sm:table-cell sm:px-2 sm:py-2 sm:align-top">
        <MobileLabel>Quantity</MobileLabel>
        <EditableNumberCell
          value={product.quantity}
          label={`Quantity of ${product.name}`}
          inputMode="numeric"
          validate={validateQuantity}
          onCommit={(quantity) => onUpdate(product.id, { quantity })}
        />
      </td>

      <td className="flex items-start justify-between gap-3 pt-2 sm:table-cell sm:px-2 sm:py-2 sm:align-top">
        <MobileLabel>Unit price</MobileLabel>
        <EditableNumberCell
          value={product.unitPrice}
          label={`Unit price of ${product.name}`}
          inputMode="decimal"
          validate={validatePrice}
          onCommit={(unitPrice) => onUpdate(product.id, { unitPrice })}
        />
      </td>

      <td className="flex items-center justify-between gap-3 pt-2 sm:table-cell sm:px-2 sm:py-2 sm:text-right">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">Subtotal</span>
        <AnimatedNumber
          value={getSubtotal(product)}
          format={formatCurrency}
          className="font-semibold text-slate-900 sm:leading-9"
        />
      </td>

      <td className="absolute right-2 top-2 sm:static sm:table-cell sm:py-2 sm:pr-2 sm:text-right">
        <Button
          variant="danger"
          size="icon"
          aria-label={`Delete ${product.name}`}
          title="Delete product"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <TrashIcon width={18} height={18} />
        </Button>
      </td>
    </tr>
  )
}

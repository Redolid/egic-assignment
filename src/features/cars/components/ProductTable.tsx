import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { PackageIcon } from '../../../components/ui/Icons'
import { EASE_OUT, prefersReducedMotion } from '../../../lib/motion'
import { formatCurrency } from '../lib/format'
import { getCarTotal } from '../lib/pricing'
import type { Product, ProductInput } from '../types'
import { ProductRow } from './ProductRow'

interface ProductTableProps {
  carId: string
  carName: string
  products: Product[]
  onUpdate: (productId: string, patch: Partial<ProductInput>) => void
  onDelete: (productId: string) => void
}

/**
 * Keeps rows spatially continuous when the list changes: rows that shift because a product was
 * removed glide to their new place (FLIP), and ids that weren't here on the previous render are
 * reported as new so they can play their arrival wash.
 */
function useRowMotion(products: Product[]) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const offsets = useRef(new Map<string, number>())
  const idsKey = products.map((product) => product.id).join('|')

  // Derived during render when the id list changes (no effect round-trip), so arriving rows mount already marked.
  const [seenKey, setSeenKey] = useState(idsKey)
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set())
  if (idsKey !== seenKey) {
    const seen = new Set(seenKey.split('|'))
    setNewIds(new Set(products.map((product) => product.id).filter((id) => !seen.has(id))))
    setSeenKey(idsKey)
  }

  useLayoutEffect(() => {
    const rows = tbodyRef.current?.querySelectorAll<HTMLElement>('[data-flip-id]') ?? []
    const next = new Map<string, number>()
    const animate = !prefersReducedMotion()

    rows.forEach((row) => {
      const id = row.dataset.flipId!
      const top = row.offsetTop // relative to the table: unaffected by page scroll
      const previous = offsets.current.get(id)
      if (animate && previous !== undefined && previous !== top) {
        row.animate([{ transform: `translateY(${previous - top}px)` }, { transform: 'translateY(0)' }], {
          duration: 260,
          easing: EASE_OUT,
        })
      }
      next.set(id, top)
    })
    offsets.current = next
  }, [idsKey])

  return { tbodyRef, newIds }
}

/**
 * Product Name | Quantity | Unit Price | Subtotal, with the car total in the footer.
 * A real <table> on ≥640px; below that each row is restyled as a stacked card.
 */
export function ProductTable({ carId, carName, products, onUpdate, onDelete }: ProductTableProps) {
  const { tbodyRef, newIds } = useRowMotion(products)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center">
        <PackageIcon width={22} height={22} className="text-slate-300" />
        <p className="text-sm font-medium text-slate-600">No products on this car yet</p>
        <p className="text-xs text-slate-500">Drag one from the catalog onto this card, or add it with the form below.</p>
      </div>
    )
  }

  return (
    <table className="block w-full text-sm sm:table sm:table-fixed">
      <caption className="sr-only">Products of {carName}</caption>
      <thead className="hidden border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-header-group">
        <tr>
          <th scope="col" className="py-2 pl-10 pr-3 text-left font-medium">
            Product Name
          </th>
          <th scope="col" className="w-28 px-2 py-2 text-right font-medium">
            Quantity
          </th>
          <th scope="col" className="w-36 px-2 py-2 text-right font-medium">
            Unit Price
          </th>
          <th scope="col" className="w-36 px-2 py-2 text-right font-medium">
            Subtotal
          </th>
          <th scope="col" className="w-14 py-2 pr-2">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody ref={tbodyRef} className="block sm:table-row-group">
        {products.map((product) => (
          <ProductRow
            key={product.id}
            carId={carId}
            product={product}
            isNew={newIds.has(product.id)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </tbody>
      <tfoot className="block border-t-2 border-slate-200 sm:table-footer-group">
        <tr className="flex items-center justify-between px-3 py-3 sm:table-row sm:p-0">
          <th scope="row" colSpan={3} className="text-left font-semibold text-slate-700 sm:py-3 sm:pl-10">
            Total
          </th>
          <td className="text-right text-base font-bold text-slate-900 sm:px-2 sm:py-3">
            <AnimatedNumber value={getCarTotal({ products })} format={formatCurrency} />
          </td>
          <td className="hidden sm:table-cell" />
        </tr>
      </tfoot>
    </table>
  )
}

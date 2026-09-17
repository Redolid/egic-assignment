import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber'
import { PackageIcon } from '../../../components/ui/Icons'
import { EASE_OUT, prefersReducedMotion } from '../../../lib/motion'
import { formatAmount } from '../lib/format'
import { getCarTotal } from '../lib/pricing'
import type { Product, ProductInput } from '../types'
import { ProductRow } from './ProductRow'

export interface RowFlash {
  productId: string
  nonce: number
}

interface ProductTableProps {
  carId: string
  carName: string
  products: Product[]
  flash: RowFlash | null
  onUpdate: (productId: string, patch: Partial<ProductInput>) => void
  onDelete: (productId: string) => void
}

/**
 * Keeps rows spatially continuous when the list changes: rows that shift because a product was
 * removed glide to their new place (FLIP), and ids that weren't here before are reported as new so
 * they can play their arrival wash.
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
 * Line | Qty | Unit price | Subtotal, totalled in the footer. Inspecting the total draws a
 * dimension bracket down the subtotal column: the figures it sums.
 * A real <table> on ≥640px; below that each row is restyled as a stacked entry.
 */
export function ProductTable({ carId, carName, products, flash, onUpdate, onDelete }: ProductTableProps) {
  const { tbodyRef, newIds } = useRowMotion(products)
  const [summing, setSumming] = useState(false)

  if (products.length === 0) {
    return (
      <div className="mt-2 flex items-center gap-4 rounded-[var(--radius-fitting)] border border-dashed border-line-strong bg-surface-2/50 px-4 py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <PackageIcon width={20} height={20} />
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">No lines on this vehicle yet</p>
          <p className="mt-0.5 text-[0.8125rem] text-fg-muted">Drag a part from the parts list onto this section, or add a line below.</p>
        </div>
      </div>
    )
  }

  return (
    <table data-summing={summing} className="block w-full text-sm sm:table sm:table-fixed">
      <caption className="sr-only">Lines of {carName}</caption>
      <thead className="hidden border-b border-line sm:table-header-group">
        <tr>
          <th scope="col" className="label py-2 pl-12 pr-3 text-left">
            Line
          </th>
          <th scope="col" className="label w-28 px-2 py-2 text-right">
            Qty
          </th>
          <th scope="col" className="label w-36 px-2 py-2 text-right">
            Unit price, EGP
          </th>
          <th scope="col" className="label w-36 py-2 pl-2 pr-3 text-right">
            Subtotal, EGP
          </th>
          <th scope="col" className="w-11 py-2">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody ref={tbodyRef} className="block sm:table-row-group">
        {products.map((product, index) => (
          <ProductRow
            key={product.id}
            carId={carId}
            product={product}
            lineNumber={index + 1}
            isNew={newIds.has(product.id)}
            flashNonce={flash?.productId === product.id ? flash.nonce : 0}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </tbody>
      <tfoot className="block border-t border-line-strong sm:table-footer-group">
        <tr className="flex items-center justify-between py-3 sm:table-row sm:p-0">
          <th scope="row" colSpan={3} className="text-left sm:py-3 sm:pl-12">
            <span className="font-semibold text-fg">Total</span>
            <span className="ml-2 text-xs text-fg-muted">
              Σ of {products.length} {products.length === 1 ? 'line' : 'lines'}
            </span>
          </th>
          <td
            tabIndex={0}
            onMouseEnter={() => setSumming(true)}
            onMouseLeave={() => setSumming(false)}
            onFocus={() => setSumming(true)}
            onBlur={() => setSumming(false)}
            title="Sum of the subtotal column"
            className="rounded-[var(--radius-fitting)] text-right text-lg font-semibold text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent sm:py-3 sm:pl-2 sm:pr-3"
          >
            <AnimatedNumber value={getCarTotal({ products })} format={formatAmount} />
          </td>
          <td className="hidden sm:table-cell" />
        </tr>
      </tfoot>
    </table>
  )
}

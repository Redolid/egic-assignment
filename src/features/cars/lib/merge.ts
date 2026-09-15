import type { Product } from '../types'

/**
 * Duplicate rule: a product is "the same" as an existing row when the name matches
 * (trimmed, whitespace-collapsed, case-insensitive) AND the unit price matches to the piaster.
 * Same product → quantities are combined into the existing row.
 * Same name but a different price → kept as a separate row, so no price is silently discarded.
 */

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
const toCents = (price: number) => Math.round(price * 100)

export function isSameProduct(a: Pick<Product, 'name' | 'unitPrice'>, b: Pick<Product, 'name' | 'unitPrice'>) {
  return normalizeName(a.name) === normalizeName(b.name) && toCents(a.unitPrice) === toCents(b.unitPrice)
}

/** The existing row that `candidate` should merge into, if any. */
export function findMergeTarget(
  products: Product[],
  candidate: Pick<Product, 'name' | 'unitPrice'>,
  excludeId?: string,
): Product | undefined {
  return products.find((product) => product.id !== excludeId && isSameProduct(product, candidate))
}

/** Adds `incoming` to `products`: merges its quantity into a matching row, or appends it. */
export function addOrMerge(products: Product[], incoming: Product): Product[] {
  const target = findMergeTarget(products, incoming, incoming.id)
  if (!target) return [...products, incoming]
  return products.map((product) =>
    product.id === target.id ? { ...product, quantity: product.quantity + incoming.quantity } : product,
  )
}

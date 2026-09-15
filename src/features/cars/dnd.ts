import { pointerWithin, rectIntersection } from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import type { Product, ProductTemplate } from './types'

/** Payload attached to anything draggable on the cars page. */
export type DragData =
  | { type: 'catalog'; template: ProductTemplate }
  | { type: 'product'; carId: string; product: Product }

/** Payload attached to every drop target (a car card). */
export interface DropData {
  carId: string
  carName: string
}

export const catalogDragId = (templateId: string) => `catalog:${templateId}`
export const productDragId = (productId: string) => `product:${productId}`
export const carDropId = (carId: string) => `car:${carId}`

/**
 * Use the pointer position when there is one (mouse / touch) so the card under
 * the finger wins; fall back to rectangle overlap for keyboard dragging.
 */
export const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length > 0 ? hits : rectIntersection(args)
}

export interface Product {
  id: string
  name: string
  /** Whole units, always > 0. */
  quantity: number
  /** Price of a single unit in EGP, always > 0 with at most 2 decimals. */
  unitPrice: number
}

export interface Car {
  id: string
  /** e.g. "Toyota Corolla 2023" */
  name: string
  products: Product[]
}

/** A reusable product definition shown in the drag & drop catalog. */
export interface ProductTemplate {
  id: string
  name: string
  unitPrice: number
}

export type ProductInput = Omit<Product, 'id'>

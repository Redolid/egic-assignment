import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { seedCars } from '../data/seedCars'
import { createId } from '../lib/id'
import { findMergeTarget } from '../lib/merge'
import type { Car, Product, ProductInput } from '../types'
import { carsReducer } from './carsReducer'

const STORAGE_KEY = 'egic.cars.v1'

/** What an add or move did, so the UI can say "added" vs "added 1 more" and highlight the right row. */
export interface ChangeOutcome {
  /** The row that now holds the product (the existing row when merged). */
  productId: string
  merged: boolean
  /** Quantity of that row after the change. */
  quantity: number
}

interface CarsContextValue {
  cars: Car[]
  addProduct: (carId: string, input: ProductInput) => ChangeOutcome
  updateProduct: (carId: string, productId: string, patch: Partial<ProductInput>) => void
  deleteProduct: (carId: string, productId: string) => void
  moveProduct: (fromCarId: string, toCarId: string, productId: string) => ChangeOutcome | null
  resetCars: () => void
}

const CarsContext = createContext<CarsContextValue | null>(null)

function loadCars(): Car[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return seedCars
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as Car[]) : seedCars
  } catch {
    return seedCars
  }
}

/** Predicts the reducer's merge decision (same pure rule), without waiting for a re-render. */
function outcomeFor(car: Car | undefined, product: Product): ChangeOutcome {
  const target = car ? findMergeTarget(car.products, product, product.id) : undefined
  return target
    ? { productId: target.id, merged: true, quantity: target.quantity + product.quantity }
    : { productId: product.id, merged: false, quantity: product.quantity }
}

export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, dispatch] = useReducer(carsReducer, undefined, loadCars)
  // Latest state for computing outcomes inside stable callbacks.
  const carsRef = useRef(cars)

  useEffect(() => {
    carsRef.current = cars
    // Persist so the demo survives a page reload.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars))
    } catch {
      // Storage may be unavailable (private mode / quota) — the app still works in memory.
    }
  }, [cars])

  const addProduct = useCallback((carId: string, input: ProductInput) => {
    const product: Product = { id: createId(), ...input }
    const outcome = outcomeFor(carsRef.current.find((car) => car.id === carId), product)
    dispatch({ type: 'ADD_PRODUCT', carId, product })
    return outcome
  }, [])

  const updateProduct = useCallback(
    (carId: string, productId: string, patch: Partial<ProductInput>) =>
      dispatch({ type: 'UPDATE_PRODUCT', carId, productId, patch }),
    [],
  )

  const deleteProduct = useCallback(
    (carId: string, productId: string) => dispatch({ type: 'DELETE_PRODUCT', carId, productId }),
    [],
  )

  const moveProduct = useCallback((fromCarId: string, toCarId: string, productId: string) => {
    const current = carsRef.current
    const product = current.find((car) => car.id === fromCarId)?.products.find((p) => p.id === productId)
    if (!product || fromCarId === toCarId) return null
    const outcome = outcomeFor(current.find((car) => car.id === toCarId), product)
    dispatch({ type: 'MOVE_PRODUCT', fromCarId, toCarId, productId })
    return outcome
  }, [])

  const resetCars = useCallback(() => dispatch({ type: 'RESET', cars: seedCars }), [])

  const value = useMemo(
    () => ({ cars, addProduct, updateProduct, deleteProduct, moveProduct, resetCars }),
    [cars, addProduct, updateProduct, deleteProduct, moveProduct, resetCars],
  )

  return <CarsContext.Provider value={value}>{children}</CarsContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook lives next to its provider
export function useCars(): CarsContextValue {
  const context = useContext(CarsContext)
  if (!context) throw new Error('useCars must be used inside <CarsProvider>')
  return context
}

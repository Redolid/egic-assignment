import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { seedCars } from '../data/seedCars'
import { createId } from '../lib/id'
import type { Car, Product, ProductInput } from '../types'
import { carsReducer } from './carsReducer'

const STORAGE_KEY = 'egic.cars.v1'

interface CarsContextValue {
  cars: Car[]
  addProduct: (carId: string, input: ProductInput) => void
  updateProduct: (carId: string, productId: string, patch: Partial<ProductInput>) => void
  deleteProduct: (carId: string, productId: string) => void
  moveProduct: (fromCarId: string, toCarId: string, productId: string) => void
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

export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, dispatch] = useReducer(carsReducer, undefined, loadCars)

  // Persist so the demo survives a page reload.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars))
    } catch {
      // Storage may be unavailable (private mode / quota) — the app still works in memory.
    }
  }, [cars])

  const addProduct = useCallback((carId: string, input: ProductInput) => {
    const product: Product = { id: createId(), ...input }
    dispatch({ type: 'ADD_PRODUCT', carId, product })
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

  const moveProduct = useCallback(
    (fromCarId: string, toCarId: string, productId: string) =>
      dispatch({ type: 'MOVE_PRODUCT', fromCarId, toCarId, productId }),
    [],
  )

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

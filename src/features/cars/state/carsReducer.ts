import { addOrMerge } from '../lib/merge'
import type { Car, Product } from '../types'

export type CarsAction =
  | { type: 'ADD_PRODUCT'; carId: string; product: Product }
  | {
      type: 'UPDATE_PRODUCT'
      carId: string
      productId: string
      patch: Partial<Omit<Product, 'id'>>
    }
  | { type: 'DELETE_PRODUCT'; carId: string; productId: string }
  | { type: 'MOVE_PRODUCT'; fromCarId: string; toCarId: string; productId: string }
  | { type: 'RESET'; cars: Car[] }

/** Applies `update` to the car with `carId`, leaving every other car untouched (same reference). */
function updateCar(cars: Car[], carId: string, update: (car: Car) => Car): Car[] {
  return cars.map((car) => (car.id === carId ? update(car) : car))
}

/**
 * Pure reducer for the cars list. Totals are intentionally NOT stored in state:
 * they are derived from products on render (see lib/pricing.ts), so they can
 * never get out of sync with quantities and prices.
 */
export function carsReducer(state: Car[], action: CarsAction): Car[] {
  switch (action.type) {
    case 'ADD_PRODUCT':
      // The same product (name + price) already on this car gets its quantity increased instead of a new row.
      return updateCar(state, action.carId, (car) => ({
        ...car,
        products: addOrMerge(car.products, action.product),
      }))

    case 'UPDATE_PRODUCT':
      return updateCar(state, action.carId, (car) => ({
        ...car,
        products: car.products.map((product) =>
          product.id === action.productId ? { ...product, ...action.patch } : product,
        ),
      }))

    case 'DELETE_PRODUCT':
      return updateCar(state, action.carId, (car) => ({
        ...car,
        products: car.products.filter((product) => product.id !== action.productId),
      }))

    case 'MOVE_PRODUCT': {
      if (action.fromCarId === action.toCarId) return state
      const source = state.find((car) => car.id === action.fromCarId)
      const product = source?.products.find((p) => p.id === action.productId)
      if (!product || !state.some((car) => car.id === action.toCarId)) return state

      return state.map((car) => {
        if (car.id === action.fromCarId) {
          return { ...car, products: car.products.filter((p) => p.id !== action.productId) }
        }
        if (car.id === action.toCarId) {
          return { ...car, products: addOrMerge(car.products, product) }
        }
        return car
      })
    }

    case 'RESET':
      return action.cars

    default:
      return state
  }
}

import type { Car, Product } from '../types'

/**
 * Money is calculated in integer piasters (1 EGP = 100 piasters) so that
 * binary floating point never leaks into totals (e.g. 0.1 * 3 !== 0.3).
 */
const toCents = (amount: number): number => Math.round(amount * 100)
const fromCents = (cents: number): number => cents / 100

const subtotalInCents = (product: Pick<Product, 'quantity' | 'unitPrice'>): number =>
  toCents(product.unitPrice) * product.quantity

/** Subtotal = quantity × unitPrice */
export function getSubtotal(product: Pick<Product, 'quantity' | 'unitPrice'>): number {
  return fromCents(subtotalInCents(product))
}

const carTotalInCents = (car: Pick<Car, 'products'>): number =>
  car.products.reduce((sum, product) => sum + subtotalInCents(product), 0)

/** Total = sum of every product subtotal of the car. */
export function getCarTotal(car: Pick<Car, 'products'>): number {
  return fromCents(carTotalInCents(car))
}

/** Sum of all car totals (page summary). */
export function getFleetTotal(cars: Pick<Car, 'products'>[]): number {
  return fromCents(cars.reduce((sum, car) => sum + carTotalInCents(car), 0))
}

/** Total number of units in a car (used for the card summary). */
export function getCarUnitCount(car: Pick<Car, 'products'>): number {
  return car.products.reduce((sum, product) => sum + product.quantity, 0)
}

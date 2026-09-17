import type { Car } from '../types'
import { getCarTotal, getCarUnitCount, getFleetTotal, getSubtotal } from './pricing'

export interface SummaryLine {
  id: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface SummaryVehicle {
  id: string
  name: string
  lines: SummaryLine[]
  units: number
  total: number
}

export interface PriceSummary {
  vehicles: SummaryVehicle[]
  lineCount: number
  unitCount: number
  grandTotal: number
}

/** Everything the printed price summary shows, computed with the same exact-to-the-piaster pricing as the page. */
export function buildPriceSummary(cars: Car[]): PriceSummary {
  const vehicles = cars.map((car) => ({
    id: car.id,
    name: car.name,
    lines: car.products.map((product) => ({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      subtotal: getSubtotal(product),
    })),
    units: getCarUnitCount(car),
    total: getCarTotal(car),
  }))

  return {
    vehicles,
    lineCount: vehicles.reduce((sum, vehicle) => sum + vehicle.lines.length, 0),
    unitCount: vehicles.reduce((sum, vehicle) => sum + vehicle.units, 0),
    grandTotal: getFleetTotal(cars),
  }
}

import { describe, expect, it } from 'vitest'
import type { Car } from '../types'
import { buildPriceSummary } from './summary'

const cars: Car[] = [
  {
    id: 'a',
    name: 'Toyota Corolla 2023',
    products: [
      { id: 'p1', name: 'Oil Filter', quantity: 3, unitPrice: 19.99 },
      { id: 'p2', name: 'Spark Plug', quantity: 4, unitPrice: 0.1 },
    ],
  },
  { id: 'b', name: 'Empty Van', products: [] },
]

describe('buildPriceSummary', () => {
  it('lists every line with its exact subtotal', () => {
    const [corolla] = buildPriceSummary(cars).vehicles
    expect(corolla.lines).toEqual([
      { id: 'p1', name: 'Oil Filter', quantity: 3, unitPrice: 19.99, subtotal: 59.97 },
      { id: 'p2', name: 'Spark Plug', quantity: 4, unitPrice: 0.1, subtotal: 0.4 },
    ])
  })

  it('totals each vehicle and the whole list', () => {
    const summary = buildPriceSummary(cars)
    expect(summary.vehicles.map((vehicle) => [vehicle.total, vehicle.units])).toEqual([
      [60.37, 7],
      [0, 0],
    ])
    expect(summary.grandTotal).toBe(60.37)
    expect(summary.lineCount).toBe(2)
    expect(summary.unitCount).toBe(7)
  })

  it('keeps vehicles without lines, in order', () => {
    expect(buildPriceSummary(cars).vehicles.map((vehicle) => vehicle.name)).toEqual(['Toyota Corolla 2023', 'Empty Van'])
  })

  it('handles an empty list', () => {
    expect(buildPriceSummary([])).toEqual({ vehicles: [], lineCount: 0, unitCount: 0, grandTotal: 0 })
  })
})

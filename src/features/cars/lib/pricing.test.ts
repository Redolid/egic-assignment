import { describe, expect, it } from 'vitest'
import { getCarTotal, getCarUnitCount, getFleetTotal, getSubtotal } from './pricing'

describe('getSubtotal', () => {
  it('multiplies quantity by unit price', () => {
    expect(getSubtotal({ quantity: 2, unitPrice: 1250 })).toBe(2500)
  })

  it('handles decimal prices without floating point drift', () => {
    expect(getSubtotal({ quantity: 3, unitPrice: 19.99 })).toBe(59.97)
    expect(getSubtotal({ quantity: 3, unitPrice: 0.1 })).toBe(0.3) // 0.1 * 3 = 0.30000000000000004 in JS
    expect(getSubtotal({ quantity: 4, unitPrice: 145.75 })).toBe(583)
  })
})

describe('getCarTotal', () => {
  it('sums all product subtotals', () => {
    const car = {
      products: [
        { id: 'a', name: 'Engine Oil', quantity: 2, unitPrice: 1250 },
        { id: 'b', name: 'Oil Filter', quantity: 1, unitPrice: 185.5 },
        { id: 'c', name: 'Brake Pads', quantity: 1, unitPrice: 1899.99 },
      ],
    }
    expect(getCarTotal(car)).toBe(4585.49)
  })

  it('is exact when adding many small decimals', () => {
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: 'Bolt',
      quantity: 1,
      unitPrice: 0.1,
    }))
    expect(getCarTotal({ products })).toBe(1)
  })

  it('returns 0 for a car without products', () => {
    expect(getCarTotal({ products: [] })).toBe(0)
  })
})

describe('getCarUnitCount / getFleetTotal', () => {
  const cars = [
    { products: [{ id: 'a', name: 'A', quantity: 3, unitPrice: 0.1 }] },
    { products: [{ id: 'b', name: 'B', quantity: 2, unitPrice: 0.2 }] },
  ]

  it('counts units in a car', () => {
    expect(getCarUnitCount(cars[0])).toBe(3)
  })

  it('sums totals across cars', () => {
    expect(getFleetTotal(cars)).toBe(0.7)
  })
})

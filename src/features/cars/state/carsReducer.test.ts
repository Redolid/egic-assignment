import { describe, expect, it } from 'vitest'
import type { Car } from '../types'
import { carsReducer } from './carsReducer'

const makeState = (): Car[] => [
  {
    id: 'c1',
    name: 'Toyota Corolla 2023',
    products: [
      { id: 'p1', name: 'Oil Filter', quantity: 1, unitPrice: 185.5 },
      { id: 'p2', name: 'Air Filter', quantity: 2, unitPrice: 320 },
    ],
  },
  { id: 'c2', name: 'Hyundai Elantra 2022', products: [] },
]

describe('carsReducer', () => {
  it('adds a product to the right car', () => {
    const state = makeState()
    const product = { id: 'p3', name: 'Spark Plug', quantity: 4, unitPrice: 145.75 }
    const next = carsReducer(state, { type: 'ADD_PRODUCT', carId: 'c2', product })

    expect(next[1].products).toEqual([product])
    expect(next[0]).toBe(state[0]) // untouched car keeps its reference
  })

  it('updates quantity / price without mutating the previous state', () => {
    const state = makeState()
    const next = carsReducer(state, {
      type: 'UPDATE_PRODUCT',
      carId: 'c1',
      productId: 'p2',
      patch: { quantity: 5, unitPrice: 300 },
    })

    expect(next[0].products[1]).toEqual({ id: 'p2', name: 'Air Filter', quantity: 5, unitPrice: 300 })
    expect(state[0].products[1].quantity).toBe(2)
    expect(next).not.toBe(state)
  })

  it('deletes a product', () => {
    const next = carsReducer(makeState(), { type: 'DELETE_PRODUCT', carId: 'c1', productId: 'p1' })
    expect(next[0].products.map((p) => p.id)).toEqual(['p2'])
  })

  it('moves a product between cars', () => {
    const next = carsReducer(makeState(), {
      type: 'MOVE_PRODUCT',
      fromCarId: 'c1',
      toCarId: 'c2',
      productId: 'p1',
    })
    expect(next[0].products.map((p) => p.id)).toEqual(['p2'])
    expect(next[1].products.map((p) => p.id)).toEqual(['p1'])
  })

  it('ignores moves onto the same car or to an unknown car', () => {
    const state = makeState()
    expect(
      carsReducer(state, { type: 'MOVE_PRODUCT', fromCarId: 'c1', toCarId: 'c1', productId: 'p1' }),
    ).toBe(state)
    expect(
      carsReducer(state, { type: 'MOVE_PRODUCT', fromCarId: 'c1', toCarId: 'nope', productId: 'p1' }),
    ).toBe(state)
  })

  it('merges an add of the same product (name + price) into the existing row', () => {
    const next = carsReducer(makeState(), {
      type: 'ADD_PRODUCT',
      carId: 'c1',
      product: { id: 'p9', name: 'oil filter', quantity: 1, unitPrice: 185.5 },
    })
    expect(next[0].products).toHaveLength(2)
    expect(next[0].products[0]).toEqual({ id: 'p1', name: 'Oil Filter', quantity: 2, unitPrice: 185.5 })
  })

  it('keeps a same-name product with a different price as its own row', () => {
    const next = carsReducer(makeState(), {
      type: 'ADD_PRODUCT',
      carId: 'c1',
      product: { id: 'p9', name: 'Oil Filter', quantity: 1, unitPrice: 199 },
    })
    expect(next[0].products.map((p) => p.id)).toEqual(['p1', 'p2', 'p9'])
  })

  it('combines quantities when moving a product onto a car that already has it', () => {
    const state: Car[] = [
      makeState()[0],
      { id: 'c2', name: 'Hyundai Elantra 2022', products: [{ id: 'p5', name: 'Air Filter', quantity: 3, unitPrice: 320 }] },
    ]
    const next = carsReducer(state, { type: 'MOVE_PRODUCT', fromCarId: 'c1', toCarId: 'c2', productId: 'p2' })
    expect(next[0].products.map((p) => p.id)).toEqual(['p1'])
    expect(next[1].products).toEqual([{ id: 'p5', name: 'Air Filter', quantity: 5, unitPrice: 320 }])
  })

  it('resets to the given cars', () => {
    const seed = makeState()
    const next = carsReducer([], { type: 'RESET', cars: seed })
    expect(next).toBe(seed)
  })
})

import { describe, expect, it } from 'vitest'
import { addOrMerge, findMergeTarget, isSameProduct } from './merge'

const oil = { id: 'p1', name: 'Engine Oil 5W-30 (4L)', quantity: 2, unitPrice: 1250 }

describe('isSameProduct', () => {
  it('matches names ignoring case and extra whitespace', () => {
    expect(isSameProduct(oil, { name: '  engine oil   5w-30 (4l) ', unitPrice: 1250 })).toBe(true)
  })

  it('compares prices to the piaster (no float noise)', () => {
    expect(isSameProduct({ name: 'A', unitPrice: 0.1 + 0.2 }, { name: 'A', unitPrice: 0.3 })).toBe(true)
  })

  it('treats a different price as a different product', () => {
    expect(isSameProduct(oil, { name: oil.name, unitPrice: 1300 })).toBe(false)
  })
})

describe('addOrMerge', () => {
  it('adds the incoming quantity to the matching row', () => {
    const result = addOrMerge([oil], { id: 'p2', name: 'Engine Oil 5W-30 (4L)', quantity: 1, unitPrice: 1250 })
    expect(result).toEqual([{ ...oil, quantity: 3 }])
  })

  it('appends when nothing matches', () => {
    const filter = { id: 'p2', name: 'Oil Filter', quantity: 1, unitPrice: 185.5 }
    expect(addOrMerge([oil], filter)).toEqual([oil, filter])
  })

  it('never merges a row into itself', () => {
    expect(findMergeTarget([oil], oil, oil.id)).toBeUndefined()
  })
})

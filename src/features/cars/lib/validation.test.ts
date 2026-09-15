import { describe, expect, it } from 'vitest'
import { validateName, validatePrice, validateQuantity } from './validation'

describe('validateQuantity', () => {
  it.each([
    ['1', 1],
    ['42', 42],
    [' 7 ', 7],
  ])('accepts %j', (raw, expected) => {
    expect(validateQuantity(raw)).toEqual({ ok: true, value: expected })
  })

  it.each([
    ['', 'Quantity is required'],
    ['0', 'Quantity must be positive'],
    ['-2', 'Quantity must be positive'],
    ['abc', 'Quantity must be a number'],
    ['1.5', 'Quantity must be a whole number'],
    ['1e2', 'Quantity must be a whole number'],
  ])('rejects %j', (raw, error) => {
    expect(validateQuantity(raw)).toEqual({ ok: false, error })
  })
})

describe('validatePrice', () => {
  it.each([
    ['10', 10],
    ['185.5', 185.5],
    ['1899.99', 1899.99],
    ['.5', 0.5],
  ])('accepts %j', (raw, expected) => {
    expect(validatePrice(raw)).toEqual({ ok: true, value: expected })
  })

  it.each([
    ['', 'Price is required'],
    ['0', 'Price must be positive'],
    ['-5', 'Price must be positive'],
    ['abc', 'Price must be a number'],
    ['1e3', 'Price must be a number'],
    ['9.999', 'Use at most 2 decimals'],
  ])('rejects %j', (raw, error) => {
    expect(validatePrice(raw)).toEqual({ ok: false, error })
  })
})

describe('validateName', () => {
  it('trims the name', () => {
    expect(validateName('  Oil Filter ')).toEqual({ ok: true, value: 'Oil Filter' })
  })

  it('rejects blank names', () => {
    expect(validateName('   ')).toEqual({ ok: false, error: 'Name is required' })
  })
})

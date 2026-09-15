import { describe, expect, it } from 'vitest'
import rawTraders from '../data/traders.json'
import { normalizeTraders } from './traders'

describe('normalizeTraders', () => {
  it('maps the provided data to { id, name, lat, lng }', () => {
    const traders = normalizeTraders(rawTraders)
    expect(traders).toHaveLength(14)
    expect(traders[0]).toEqual({
      id: 5405,
      name: 'ايهاب سعيد حليم ابن الملك',
      lat: 28.650260774768963,
      lng: 30.839549474836588,
    })
  })

  it('skips records with invalid coordinates', () => {
    const traders = normalizeTraders([
      { SAL_CODE: 1, SHOP_NAME: 'ok', LATITUDE: 30, LONGITUDE: 31 },
      { SAL_CODE: 2, SHOP_NAME: 'bad lat', LATITUDE: 120, LONGITUDE: 31 },
      { SAL_CODE: 3, SHOP_NAME: 'missing', LATITUDE: Number.NaN, LONGITUDE: 31 },
    ])
    expect(traders.map((t) => t.id)).toEqual([1])
  })
})

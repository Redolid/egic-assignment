import { describe, expect, it } from 'vitest'
import { deriveChecks } from './cardFields'

const today = new Date(2026, 8, 15)
const ID = '29001010123456' // fictional: male, Cairo, 1990-01-01

describe('deriveChecks', () => {
  it('passes a consistent two-sided reading', () => {
    const checks = deriveChecks({ nationalId: ID, gender: 'male', expiryDate: '2030-08-05' }, { front: ID, back: ID }, today)
    expect(checks.map((check) => [check.key, check.status])).toEqual([
      ['structure', 'pass'],
      ['sides', 'pass'],
      ['gender', 'pass'],
      ['expiry', 'pass'],
    ])
  })

  it('fails when the sides disagree and warns on gender mismatch and expiry', () => {
    const checks = deriveChecks(
      { nationalId: ID, gender: 'female', expiryDate: '2020-01-01' },
      { front: ID, back: '29001010123476' },
      today,
    )
    expect(Object.fromEntries(checks.map((check) => [check.key, check.status]))).toEqual({
      structure: 'pass',
      sides: 'fail',
      gender: 'warn',
      expiry: 'warn',
    })
  })

  it('reports an invalid ID with the parser message', () => {
    const [structure] = deriveChecks({ nationalId: '29002300123456' }, {}, today)
    expect(structure).toMatchObject({ status: 'fail', detail: 'Birth date encoded in the ID is not a valid date' })
  })

  it('accepts Arabic-Indic digits from either side', () => {
    const checks = deriveChecks({ nationalId: ID }, { front: '٢٩٠٠١٠١٠١٢٣٤٥٦', back: ID }, today)
    expect(checks.find((check) => check.key === 'sides')?.status).toBe('pass')
  })
})

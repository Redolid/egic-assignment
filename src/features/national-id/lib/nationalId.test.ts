import { describe, expect, it } from 'vitest'
import { normalizeDigits, parseNationalId, toArabicDigits } from './nationalId'

const today = new Date(2026, 8, 15) // 15 Sep 2026

describe('normalizeDigits / toArabicDigits', () => {
  it('converts Arabic-Indic and Persian digits to 0-9', () => {
    expect(normalizeDigits('٢٩٠٠١٠١')).toBe('2900101')
    expect(normalizeDigits('۲۹۰')).toBe('290')
  })

  it('round-trips', () => {
    expect(normalizeDigits(toArabicDigits('29001010123456'))).toBe('29001010123456')
  })
})

describe('parseNationalId', () => {
  it('decodes a male born in Cairo in 1990', () => {
    const result = parseNationalId('29001010123456', today)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.info).toMatchObject({
      birthDateIso: '1990-01-01',
      age: 36,
      gender: 'male',
      governorateCode: '01',
      sequence: '2345',
      checkDigit: '6',
    })
    expect(result.info.governorate.en).toBe('Cairo')
  })

  it('decodes a female born in Giza in 2003 (century digit 3, even gender digit)', () => {
    const result = parseNationalId('30311202101248', today)
    expect(result.ok && result.info).toMatchObject({
      birthDateIso: '2003-11-20',
      age: 22,
      gender: 'female',
      governorateCode: '21',
    })
  })

  it('computes age correctly before the birthday', () => {
    const result = parseNationalId('29009300101234', today) // born 30 Sep 1990
    expect(result.ok && result.info.age).toBe(35)
  })

  it('accepts Arabic-Indic digits and ignores spaces', () => {
    expect(parseNationalId('٢٩٠٠١٠١ ٠١٢٣٤٥٦', today).ok).toBe(true)
  })

  it.each([
    ['', 'National ID is required'],
    ['2900101012345', 'National ID must be 14 digits (got 13)'],
    ['2900101012345A', 'National ID must contain digits only'],
    ['19001010123456', 'Invalid century digit "1" (expected 2 or 3)'],
    ['29002300123456', 'Birth date encoded in the ID is not a valid date'], // 30 Feb
    ['29013010123456', 'Birth date encoded in the ID is not a valid date'], // month 13
    ['33001010123456', 'Birth date encoded in the ID is in the future'], // 2030
    ['29001019923456', 'Unknown governorate code "99"'],
  ])('rejects %j', (raw, error) => {
    expect(parseNationalId(raw, today)).toEqual({ ok: false, error })
  })
})

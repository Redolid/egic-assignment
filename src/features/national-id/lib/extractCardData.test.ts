import { describe, expect, it } from 'vitest'
import { extractCardData, extractName, extractNationalId } from './extractCardData'

/** Typical (slightly noisy) Tesseract output for the front of a card. */
const ocrText = `
جمهورية مصر العربية
بطاقة تحقيق الشخصية
| ~
محمد
أحمد علي حسن
١٢ شارع التحرير
الدقي - الجيزة
٢٩٠٠١٠١٠١٢٣٤٥٦
FA1234567
`

describe('extractNationalId', () => {
  it('finds the Arabic-Indic 14-digit number', () => {
    expect(extractNationalId(ocrText)).toBe('29001010123456')
  })

  it('joins digits split by spaces', () => {
    expect(extractNationalId('٢٩٠ ٠١٠١ ٠١٢٣ ٤٥٦')).toBe('29001010123456')
  })

  it('picks the valid 14-digit window out of a longer noisy digit run', () => {
    expect(extractNationalId('7 29001010123456')).toBe('29001010123456')
  })

  it('returns a structurally invalid 14-digit number as a fallback for manual correction', () => {
    expect(extractNationalId('99999999999999')).toBe('99999999999999')
  })

  it('returns null when there is no 14-digit number', () => {
    expect(extractNationalId('جمهورية مصر العربية\n١٢٣')).toBeNull()
  })
})

describe('extractName', () => {
  it('joins the two name lines and skips header, noise and address', () => {
    expect(extractName(ocrText)).toBe('محمد أحمد علي حسن')
  })

  it('strips diacritics and non-Arabic noise inside a line', () => {
    expect(extractName('مُحَمَّد |\nأحمد| علي~ x')).toBe('محمد أحمد علي')
  })

  it('returns null when no name-like line exists', () => {
    expect(extractName('جمهورية مصر العربية\n١٢ شارع التحرير')).toBeNull()
  })
})

describe('extractCardData', () => {
  it('returns both fields', () => {
    expect(extractCardData(ocrText)).toEqual({
      name: 'محمد أحمد علي حسن',
      nationalId: '29001010123456',
    })
  })
})

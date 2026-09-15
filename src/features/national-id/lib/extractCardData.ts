import { NATIONAL_ID_LENGTH, normalizeDigits, parseNationalId } from './nationalId'

/**
 * Turns raw OCR text of the FRONT side of an Egyptian ID card into { name, nationalId }.
 *
 * Card layout (text is right-to-left, top to bottom):
 *
 *   ┌───────────────────────────────────────────────┐
 *   │            جمهورية مصر العربية                 │  header
 *   │            بطاقة تحقيق الشخصية                 │  header
 *   │ ┌──────┐                          محمد          │  name line 1: first name
 *   │ │photo │                 أحمد علي حسن          │  name line 2: father + family names
 *   │ │      │               ١٢ شارع التحرير          │  address line 1
 *   │ └──────┘                  الدقي - الجيزة        │  address line 2
 *   │                 ٢٩٠٠١٠١٠١٢٣٤٥٦                  │  national ID (14 Arabic-Indic digits)
 *   └───────────────────────────────────────────────┘
 *
 * OCR output is noisy (background patterns, the photo, broken lines), so the parser
 * relies on things that are stable: the ID is the only 14-digit number, and the name
 * is the first two clean Arabic lines after the header and before the address.
 */

export interface ExtractedCardData {
  name: string | null
  nationalId: string | null
}

/** Header words printed on every card — never part of the name. */
const HEADER_WORDS = ['جمهورية', 'مصر', 'العربية', 'بطاقة', 'تحقيق', 'الشخصية']

/** Words that usually start the address block. */
const ADDRESS_WORDS = ['شارع', 'ش', 'قسم', 'مركز', 'محافظة', 'حي', 'عمارة', 'برج', 'قرية', 'مدينة', 'الجيزة', 'القاهرة']

const ARABIC_LETTER = /[ء-ي]/
const ARABIC_WORD = /^[ء-ي]+$/

const splitLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

/**
 * Finds the national ID in OCR text.
 * Digits on the card are sometimes split by spaces or misread neighbours, so each line is
 * reduced to its digits and every 14-digit window is checked against the ID structure.
 * A structurally valid number wins; otherwise a raw 14-digit number is returned so the user can fix it.
 */
export function extractNationalId(text: string): string | null {
  let fallback: string | null = null

  for (const line of splitLines(normalizeDigits(text))) {
    const digits = line.replace(/\D/g, '')
    if (digits.length < NATIONAL_ID_LENGTH) continue

    for (let start = 0; start + NATIONAL_ID_LENGTH <= digits.length; start++) {
      const candidate = digits.slice(start, start + NATIONAL_ID_LENGTH)
      if (parseNationalId(candidate).ok) return candidate
    }
    if (!fallback && digits.length === NATIONAL_ID_LENGTH) fallback = digits
  }

  return fallback
}

/** Keeps only real Arabic words (drops OCR noise such as Latin letters, symbols and 1-letter fragments). */
function cleanArabicLine(line: string): string {
  return line
    .replace(/[ً-ْـ]/g, '') // tashkeel (diacritics) and tatweel
    .split(/\s+/)
    .map((word) => word.replace(/[^ء-ي]/g, ''))
    .filter((word) => word.length >= 2 && ARABIC_WORD.test(word))
    .join(' ')
}

/**
 * Finds the holder's name: the first two clean Arabic lines that are not the header,
 * contain no digits and appear before the address block.
 */
export function extractName(text: string): string | null {
  const nameLines: string[] = []

  for (const rawLine of splitLines(text)) {
    if (nameLines.length === 2) break

    const hasDigits = /\d/.test(normalizeDigits(rawLine))
    const cleaned = cleanArabicLine(rawLine)
    const words = cleaned.split(' ').filter(Boolean)
    // Noise lines are usually short fragments; every real name line has a word of 3+ letters.
    if (!ARABIC_LETTER.test(cleaned) || !words.some((word) => word.length >= 3)) continue

    const isHeader = words.some((word) => HEADER_WORDS.includes(word))
    if (isHeader) continue

    // Address (or the ID line) reached: stop — the name is always above it.
    const isAddress = hasDigits || words.some((word) => ADDRESS_WORDS.includes(word))
    if (isAddress) {
      if (nameLines.length > 0) break
      continue
    }

    nameLines.push(cleaned)
  }

  return nameLines.length > 0 ? nameLines.join(' ') : null
}

export function extractCardData(text: string): ExtractedCardData {
  return { name: extractName(text), nationalId: extractNationalId(text) }
}

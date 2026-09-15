/**
 * Egyptian National ID number — structure
 * ---------------------------------------
 * Every Egyptian citizen has a 14-digit national number printed on the ID card.
 * The number is not random: most of it encodes facts about the holder.
 *
 *   Example:   2  900101  01  2345  6
 *              │    │      │    │   └─ [14]    Check digit (algorithm not officially published)
 *              │    │      │    └───── [10-13] Birth registration sequence.
 *              │    │      │                   The LAST of these 4 digits (13th overall) is the gender:
 *              │    │      │                   odd = male, even = female
 *              │    │      └────────── [8-9]   Governorate code of birth (88 = born abroad)
 *              │    └───────────────── [2-7]   Birth date as YYMMDD
 *              └────────────────────── [1]     Century of birth: 2 = 1900–1999, 3 = 2000–2099
 *
 * On the card the number is printed with Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩),
 * so text coming from OCR must be normalised to 0-9 first.
 */

export const NATIONAL_ID_LENGTH = 14

/** Governorate codes (digits 8–9). */
export const GOVERNORATES: Record<string, { en: string; ar: string }> = {
  '01': { en: 'Cairo', ar: 'القاهرة' },
  '02': { en: 'Alexandria', ar: 'الإسكندرية' },
  '03': { en: 'Port Said', ar: 'بورسعيد' },
  '04': { en: 'Suez', ar: 'السويس' },
  '11': { en: 'Damietta', ar: 'دمياط' },
  '12': { en: 'Dakahlia', ar: 'الدقهلية' },
  '13': { en: 'Sharqia', ar: 'الشرقية' },
  '14': { en: 'Qalyubia', ar: 'القليوبية' },
  '15': { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
  '16': { en: 'Gharbia', ar: 'الغربية' },
  '17': { en: 'Monufia', ar: 'المنوفية' },
  '18': { en: 'Beheira', ar: 'البحيرة' },
  '19': { en: 'Ismailia', ar: 'الإسماعيلية' },
  '21': { en: 'Giza', ar: 'الجيزة' },
  '22': { en: 'Beni Suef', ar: 'بني سويف' },
  '23': { en: 'Faiyum', ar: 'الفيوم' },
  '24': { en: 'Minya', ar: 'المنيا' },
  '25': { en: 'Asyut', ar: 'أسيوط' },
  '26': { en: 'Sohag', ar: 'سوهاج' },
  '27': { en: 'Qena', ar: 'قنا' },
  '28': { en: 'Aswan', ar: 'أسوان' },
  '29': { en: 'Luxor', ar: 'الأقصر' },
  '31': { en: 'Red Sea', ar: 'البحر الأحمر' },
  '32': { en: 'New Valley', ar: 'الوادي الجديد' },
  '33': { en: 'Matrouh', ar: 'مطروح' },
  '34': { en: 'North Sinai', ar: 'شمال سيناء' },
  '35': { en: 'South Sinai', ar: 'جنوب سيناء' },
  '88': { en: 'Born outside Egypt', ar: 'خارج الجمهورية' },
}

const CENTURY_START: Record<string, number> = { '2': 1900, '3': 2000 }

export interface NationalIdInfo {
  id: string
  birthDate: Date
  /** "YYYY-MM-DD", timezone independent. */
  birthDateIso: string
  age: number
  gender: 'male' | 'female'
  governorateCode: string
  governorate: { en: string; ar: string }
  sequence: string
  checkDigit: string
}

export type NationalIdResult = { ok: true; info: NationalIdInfo } | { ok: false; error: string }

/** Converts Arabic-Indic (٠-٩) and Eastern Arabic/Persian (۰-۹) digits to 0-9. */
export function normalizeDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

/** Western digits → Arabic-Indic digits, the way they are printed on the card. */
export function toArabicDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)))
}

function calculateAge(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear()
  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  if (!birthdayPassed) age -= 1
  return age
}

/**
 * Validates the structure of a national ID and decodes the information embedded in it.
 * Accepts Western or Arabic-Indic digits; spaces and dashes are ignored.
 */
export function parseNationalId(raw: string, today: Date = new Date()): NationalIdResult {
  const id = normalizeDigits(raw).replace(/[\s-]/g, '')

  if (!id) return { ok: false, error: 'National ID is required' }
  if (!/^\d+$/.test(id)) return { ok: false, error: 'National ID must contain digits only' }
  if (id.length !== NATIONAL_ID_LENGTH) {
    return { ok: false, error: `National ID must be 14 digits (got ${id.length})` }
  }

  const centuryDigit = id[0]
  const centuryStart = CENTURY_START[centuryDigit]
  if (centuryStart === undefined) {
    return { ok: false, error: `Invalid century digit "${centuryDigit}" (expected 2 or 3)` }
  }

  const year = centuryStart + Number(id.slice(1, 3))
  const month = Number(id.slice(3, 5))
  const day = Number(id.slice(5, 7))
  const birthDate = new Date(year, month - 1, day)
  // new Date() silently rolls over invalid dates (e.g. Feb 30 → Mar 2), so compare back.
  const isRealDate =
    birthDate.getFullYear() === year &&
    birthDate.getMonth() === month - 1 &&
    birthDate.getDate() === day
  if (!isRealDate) return { ok: false, error: 'Birth date encoded in the ID is not a valid date' }
  if (birthDate > today) return { ok: false, error: 'Birth date encoded in the ID is in the future' }

  const governorateCode = id.slice(7, 9)
  const governorate = GOVERNORATES[governorateCode]
  if (!governorate) return { ok: false, error: `Unknown governorate code "${governorateCode}"` }

  const sequence = id.slice(9, 13)
  const genderDigit = Number(id[12])

  return {
    ok: true,
    info: {
      id,
      birthDate,
      birthDateIso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      age: calculateAge(birthDate, today),
      gender: genderDigit % 2 === 1 ? 'male' : 'female',
      governorateCode,
      governorate,
      sequence,
      checkDigit: id[13],
    },
  }
}

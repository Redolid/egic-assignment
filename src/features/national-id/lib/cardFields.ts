import { normalizeDigits, parseNationalId } from './nationalId'

/** Every field the reader can produce, in the order they are numbered on the sheet (front, then back). */
export const FIELD_ORDER = [
  'name',
  'address',
  'nationalId',
  'cardNumber',
  'job',
  'gender',
  'religion',
  'maritalStatus',
  'issueDate',
  'expiryDate',
] as const

export type FieldKey = (typeof FIELD_ORDER)[number]
export type CardSideName = 'front' | 'back'

export const FIELD_META: Record<FieldKey, { label: string; side: CardSideName; arabic?: boolean }> = {
  name: { label: 'Name', side: 'front', arabic: true },
  address: { label: 'Address', side: 'front', arabic: true },
  nationalId: { label: 'National ID', side: 'front' },
  cardNumber: { label: 'Card number', side: 'front' },
  job: { label: 'Profession', side: 'back', arabic: true },
  gender: { label: 'Gender', side: 'back' },
  religion: { label: 'Religion', side: 'back' },
  maritalStatus: { label: 'Marital status', side: 'back' },
  issueDate: { label: 'Issued', side: 'back' },
  expiryDate: { label: 'Valid until', side: 'back' },
}

export interface ReadField {
  key: FieldKey
  value: string
  /** 0–1, or null when the engine gives no confidence (Claude). */
  confidence: number | null
  side: CardSideName
  /** Normalised [x0, y0, x1, y1] on that side's image, when the engine locates text. */
  box: [number, number, number, number] | null
  note?: string | null
}

export interface CardSide {
  side: CardSideName
  /** Image of this side (data URL) when the engine returns one. */
  image: string | null
  fields: ReadField[]
}

export interface ReadCheck {
  key: string
  label: string
  status: 'pass' | 'fail' | 'warn'
  detail: string
}

export type FieldValues = Partial<Record<FieldKey, string>>

/**
 * Checks recomputed from the values currently in the form, so a correction re-validates immediately.
 * `idsBySide` holds the national numbers as read from each side, for the front ↔ back comparison.
 */
export function deriveChecks(
  values: FieldValues,
  idsBySide: Partial<Record<CardSideName, string>>,
  today: Date = new Date(),
): ReadCheck[] {
  const checks: ReadCheck[] = []
  const id = values.nationalId ?? ''
  const parsed = id ? parseNationalId(id, today) : null

  checks.push(
    parsed?.ok
      ? { key: 'structure', label: 'ID structure', status: 'pass', detail: 'Century, birth date and governorate code are valid.' }
      : {
          key: 'structure',
          label: 'ID structure',
          status: 'fail',
          detail: parsed ? parsed.error : 'No national ID yet.',
        },
  )

  const front = idsBySide.front && normalizeDigits(idsBySide.front)
  const back = idsBySide.back && normalizeDigits(idsBySide.back)
  if (front && back) {
    checks.push(
      front === back
        ? { key: 'sides', label: 'Front ↔ back', status: 'pass', detail: 'Both sides carry the same number.' }
        : { key: 'sides', label: 'Front ↔ back', status: 'fail', detail: `Front reads ${front}, back reads ${back}.` },
    )
  }

  const gender = values.gender?.trim().toLowerCase()
  if (parsed?.ok && (gender === 'male' || gender === 'female')) {
    checks.push(
      gender === parsed.info.gender
        ? { key: 'gender', label: 'Gender ↔ ID digit', status: 'pass', detail: `13th digit and card both say ${gender}.` }
        : { key: 'gender', label: 'Gender ↔ ID digit', status: 'warn', detail: `13th digit says ${parsed.info.gender}; the card says ${gender}.` },
    )
  }

  const expiry = values.expiryDate?.trim()
  if (expiry && /^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
    const valid = new Date(`${expiry}T23:59:59`) >= today
    checks.push({
      key: 'expiry',
      label: 'Card validity',
      status: valid ? 'pass' : 'warn',
      detail: valid ? `Valid until ${expiry}.` : `Expired on ${expiry}.`,
    })
  }
  return checks
}

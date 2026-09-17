import { FIELD_META } from './cardFields'
import type { CardSideName, FieldKey, ReadField } from './cardFields'
import type { ReaderEngine } from './cardReader'

export interface FieldRow {
  key: FieldKey
  number: number
  sides: CardSideName[]
  /** Lowest confidence across the sides it was read from; null when the engine gives none. */
  confidence: number | null
  note: string | null
}

/** One row per field in sheet order, merging the same field read on both sides (e.g. the national ID). */
export function buildRows(fields: ReadField[], alwaysShow: FieldKey[]): FieldRow[] {
  const order = Object.keys(FIELD_META) as FieldKey[]
  const keys = order.filter((key) => alwaysShow.includes(key) || fields.some((field) => field.key === key))
  return keys.map((key, index) => {
    const matches = fields.filter((field) => field.key === key)
    const confidences = matches.map((field) => field.confidence).filter((value): value is number => value !== null)
    return {
      key,
      number: index + 1,
      sides: [...new Set(matches.map((field) => field.side))],
      confidence: confidences.length ? Math.min(...confidences) : null,
      note: matches.find((field) => field.note)?.note ?? null,
    }
  })
}

export const ENGINE_NAMES: Record<ReaderEngine, { name: string; kind: string }> = {
  'local-model': { name: 'Local ML Model', kind: 'Deep learning · both sides · PDF' },
  tesseract: { name: 'Browser OCR', kind: 'Tesseract · front photos · fallback' },
}

export const engineName = (engine: ReaderEngine) => ENGINE_NAMES[engine].name

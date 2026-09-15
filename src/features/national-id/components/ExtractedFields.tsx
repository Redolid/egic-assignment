import { useId } from 'react'
import { FieldMessage } from '../../../components/ui/FieldMessage'
import { FIELD_META } from '../lib/cardFields'
import type { FieldKey, FieldValues } from '../lib/cardFields'
import type { FieldRow } from '../lib/fieldRows'
import { parseNationalId } from '../lib/nationalId'

function ConfidenceMeter({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-ink-400">—</span>
  const percent = Math.round(value * 100)
  const tone = value >= 0.85 ? 'bg-ink-950' : value >= 0.6 ? 'bg-caution-600' : 'bg-fail-600'
  return (
    <span className="flex items-center justify-end gap-2" title={`Model confidence ${percent}%`}>
      <span className="relative h-1.5 w-12 bg-ink-200">
        <span className={`absolute inset-y-0 left-0 origin-left ${tone} motion-safe:animate-draw-in`} style={{ width: `${percent}%` }} />
      </span>
      <span className="figures w-8 text-right text-xs text-ink-700">{percent}%</span>
    </span>
  )
}

interface FieldInputProps {
  row: FieldRow
  value: string
  onChange: (value: string) => void
}

function FieldInput({ row, value, onChange }: FieldInputProps) {
  const id = useId()
  const meta = FIELD_META[row.key]
  const idError = row.key === 'nationalId' && value ? (() => {
    const parsed = parseNationalId(value)
    return parsed.ok ? null : parsed.error
  })() : null

  return (
    <div className="min-w-0">
      <input
        id={id}
        aria-label={meta.label}
        aria-invalid={Boolean(idError)}
        aria-describedby={idError ? `${id}-error` : undefined}
        dir={meta.arabic ? 'rtl' : 'ltr'}
        lang={meta.arabic ? 'ar' : undefined}
        inputMode={row.key === 'nationalId' ? 'numeric' : undefined}
        value={value}
        placeholder={row.key === 'nationalId' ? '14 digits' : '—'}
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 w-full rounded-[3px] border bg-white px-2.5 text-ink-950 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-400 focus:ring-[3px] ${
          meta.arabic ? 'text-[0.9375rem]' : 'text-sm'
        } ${row.key === 'nationalId' ? 'figures tracking-[0.08em]' : ''} ${
          idError ? 'border-fail-600 focus:ring-fail-600/15' : 'border-transparent hover:border-ink-300 focus:border-cobalt-600 focus:ring-cobalt-600/15'
        }`}
      />
      <FieldMessage id={`${id}-error`} message={idError} />
      {row.note && <p className="mt-0.5 px-2.5 text-[0.6875rem] text-caution-700">{row.note}</p>}
    </div>
  )
}

interface ExtractedFieldsProps {
  rows: FieldRow[]
  values: FieldValues
  activeKey: FieldKey | null
  onActivate: (key: FieldKey | null) => void
  onChange: (key: FieldKey, value: string) => void
}

/** The field register: numbered like the balloons on the card, values editable in place. */
export function ExtractedFields({ rows, values, activeKey, onActivate, onChange }: ExtractedFieldsProps) {
  return (
    <table className="w-full table-fixed text-sm" onMouseLeave={() => onActivate(null)}>
      <caption className="sr-only">Extracted fields</caption>
      <thead className="border-b border-ink-950">
        <tr>
          <th scope="col" className="spec-label w-9 py-2 text-left">
            No.
          </th>
          <th scope="col" className="spec-label w-[7.5rem] py-2 text-left">
            Field
          </th>
          <th scope="col" className="spec-label py-2 text-left">
            <span className="px-2.5">Value</span>
          </th>
          <th scope="col" className="spec-label hidden w-24 py-2 text-right sm:table-cell">
            Confidence
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const active = activeKey === row.key
          return (
            <tr
              key={row.key}
              onMouseEnter={() => onActivate(row.key)}
              onFocus={() => onActivate(row.key)}
              className={`border-b border-ink-200 align-top transition-colors duration-150 ${active ? 'bg-cobalt-50' : ''}`}
            >
              <td className="py-2">
                <span className={`balloon transition-colors duration-200 ${active ? '!border-cobalt-600 !bg-cobalt-600 text-white' : 'text-ink-950'}`}>
                  {row.number}
                </span>
              </td>
              <td className="py-2.5 pr-2">
                <span className="block font-semibold text-ink-950">{FIELD_META[row.key].label}</span>
                <span className="block text-[0.6875rem] text-ink-500">
                  {row.sides.length ? row.sides.map((side) => (side === 'front' ? 'Front' : 'Back')).join(' · ') : 'Not found'}
                </span>
              </td>
              <td className="py-1.5">
                <FieldInput row={row} value={values[row.key] ?? ''} onChange={(value) => onChange(row.key, value)} />
              </td>
              <td className="hidden py-3 sm:table-cell">
                <ConfidenceMeter value={row.confidence} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

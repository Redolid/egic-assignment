import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { TextField } from '../../../components/ui/TextField'
import { parseNationalId, toArabicDigits } from '../lib/nationalId'
import type { NationalIdInfo } from '../lib/nationalId'

interface IdResultProps {
  name: string
  nationalId: string
  onNameChange: (name: string) => void
  onNationalIdChange: (nationalId: string) => void
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

type Part = 'century' | 'birth' | 'governorate' | 'sequence' | 'gender' | 'check'

/** The five printed segments of the number, in order. The gender digit lives inside the sequence. */
const SEGMENTS: { part: Exclude<Part, 'gender'>; label: string; slice: [number, number] }[] = [
  { part: 'century', label: 'Century', slice: [0, 1] },
  { part: 'birth', label: 'Birth date', slice: [1, 7] },
  { part: 'governorate', label: 'Gov.', slice: [7, 9] },
  { part: 'sequence', label: 'Sequence', slice: [9, 13] },
  { part: 'check', label: 'Check', slice: [13, 14] },
]

/**
 * The number splits into its parts when it becomes valid, and each decoded row points at the
 * digits it came from (hover or focus a row, or a segment) — the structure is taught, not just stated.
 */
function IdStructure({ info }: { info: NationalIdInfo }) {
  const [active, setActive] = useState<Part | null>(null)

  const isLit = (part: Part, digitIndex: number) =>
    active === part ||
    (active === 'gender' && digitIndex === 12) ||
    (active === 'birth' && part === 'century')

  const rows: { part: Part; term: string; detail: ReactNode }[] = [
    {
      part: 'birth',
      term: 'Birth date',
      detail: (
        <>
          {dateFormatter.format(info.birthDate)} <span className="font-normal text-slate-500">({info.age} years)</span>
        </>
      ),
    },
    { part: 'gender', term: 'Gender', detail: <span className="capitalize">{info.gender}</span> },
    {
      part: 'governorate',
      term: 'Governorate',
      detail: (
        <>
          {info.governorate.en}{' '}
          <span className="font-normal text-slate-500" lang="ar">
            ({info.governorate.ar})
          </span>
        </>
      ),
    },
    { part: 'sequence', term: 'Sequence', detail: <span className="tabular-nums">{info.sequence}</span> },
    {
      part: 'check',
      term: 'Check digit',
      detail: (
        <>
          <span className="tabular-nums">{info.checkDigit}</span>{' '}
          <span className="text-xs font-normal text-slate-400">(not verified — algorithm is not public)</span>
        </>
      ),
    },
  ]

  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="mb-3 text-xs font-medium text-slate-500">Decoded from the ID number</p>

      <div className="flex flex-wrap items-start gap-x-2 gap-y-2" onMouseLeave={() => setActive(null)}>
        {SEGMENTS.map((segment, index) => (
          <div
            key={segment.part}
            style={{ '--i': index } as CSSProperties}
            onMouseEnter={() => setActive(segment.part)}
            className="flex flex-col items-center gap-1 motion-safe:animate-[segment-split_520ms_var(--ease-out)_both] motion-safe:[animation-delay:calc(var(--i)*45ms)]"
          >
            <span className="flex rounded-md bg-white px-1.5 py-1 font-semibold tabular-nums text-slate-900 shadow-xs ring-1 ring-slate-200">
              {info.id
                .slice(...segment.slice)
                .split('')
                .map((digit, offset) => {
                  const digitIndex = segment.slice[0] + offset
                  return (
                    <span
                      key={digitIndex}
                      className={`rounded-sm px-[1px] text-lg leading-6 transition-colors duration-200 ${
                        isLit(segment.part, digitIndex) ? 'bg-brand-100 text-brand-700' : ''
                      } ${digitIndex === 12 ? 'underline decoration-slate-300 decoration-dotted underline-offset-4' : ''}`}
                    >
                      {digit}
                    </span>
                  )
                })}
            </span>
            <span
              className={`text-[0.6875rem] font-medium transition-colors duration-200 motion-safe:animate-[caption-drop_420ms_var(--ease-out)_both] motion-safe:[animation-delay:calc(120ms+var(--i)*45ms)] ${
                active === segment.part || (active === 'birth' && segment.part === 'century') ? 'text-brand-700' : 'text-slate-400'
              }`}
            >
              {segment.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-baseline gap-2 text-xs text-slate-400">
        As printed on the card
        <bdi dir="rtl" lang="ar" className="text-sm font-medium tracking-wide text-slate-600">
          {toArabicDigits(info.id)}
        </bdi>
      </p>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 text-sm">
        {rows.map((row) => (
          <div
            key={row.part}
            tabIndex={0}
            onMouseEnter={() => setActive(row.part)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(row.part)}
            onBlur={() => setActive(null)}
            className={`col-span-2 grid grid-cols-subgrid rounded-lg px-2 py-1.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 ${
              active === row.part ? 'bg-white shadow-xs ring-1 ring-slate-200' : ''
            }`}
          >
            <dt className="text-slate-500">{row.term}</dt>
            <dd className="font-medium text-slate-900">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Shows the extracted name and ID as editable text (OCR can misread a character),
 * and decodes the ID live so any correction is re-validated immediately.
 */
export function IdResult({ name, nationalId, onNameChange, onNationalIdChange }: IdResultProps) {
  const parsed = nationalId ? parseNationalId(nationalId) : null

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Name"
        dir="rtl"
        lang="ar"
        value={name}
        placeholder="الاسم"
        onChange={(event) => onNameChange(event.target.value)}
        className="[&_input]:h-12 [&_input]:text-lg"
      />
      <TextField
        label="National ID"
        inputMode="numeric"
        value={nationalId}
        placeholder="14 digits"
        error={parsed && !parsed.ok ? parsed.error : null}
        onChange={(event) => onNationalIdChange(event.target.value)}
        className="[&_input]:h-12 [&_input]:text-lg [&_input]:tabular-nums [&_input]:tracking-[0.12em]"
      />

      {/* Keyed by the number: a newly valid ID replays the split so the change is noticed. */}
      {parsed?.ok && <IdStructure key={parsed.info.id} info={parsed.info} />}
    </div>
  )
}

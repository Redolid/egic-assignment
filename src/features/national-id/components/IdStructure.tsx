import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { toArabicDigits } from '../lib/nationalId'
import type { NationalIdInfo } from '../lib/nationalId'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

type Part = 'century' | 'birth' | 'governorate' | 'sequence' | 'gender' | 'check'

/** The five printed segments of the number, in order. The gender digit lives inside the sequence. */
const SEGMENTS: { part: Exclude<Part, 'gender'>; label: string; slice: [number, number] }[] = [
  { part: 'century', label: 'Century', slice: [0, 1] },
  { part: 'birth', label: 'YYMMDD', slice: [1, 7] },
  { part: 'governorate', label: 'Gov.', slice: [7, 9] },
  { part: 'sequence', label: 'Sequence', slice: [9, 13] },
  { part: 'check', label: 'Check', slice: [13, 14] },
]

/**
 * The number drawn as a dimensioned part: it splits into its segments when valid, and each decoded row
 * points at the digits it came from (hover or focus a row or a segment). The structure is taught, not stated.
 */
export function IdStructure({ info }: { info: NationalIdInfo }) {
  const [active, setActive] = useState<Part | null>(null)

  const isLit = (part: Part, digitIndex: number) =>
    active === part || (active === 'gender' && digitIndex === 12) || (active === 'birth' && part === 'century')

  const rows: { part: Part; term: string; detail: ReactNode }[] = [
    {
      part: 'birth',
      term: 'Birth date',
      detail: (
        <>
          {dateFormatter.format(info.birthDate)} <span className="font-normal text-ink-600">· {info.age} years</span>
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
          <span className="font-normal text-ink-600" lang="ar">
            {info.governorate.ar}
          </span>
        </>
      ),
    },
    { part: 'sequence', term: 'Sequence', detail: <span className="figures">{info.sequence}</span> },
    {
      part: 'check',
      term: 'Check digit',
      detail: (
        <>
          <span className="figures">{info.checkDigit}</span>{' '}
          <span className="text-xs font-normal text-ink-500">not verified — algorithm is not public</span>
        </>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-2" onMouseLeave={() => setActive(null)}>
        {SEGMENTS.map((segment, index) => (
          <div
            key={segment.part}
            style={{ '--i': index } as CSSProperties}
            onMouseEnter={() => setActive(segment.part)}
            className="flex flex-col items-center gap-1 motion-safe:animate-[segment-split_520ms_var(--ease-out)_both] motion-safe:[animation-delay:calc(var(--i)*45ms)]"
          >
            <span className="flex border-[1.5px] border-ink-950 bg-white px-1 py-0.5 font-semibold tabular-nums text-ink-950">
              {info.id
                .slice(...segment.slice)
                .split('')
                .map((digit, offset) => {
                  const digitIndex = segment.slice[0] + offset
                  return (
                    <span
                      key={digitIndex}
                      className={`px-[1.5px] text-lg leading-7 transition-colors duration-200 ${
                        isLit(segment.part, digitIndex) ? 'bg-cobalt-600 text-white' : ''
                      } ${digitIndex === 12 ? 'underline decoration-ink-400 decoration-dotted underline-offset-4' : ''}`}
                    >
                      {digit}
                    </span>
                  )
                })}
            </span>
            {/* A dimension tick under each segment, then its caption. */}
            <span aria-hidden="true" className="h-1.5 w-full border-x border-b border-ink-400" />
            <span
              className={`text-[0.625rem] font-semibold uppercase tracking-[0.06em] transition-colors duration-200 motion-safe:animate-[caption-drop_420ms_var(--ease-out)_both] motion-safe:[animation-delay:calc(120ms+var(--i)*45ms)] ${
                active === segment.part || (active === 'birth' && segment.part === 'century') ? 'text-cobalt-700' : 'text-ink-600'
              }`}
            >
              {segment.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-2 text-xs text-ink-600">
        As printed on the card
        <bdi dir="rtl" lang="ar" className="text-sm font-medium tracking-wide text-ink-900">
          {toArabicDigits(info.id)}
        </bdi>
      </p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] border-t border-ink-950 text-sm">
        {rows.map((row) => (
          <div
            key={row.part}
            tabIndex={0}
            onMouseEnter={() => setActive(row.part)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(row.part)}
            onBlur={() => setActive(null)}
            className={`col-span-2 grid grid-cols-subgrid gap-x-6 border-b border-ink-200 px-1 py-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-600 ${
              active === row.part ? 'bg-cobalt-50' : ''
            }`}
          >
            <dt className="text-ink-600">{row.term}</dt>
            <dd className="font-semibold text-ink-950">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

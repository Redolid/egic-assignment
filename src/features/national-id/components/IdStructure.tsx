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
          {dateFormatter.format(info.birthDate)} <span className="font-normal text-fg-muted">· {info.age} years</span>
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
          <span className="font-normal text-fg-muted" lang="ar">
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
          <span className="text-xs font-normal text-fg-subtle">not verified — algorithm is not public</span>
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
            <span className="flex rounded-[var(--radius-fitting)] border border-line-strong bg-surface px-1.5 py-1 font-semibold tabular-nums text-fg shadow-panel">
              {info.id
                .slice(...segment.slice)
                .split('')
                .map((digit, offset) => {
                  const digitIndex = segment.slice[0] + offset
                  return (
                    <span
                      key={digitIndex}
                      className={`rounded px-[2px] text-lg leading-7 transition-colors duration-200 ${
                        isLit(segment.part, digitIndex) ? 'bg-accent text-on-accent' : ''
                      } ${digitIndex === 12 ? 'underline decoration-line-strong decoration-dotted underline-offset-4' : ''}`}
                    >
                      {digit}
                    </span>
                  )
                })}
            </span>
            {/* A short outlet under each segment, then its caption. */}
            <span aria-hidden="true" className="pipe h-1.5 w-1.5" />
            <span
              className={`text-[0.6875rem] font-medium transition-colors duration-200 motion-safe:animate-[caption-drop_420ms_var(--ease-out)_both] motion-safe:[animation-delay:calc(120ms+var(--i)*45ms)] ${
                active === segment.part || (active === 'birth' && segment.part === 'century') ? 'text-accent-strong' : 'text-fg-muted'
              }`}
            >
              {segment.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-2 text-xs text-fg-muted">
        As printed on the card
        <bdi dir="rtl" lang="ar" className="text-sm font-medium tracking-wide text-fg">
          {toArabicDigits(info.id)}
        </bdi>
      </p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-y-0.5 text-sm">
        {rows.map((row) => (
          <div
            key={row.part}
            tabIndex={0}
            onMouseEnter={() => setActive(row.part)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(row.part)}
            onBlur={() => setActive(null)}
            className={`col-span-2 grid grid-cols-subgrid gap-x-6 rounded-[var(--radius-fitting)] px-2.5 py-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
              active === row.part ? 'bg-accent-soft' : ''
            }`}
          >
            <dt className="text-fg-muted">{row.term}</dt>
            <dd className="font-semibold text-fg">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

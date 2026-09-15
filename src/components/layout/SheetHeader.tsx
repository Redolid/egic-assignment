import type { ReactNode } from 'react'

export interface SpecCell {
  label: string
  value: ReactNode
}

interface SheetHeaderProps {
  title: string
  description: ReactNode
  /** Title-block cells on the right: short label over a value. */
  cells?: SpecCell[]
  actions?: ReactNode
}

/** The heading block every sheet opens with: condensed title and brief on the left, spec cells on the right. */
export function SheetHeader({ title, description, cells = [], actions }: SheetHeaderProps) {
  return (
    <header className="grid gap-5 border-b border-ink-200 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        <h1 className="sheet-title text-[2.5rem] text-ink-950 sm:text-[3.25rem]">{title}</h1>
        <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-600">{description}</p>
      </div>
      {(cells.length > 0 || actions) && (
        <div className="flex flex-wrap items-stretch gap-3">
          {cells.length > 0 && (
            <dl className="flex border border-ink-950">
              {cells.map((cell) => (
                <div key={cell.label} className="min-w-[6.5rem] border-l border-ink-200 px-3 py-2 first:border-l-0">
                  <dt className="spec-label">{cell.label}</dt>
                  <dd className="figures mt-1 text-base font-semibold text-ink-950">{cell.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {actions}
        </div>
      )}
    </header>
  )
}

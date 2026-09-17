import type { ReactNode } from 'react'

export interface SpecCell {
  label: string
  value: ReactNode
}

interface SheetHeaderProps {
  title: string
  description: ReactNode
  /** The tool's pipe-run illustration. */
  illustration: ReactNode
  /** Summary figures shown as a row of gauges under the brief. */
  cells?: SpecCell[]
  actions?: ReactNode
}

/** Every tool opens the same way: title and brief beside its illustration, with its key figures below. */
export function SheetHeader({ title, description, illustration, cells = [], actions }: SheetHeaderProps) {
  return (
    <header className="panel relative overflow-hidden">
      {/* A wash of the tool's colour behind the illustration side. */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-2/5 bg-gradient-to-l from-accent-soft to-transparent sm:block" />
      <div className="relative grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[2.125rem]">{title}</h1>
          <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-fg-muted">{description}</p>
          {(cells.length > 0 || actions) && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <dl className="contents">
                {cells.map((cell) => (
                  <div key={cell.label} className="flex items-baseline gap-2 rounded-full border border-line bg-surface-2/70 py-1.5 pl-3.5 pr-4">
                    <dt className="text-xs text-fg-muted">{cell.label}</dt>
                    <dd className="figures text-sm font-semibold text-fg">{cell.value}</dd>
                  </div>
                ))}
              </dl>
              {actions}
            </div>
          )}
        </div>
        <div className="order-first w-40 shrink-0 sm:order-none sm:w-[15rem] lg:w-[17rem]">{illustration}</div>
      </div>
    </header>
  )
}

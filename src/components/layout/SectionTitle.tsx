import type { ReactNode } from 'react'

interface SectionTitleProps {
  id: string
  icon?: ReactNode
  aside?: ReactNode
  children: ReactNode
}

/** Heading for a working panel: an icon in the tool's colour, the title, and optional metadata on the right. */
export function SectionTitle({ id, icon, aside, children }: SectionTitleProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">{icon}</span>}
      <h2 id={id} className="text-base font-semibold text-fg">
        {children}
      </h2>
      {aside && <div className="ml-auto">{aside}</div>}
    </div>
  )
}

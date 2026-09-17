import { GripIcon } from '../../../components/ui/Icons'
import type { DragData } from '../dnd'
import { formatAmount } from '../lib/format'

/** The floating part that follows the pointer: tilts and lifts as it is picked up. */
export function DragPreview({ drag }: { drag: DragData }) {
  const name = drag.type === 'catalog' ? drag.template.name : drag.product.name
  const detail =
    drag.type === 'catalog'
      ? `1 × ${formatAmount(drag.template.unitPrice)} EGP`
      : `${drag.product.quantity} × ${formatAmount(drag.product.unitPrice)} EGP`

  return (
    <div className="flex w-60 cursor-grabbing items-center gap-2.5 rounded-[var(--radius-fitting)] border border-accent bg-surface px-3 py-2.5 shadow-panel motion-safe:animate-lift motion-reduce:shadow-lifted">
      <GripIcon width={14} height={14} className="shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{name}</p>
        <p className="figures text-xs text-fg-muted">{detail}</p>
      </div>
    </div>
  )
}

import { GripIcon } from '../../../components/ui/Icons'
import type { DragData } from '../dnd'
import { formatAmount } from '../lib/format'

/** The floating "ghost" that follows the pointer: a part slip that tilts and lifts as it is picked up. */
export function DragPreview({ drag }: { drag: DragData }) {
  const name = drag.type === 'catalog' ? drag.template.name : drag.product.name
  const detail =
    drag.type === 'catalog'
      ? `1 × ${formatAmount(drag.template.unitPrice)} EGP`
      : `${drag.product.quantity} × ${formatAmount(drag.product.unitPrice)} EGP`

  return (
    <div className="flex w-60 cursor-grabbing items-center gap-2 border-[1.5px] border-ink-950 bg-white px-2.5 py-2 motion-safe:animate-lift motion-reduce:shadow-lg">
      <GripIcon width={14} height={14} className="shrink-0 text-cobalt-600" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-950">{name}</p>
        <p className="figures text-xs text-ink-600">{detail}</p>
      </div>
    </div>
  )
}

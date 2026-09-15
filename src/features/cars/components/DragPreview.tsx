import { GripIcon } from '../../../components/ui/Icons'
import type { DragData } from '../dnd'
import { formatCurrency } from '../lib/format'

/** The floating "ghost" that follows the pointer: tilts and lifts as it is picked up. */
export function DragPreview({ drag }: { drag: DragData }) {
  const name = drag.type === 'catalog' ? drag.template.name : drag.product.name
  const detail =
    drag.type === 'catalog'
      ? `1 × ${formatCurrency(drag.template.unitPrice)}`
      : `${drag.product.quantity} × ${formatCurrency(drag.product.unitPrice)}`

  return (
    <div className="flex w-56 cursor-grabbing items-center gap-2 rounded-lg border border-brand-500 bg-white px-2.5 py-2 motion-safe:animate-lift motion-reduce:shadow-xl">
      <GripIcon width={16} height={16} className="shrink-0 text-brand-500" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{name}</p>
        <p className="text-xs tabular-nums text-slate-500">{detail}</p>
      </div>
    </div>
  )
}

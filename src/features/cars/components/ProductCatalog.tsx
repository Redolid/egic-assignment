import { useDraggable } from '@dnd-kit/core'
import { GripIcon } from '../../../components/ui/Icons'
import { catalogDragId } from '../dnd'
import type { DragData } from '../dnd'
import { formatAmount } from '../lib/format'
import type { ProductTemplate } from '../types'

function CatalogItem({ template }: { template: ProductTemplate }) {
  const dragData: DragData = { type: 'catalog', template }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: catalogDragId(template.id),
    data: dragData,
  })

  return (
    <li className="shrink-0 snap-start lg:border-b lg:border-ink-200">
      <button
        ref={setNodeRef}
        type="button"
        aria-label={`Drag ${template.name} onto a vehicle`}
        className={`group flex w-56 cursor-grab touch-manipulation select-none items-center gap-2 border border-ink-200 bg-white px-2 py-2.5 text-left transition-colors duration-150 [-webkit-touch-callout:none] hover:border-ink-950 hover:bg-ink-950 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt-600 active:cursor-grabbing lg:w-full lg:border-0 ${
          isDragging ? 'opacity-35' : ''
        }`}
        {...attributes}
        {...listeners}
      >
        <GripIcon width={14} height={14} className="shrink-0 text-ink-300 group-hover:text-ink-400" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{template.name}</span>
        <span className="figures text-[0.8125rem] text-ink-600 group-hover:text-ink-200">{formatAmount(template.unitPrice)}</span>
      </button>
    </li>
  )
}

interface ProductCatalogProps {
  templates: ProductTemplate[]
}

/** Draggable parts list: a horizontal strip on mobile, a sticky ruled list beside the vehicles on desktop. */
export function ProductCatalog({ templates }: ProductCatalogProps) {
  return (
    <section aria-labelledby="catalog-heading" className="lg:sticky lg:top-36">
      <div className="flex items-baseline justify-between border-b-2 border-ink-950 pb-2">
        <h2 id="catalog-heading" className="sheet-title text-xl text-ink-950">
          Parts list
        </h2>
        <span className="spec-label">EGP</span>
      </div>
      <p className="mt-2 text-xs text-ink-600">
        <span className="pointer-coarse:hidden">Drag a part onto a vehicle. The same part at the same price adds 1 to its quantity.</span>
        <span className="hidden pointer-coarse:inline">Press and hold a part, then drag it onto a vehicle.</span>
      </p>
      <ul className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:mt-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {templates.map((template) => (
          <CatalogItem key={template.id} template={template} />
        ))}
      </ul>
    </section>
  )
}

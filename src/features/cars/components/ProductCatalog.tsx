import { useDraggable } from '@dnd-kit/core'
import { SectionTitle } from '../../../components/layout/SectionTitle'
import { GripIcon, TagIcon } from '../../../components/ui/Icons'
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
    <li className="shrink-0 snap-start">
      <button
        ref={setNodeRef}
        type="button"
        aria-label={`Drag ${template.name} onto a vehicle`}
        className={`group flex w-56 cursor-grab touch-manipulation select-none items-center gap-2.5 rounded-[var(--radius-fitting)] border border-line bg-surface px-2.5 py-2.5 text-left transition-[background-color,border-color,box-shadow,translate] duration-200 [-webkit-touch-callout:none] hover:-translate-y-px hover:border-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent active:cursor-grabbing lg:w-full lg:border-transparent lg:bg-transparent lg:hover:border-accent ${
          isDragging ? 'opacity-35' : ''
        }`}
        {...attributes}
        {...listeners}
      >
        <GripIcon width={14} height={14} className="shrink-0 text-fg-subtle group-hover:text-accent-strong" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg lg:whitespace-normal">{template.name}</span>
        <span className="figures text-[0.8125rem] text-fg-muted group-hover:text-accent-strong">{formatAmount(template.unitPrice)}</span>
      </button>
    </li>
  )
}

interface ProductCatalogProps {
  templates: ProductTemplate[]
}

/** Draggable parts list: a horizontal strip on mobile, a sticky panel beside the vehicles on desktop. */
export function ProductCatalog({ templates }: ProductCatalogProps) {
  return (
    <section aria-labelledby="catalog-heading" className="panel p-4 lg:sticky lg:top-28">
      <SectionTitle id="catalog-heading" icon={<TagIcon width={16} height={16} />} aside={<span className="label">EGP</span>}>
        Parts list
      </SectionTitle>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        <span className="pointer-coarse:hidden">Drag a part onto a vehicle. The same part at the same price adds 1 to its quantity.</span>
        <span className="hidden pointer-coarse:inline">Press and hold a part, then drag it onto a vehicle.</span>
      </p>
      <ul className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
        {templates.map((template) => (
          <CatalogItem key={template.id} template={template} />
        ))}
      </ul>
    </section>
  )
}

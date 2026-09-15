import { useDraggable } from '@dnd-kit/core'
import { GripIcon, PackageIcon } from '../../../components/ui/Icons'
import { catalogDragId } from '../dnd'
import type { DragData } from '../dnd'
import { formatCurrency } from '../lib/format'
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
        aria-label={`Drag ${template.name} onto a car`}
        className={`flex w-52 cursor-grab touch-manipulation select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left shadow-xs transition [-webkit-touch-callout:none] hover:border-brand-500 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-brand-500 active:cursor-grabbing lg:w-full ${
          isDragging ? 'opacity-40' : ''
        }`}
        {...attributes}
        {...listeners}
      >
        <GripIcon width={16} height={16} className="shrink-0 text-slate-300" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">{template.name}</span>
          <span className="block text-xs tabular-nums text-slate-500">
            {formatCurrency(template.unitPrice)}
          </span>
        </span>
      </button>
    </li>
  )
}

interface ProductCatalogProps {
  templates: ProductTemplate[]
}

/** Draggable product templates: horizontal strip on mobile, sticky sidebar on desktop. */
export function ProductCatalog({ templates }: ProductCatalogProps) {
  return (
    <section
      aria-labelledby="catalog-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24"
    >
      <div className="flex items-center gap-2">
        <PackageIcon width={18} height={18} className="text-brand-600" />
        <h2 id="catalog-heading" className="font-semibold text-slate-900">
          Product catalog
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        <span className="pointer-coarse:hidden">Drag a product onto a car to add it.</span>
        <span className="hidden pointer-coarse:inline">Press and hold a product, then drag it onto a car.</span>
      </p>
      <ul className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {templates.map((template) => (
          <CatalogItem key={template.id} template={template} />
        ))}
      </ul>
    </section>
  )
}

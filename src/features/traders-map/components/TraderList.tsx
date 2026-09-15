import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { MapPinIcon } from '../../../components/ui/Icons'
import type { Trader } from '../lib/traders'

interface TraderListProps {
  traders: Trader[]
  selectedId: number | null
  hoveredId: number | null
  onSelect: (id: number) => void
  onHover: (id: number | null) => void
}

export function TraderList({ traders, selectedId, hoveredId, onSelect, onHover }: TraderListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const indicatorRef = useRef<HTMLLIElement>(null)
  const itemRefs = useRef(new Map<number, HTMLLIElement>())
  const wasVisible = useRef(false)

  /**
   * One selection highlight that travels between items, so a selection made on the map is
   * followed through the list instead of blinking from one row to another.
   */
  const placeIndicator = useCallback(() => {
    const indicator = indicatorRef.current
    const item = selectedId === null ? undefined : itemRefs.current.get(selectedId)
    if (!indicator) return

    if (!item) {
      indicator.style.opacity = '0'
      wasVisible.current = false
      return
    }
    if (!wasVisible.current) {
      // First appearance: place it without travelling from a stale position.
      indicator.style.transition = 'none'
      indicator.style.transform = `translateY(${item.offsetTop}px)`
      indicator.style.height = `${item.offsetHeight}px`
      void indicator.offsetHeight
      indicator.style.transition = ''
    }
    indicator.style.transform = `translateY(${item.offsetTop}px)`
    indicator.style.height = `${item.offsetHeight}px`
    indicator.style.opacity = '1'
    wasVisible.current = true
  }, [selectedId])

  useLayoutEffect(placeIndicator, [placeIndicator])

  useEffect(() => {
    window.addEventListener('resize', placeIndicator)
    return () => window.removeEventListener('resize', placeIndicator)
  }, [placeIndicator])

  // Map → list: bring the selected item into view. Only the list's own scroll area moves
  // (scrollIntoView would also scroll the page and pull the map out of view on mobile).
  useEffect(() => {
    const list = listRef.current
    const item = selectedId === null ? undefined : itemRefs.current.get(selectedId)
    if (!list || !item || list.scrollHeight <= list.clientHeight) return

    const itemTop = item.offsetTop
    const itemBottom = itemTop + item.offsetHeight
    if (itemTop < list.scrollTop || itemBottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: itemTop - list.clientHeight / 2 + item.offsetHeight / 2, behavior: 'smooth' })
    }
  }, [selectedId])

  return (
    <ul ref={listRef} className="relative flex flex-col gap-1 overflow-y-auto p-2 lg:h-full" onMouseLeave={() => onHover(null)}>
      <li
        ref={indicatorRef}
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none absolute inset-x-2 top-0 rounded-xl bg-brand-50 opacity-0 ring-1 ring-brand-200 transition-[transform,height,opacity] duration-[380ms] ease-[var(--ease-out)] motion-reduce:transition-opacity"
      />
      {traders.map((trader) => {
        const isSelected = trader.id === selectedId
        const isHovered = trader.id === hoveredId && !isSelected
        return (
          <li
            key={trader.id}
            className="relative"
            ref={(element) => {
              if (element) itemRefs.current.set(trader.id, element)
              else itemRefs.current.delete(trader.id)
            }}
          >
            <button
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelect(trader.id)}
              onMouseEnter={() => onHover(trader.id)}
              onFocus={() => onHover(trader.id)}
              onBlur={() => onHover(null)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand-500 ${
                isHovered ? 'bg-slate-100/80' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-300 ease-[var(--ease-out)] ${
                  isSelected
                    ? 'scale-110 bg-signal-500 text-white'
                    : isHovered
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                <MapPinIcon width={16} height={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span dir="rtl" className={`block truncate text-right font-medium ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                  {trader.name}
                </span>
                <span className="block text-xs tabular-nums text-slate-500">
                  Code {trader.id} · {trader.lat.toFixed(4)}, {trader.lng.toFixed(4)}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

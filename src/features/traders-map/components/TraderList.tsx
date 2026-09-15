import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { Trader } from '../lib/traders'

interface TraderListProps {
  traders: Trader[]
  selectedId: number | null
  hoveredId: number | null
  onSelect: (id: number) => void
  onHover: (id: number | null) => void
}

/** The trader register: numbered like the map balloons, one travelling selection band. */
export function TraderList({ traders, selectedId, hoveredId, onSelect, onHover }: TraderListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const indicatorRef = useRef<HTMLLIElement>(null)
  const itemRefs = useRef(new Map<number, HTMLLIElement>())
  const wasVisible = useRef(false)

  /**
   * One selection band that travels between rows, so a selection made on the map is followed
   * through the list instead of blinking from one row to another.
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

  // Map → list: bring the selected row into view. Only the list's own scroll area moves
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
    <ul ref={listRef} className="relative overflow-y-auto lg:h-full" onMouseLeave={() => onHover(null)}>
      <li
        ref={indicatorRef}
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none absolute inset-x-0 top-0 bg-cobalt-50 opacity-0 shadow-[inset_0_0_0_1.5px_var(--color-cobalt-600)] transition-[transform,height,opacity] duration-[360ms] ease-[var(--ease-out)] motion-reduce:transition-opacity"
      />
      {traders.map((trader, index) => {
        const isSelected = trader.id === selectedId
        const isHovered = trader.id === hoveredId && !isSelected
        return (
          <li
            key={trader.id}
            className="relative border-b border-ink-200"
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
              className={`grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt-600 ${
                isHovered ? 'bg-ink-50' : ''
              }`}
            >
              <span
                className={`balloon transition-colors duration-200 ${
                  isSelected ? '!border-cobalt-600 !bg-cobalt-600 text-white' : isHovered ? 'text-cobalt-600' : 'text-ink-950'
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span dir="rtl" lang="ar" className="block truncate text-right text-[0.9375rem] font-semibold text-ink-950">
                  {trader.name}
                </span>
                <span className="figures mt-0.5 flex justify-between gap-2 text-xs text-ink-600">
                  <span>Trader {trader.id}</span>
                  <span>
                    {trader.lat.toFixed(4)}, {trader.lng.toFixed(4)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

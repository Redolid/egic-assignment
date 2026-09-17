import { Suspense, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { EgicMark } from '../graphics/Illustrations'
import { CarIcon, IdCardIcon, MapPinIcon, MoonIcon, SunIcon } from '../ui/Icons'
import { NAV_ITEMS } from '../../routes'
import type { ToolId } from '../../routes'
import { initialTheme, switchTheme } from '../../lib/theme'
import type { Theme } from '../../lib/theme'

const TOOL_ICONS: Record<ToolId, typeof CarIcon> = { pricing: CarIcon, id: IdCardIcon, traders: MapPinIcon }

const navIndex = (pathname: string) => NAV_ITEMS.findIndex((item) => pathname.startsWith(item.to))

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => switchTheme(next, buttonRef.current, () => setTheme(next))}
      className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface text-fg-muted shadow-panel transition-[color,border-color,scale] duration-200 hover:border-line-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
    >
      <SunIcon
        width={18}
        height={18}
        className={`absolute transition-[rotate,scale,opacity] duration-500 ease-[var(--ease-out)] ${
          theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
        }`}
      />
      <MoonIcon
        width={18}
        height={18}
        className={`absolute transition-[rotate,scale,opacity] duration-500 ease-[var(--ease-out)] ${
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'
        }`}
      />
    </button>
  )
}

/**
 * The navigation is a pipeline: three valve tabs on one pipe, with water running from the first
 * valve to the active one. Switching tools moves the water and the page together.
 */
function Pipeline({ current, onNavigate }: { current: number; onNavigate: (event: MouseEvent<HTMLAnchorElement>, index: number) => void }) {
  const listRef = useRef<HTMLUListElement>(null)
  const valveRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [geometry, setGeometry] = useState({ start: 0, span: 0, fill: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const list = listRef.current
      const valves = valveRefs.current
      if (!list || !valves[0] || !valves[valves.length - 1]) return
      const origin = list.getBoundingClientRect().left
      const centre = (el: HTMLSpanElement | null) => (el ? el.getBoundingClientRect().left + el.offsetWidth / 2 - origin : 0)
      const start = centre(valves[0])
      const end = centre(valves[valves.length - 1])
      setGeometry({ start, span: end - start, fill: Math.max(0, centre(valves[Math.max(0, current)]) - start) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (listRef.current) observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [current])

  return (
    <nav aria-label="Tools" className="w-full">
      <ul ref={listRef} className="relative grid grid-cols-3">
        {/* The pipe and its water sit behind the valves, through their centres. */}
        <li aria-hidden="true" className="pointer-events-none absolute top-5 h-2.5 -translate-y-1/2" style={{ left: geometry.start, width: geometry.span }}>
          <span className="pipe absolute inset-0" />
          <span
            className="pipe-water absolute inset-y-0 left-0 motion-safe:animate-flow transition-[width] duration-700 ease-[var(--ease-out)]"
            style={{ width: geometry.fill }}
          />
        </li>
        {NAV_ITEMS.map((item, index) => {
          const Icon = TOOL_ICONS[item.tool]
          return (
            <li key={item.to} className="relative flex justify-center">
              <NavLink
                to={item.to}
                onClick={(event) => onNavigate(event, index)}
                onPointerEnter={() => item.preload?.()}
                onFocus={() => item.preload?.()}
                className="group flex flex-col items-center gap-1.5 rounded-[var(--radius-fitting)] px-2 pb-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {({ isActive }) => (
                  <>
                    <span
                      ref={(node) => {
                        valveRefs.current[index] = node
                      }}
                      style={{ '--tool': `var(--pipe-${['green', 'blue', 'orange'][index]})` } as CSSProperties}
                      className={`relative grid h-10 w-10 place-items-center rounded-full border-2 transition-[background-color,border-color,color,scale] duration-300 ease-[var(--ease-out)] ${
                        isActive
                          ? 'scale-110 border-[var(--tool)] bg-[var(--tool)] text-on-accent shadow-panel'
                          : 'border-line-strong bg-surface text-fg-muted group-hover:border-[var(--tool)] group-hover:text-[var(--tool)]'
                      }`}
                    >
                      <Icon width={18} height={18} />
                    </span>
                    <span className={`whitespace-nowrap text-xs font-medium transition-colors sm:text-[0.8125rem] ${isActive ? 'text-fg' : 'text-fg-muted group-hover:text-fg'}`}>
                      <span className="md:hidden">{item.short}</span>
                      <span className="hidden md:inline">{item.label}</span>
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const current = Math.max(0, navIndex(location.pathname))

  // The active tool's pipe colour drives every accent on the page.
  useLayoutEffect(() => {
    document.documentElement.dataset.tool = NAV_ITEMS[current].tool
  }, [current])

  /**
   * Navigates inside a View Transition: the old page leaves and the new one arrives from the side of
   * the chosen valve. Browsers without the API (or modified clicks) navigate normally.
   */
  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    const item = NAV_ITEMS[index]
    const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    if (!isPlainClick || !document.startViewTransition || location.pathname === item.to) return

    event.preventDefault()
    document.documentElement.style.setProperty('--nav-direction', String(index >= current ? 1 : -1))
    document.startViewTransition(async () => {
      await item.preload?.().catch(() => undefined) // a failed chunk falls back to Suspense after navigation
      flushSync(() => navigate(item.to))
      window.scrollTo(0, 0)
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="app-header sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md print:hidden">
        <div className="mx-auto grid max-w-[84rem] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:grid-cols-[1fr_minmax(0,34rem)_1fr]">
          <NavLink
            to="/"
            className="col-start-1 row-start-1 flex items-center gap-2.5 justify-self-start rounded-[var(--radius-fitting)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <EgicMark width={34} height={34} className="shrink-0" />
            <span className="leading-tight">
              <span className="block text-[0.95rem] font-semibold tracking-tight text-fg">EGIC</span>
              <span className="block text-[0.6875rem] text-fg-subtle">Operations toolkit</span>
            </span>
          </NavLink>
          <div className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
            <Pipeline current={current} onNavigate={handleNavigate} />
          </div>
          <div className="col-start-2 row-start-1 justify-self-end lg:col-start-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-main mx-auto w-full max-w-[84rem] flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 print:max-w-none print:p-0">
        {/* Only shown if a page chunk is still loading (e.g. deep link or browser back). */}
        <Suspense
          fallback={
            <div role="status" className="flex items-center gap-3 text-sm text-fg-muted">
              <span className="pipe relative h-2 w-28 overflow-hidden">
                <span className="pipe-water absolute inset-y-0 w-1/3 animate-indeterminate" />
              </span>
              Loading…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

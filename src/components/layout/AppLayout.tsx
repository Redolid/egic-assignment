import { Suspense } from 'react'
import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '../../routes'

const navIndex = (pathname: string) => NAV_ITEMS.findIndex((item) => pathname.startsWith(item.to))

const today = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const current = Math.max(0, navIndex(location.pathname))

  /**
   * Navigates inside a View Transition: the old sheet leaves and the new one enters from the side of
   * the chosen register tab. Browsers without the API (or modified clicks) navigate normally.
   */
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, to: string, preload?: () => Promise<unknown>) => {
    const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    if (!isPlainClick || !document.startViewTransition || location.pathname === to) return

    event.preventDefault()
    const direction = navIndex(to) >= current ? 1 : -1
    document.documentElement.style.setProperty('--nav-direction', String(direction))

    document.startViewTransition(async () => {
      await preload?.().catch(() => undefined) // a failed chunk falls back to Suspense after navigation
      flushSync(() => navigate(to))
      window.scrollTo(0, 0)
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Title block: company mark and sheet reference on the rule, register tabs below it. */}
      <header className="app-header sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[84rem] items-end justify-between gap-4 px-4 pt-3 sm:px-6">
          <NavLink
            to="/"
            className="group flex items-baseline gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt-600"
          >
            <span className="sheet-title text-[1.9rem] text-ink-950">EGIC</span>
            <span className="hidden border-l border-ink-300 pl-3 text-xs font-medium text-ink-600 sm:inline">
              Operations toolkit
            </span>
          </NavLink>
          <dl className="hidden items-baseline gap-5 pb-1 text-xs text-ink-600 md:flex">
            <div className="flex gap-1.5">
              <dt>Sheet</dt>
              <dd className="figures font-semibold text-ink-900">
                {current + 1} / {NAV_ITEMS.length}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Date</dt>
              <dd className="figures font-semibold text-ink-900">{today}</dd>
            </div>
          </dl>
        </div>

        <nav aria-label="Tools" className="mx-auto mt-2 max-w-[84rem] px-4 sm:px-6">
          <ul className="flex border-b-2 border-ink-950">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.to} className="min-w-0 flex-1 sm:flex-none">
                <NavLink
                  to={item.to}
                  onClick={(event) => handleNavClick(event, item.to, item.preload)}
                  onPointerEnter={() => item.preload?.()}
                  onFocus={() => item.preload?.()}
                  className={({ isActive }) =>
                    `relative -mb-[2px] flex h-11 items-center gap-2.5 border-x border-t px-3 transition-colors duration-200 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-cobalt-600 sm:px-4 ${
                      isActive
                        ? 'border-ink-950 text-white'
                        : 'border-transparent text-ink-700 hover:bg-ink-50 hover:text-ink-950'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Only the active tab carries the fill, so the View Transition moves it across tabs. */}
                      {isActive && (
                        <span aria-hidden="true" className="absolute inset-0 bg-ink-950" style={{ viewTransitionName: 'nav-tab' }} />
                      )}
                      <span
                        className={`balloon relative !h-5 !w-5 !border text-[0.625rem] ${
                          isActive ? '!bg-white text-ink-950' : 'text-ink-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="relative min-w-0 truncate text-sm font-semibold">
                        <span className="lg:hidden">{item.register}</span>
                        <span className="hidden lg:inline">{item.label}</span>
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="app-main mx-auto w-full max-w-[84rem] flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {/* Only shown if a page chunk is still loading (e.g. deep link or browser back). */}
        <Suspense
          fallback={
            <div role="status" className="flex items-center gap-3 text-sm text-ink-600">
              <span className="relative h-0.5 w-24 overflow-hidden bg-ink-200">
                <span className="absolute inset-y-0 w-1/3 animate-indeterminate bg-ink-950" />
              </span>
              Loading sheet…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

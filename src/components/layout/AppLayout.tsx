import { Suspense } from 'react'
import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '../../routes'

const navIndex = (pathname: string) => NAV_ITEMS.findIndex((item) => pathname.startsWith(item.to))

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Navigates inside a View Transition: the old page leaves and the new one enters in the
   * direction of the chosen tab. Browsers without the API (or modified clicks) navigate normally.
   */
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, to: string, preload?: () => Promise<unknown>) => {
    const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    if (!isPlainClick || !document.startViewTransition || location.pathname === to) return

    event.preventDefault()
    const from = navIndex(location.pathname)
    const direction = navIndex(to) >= from ? 1 : -1
    document.documentElement.style.setProperty('--nav-direction', String(direction))

    document.startViewTransition(async () => {
      await preload?.().catch(() => undefined) // a failed chunk falls back to Suspense after navigation
      flushSync(() => navigate(to))
      window.scrollTo(0, 0)
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="app-header sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-brand-600 text-sm font-bold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)]">
              E
            </span>
            EGIC Assignment
          </NavLink>
          <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto p-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(event) => handleNavClick(event, item.to, item.preload)}
                onPointerEnter={() => item.preload?.()}
                onFocus={() => item.preload?.()}
                className={({ isActive }) =>
                  `relative whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand-500 ${
                    isActive ? 'text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Only the active tab carries the pill, so the View Transition morphs it across tabs. */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg bg-brand-50 ring-1 ring-brand-100"
                        style={{ viewTransitionName: 'nav-pill' }}
                      />
                    )}
                    <span className="relative sm:hidden">{item.short}</span>
                    <span className="relative hidden sm:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Only shown if a page chunk is still loading (e.g. deep link or browser back). */}
        <Suspense
          fallback={
            <div role="status" className="flex items-center gap-3 text-sm text-slate-500">
              <span className="relative h-1 w-24 overflow-hidden rounded-full bg-slate-200">
                <span className="absolute inset-y-0 w-1/3 animate-indeterminate rounded-full bg-brand-500" />
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

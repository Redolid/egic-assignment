// oxlint-disable react/only-export-components -- route table module: pages are exported alongside their preloaders
import { lazy, useState } from 'react'
import type { ComponentType } from 'react'

type Page = ComponentType

/**
 * React.lazy that can be preloaded. Once the module has loaded, the page renders directly
 * (no Suspense round-trip), so a page transition can snapshot the real page instead of a
 * "Loading…" fallback.
 */
function lazyWithPreload(load: () => Promise<Page>) {
  let Loaded: Page | null = null
  let pending: Promise<Page> | null = null
  const preload = () => {
    pending ??= load().then((component) => (Loaded = component))
    return pending
  }
  const LazyPage: Page = lazy(() => preload().then((component) => ({ default: component })))

  function PreloadablePage() {
    // Chosen once per mount: switching element types later would remount the page and lose its state.
    // (Wrapped in an object so useState doesn't call the component as an initializer.)
    const [{ Component }] = useState(() => ({ Component: Loaded ?? LazyPage }))
    return <Component />
  }
  return Object.assign(PreloadablePage, { preload })
}

// The OCR and map pages pull in heavy libraries (Leaflet, OCR), so they are split out.
export const NationalIdPage = lazyWithPreload(() =>
  import('./pages/NationalIdPage').then((module) => module.NationalIdPage),
)
export const TradersMapPage = lazyWithPreload(() =>
  import('./pages/TradersMapPage').then((module) => module.TradersMapPage),
)

export type ToolId = 'pricing' | 'id' | 'traders'

/** The pipeline, in order. Order is also the direction pages travel in when switching tools. */
export const NAV_ITEMS: { to: string; tool: ToolId; short: string; label: string; preload?: () => Promise<unknown> }[] = [
  { to: '/cars', tool: 'pricing', short: 'Pricing', label: 'Cars & Products' },
  { to: '/national-id', tool: 'id', short: 'ID check', label: 'National ID Reader', preload: NationalIdPage.preload },
  { to: '/map', tool: 'traders', short: 'Traders', label: 'Traders Map', preload: TradersMapPage.preload },
]

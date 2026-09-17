import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'egic.theme'

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** The saved choice, else the operating system's preference. */
export function initialTheme(): Theme {
  return storedTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function applyInitialTheme() {
  document.documentElement.dataset.theme = initialTheme()
}

/**
 * Switches theme. With View Transitions, the new theme fills the screen outward from the toggle
 * (a tank filling); `commit` runs inside the transition so React state and the DOM change together.
 */
export function switchTheme(next: Theme, origin: HTMLElement | null, commit: () => void) {
  const root = document.documentElement
  const apply = () => {
    root.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
    flushSync(commit)
  }

  if (!document.startViewTransition || !origin) {
    apply()
    return
  }

  const rect = origin.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  root.style.setProperty('--fill-x', `${x}px`)
  root.style.setProperty('--fill-y', `${y}px`)
  root.style.setProperty('--fill-r', `${radius}px`)
  // Reduced motion swaps the fill for a short crossfade (index.css).
  root.setAttribute('data-theme-switching', '')

  const transition = document.startViewTransition(apply)
  transition.finished.finally(() => root.removeAttribute('data-theme-switching'))
}

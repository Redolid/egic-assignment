/** Shared motion vocabulary for imperative (Web Animations API) effects. Mirrors the CSS tokens in index.css. */

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const EASE_IN = 'cubic-bezier(0.55, 0, 1, 0.45)'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Horizontal "no" shake for a rejected input. Skipped when motion is reduced (the red state still shows). */
export function shake(element: Element | null | undefined) {
  if (!element || prefersReducedMotion()) return
  element.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-3px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 320, easing: 'ease-in-out' },
  )
}

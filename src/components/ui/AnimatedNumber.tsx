import { useLayoutEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  className?: string
}

const DURATION = 420

/**
 * A number that counts to its new value (ease-out, interruptible) and briefly takes the brand
 * colour, so a live total visibly responds to the edit that changed it.
 * The visible digits are written imperatively; screen readers get the final value only.
 */
export function AnimatedNumber({ value, format, className = '' }: AnimatedNumberProps) {
  const digitsRef = useRef<HTMLSpanElement>(null)
  const shown = useRef(value)
  const isFirstRun = useRef(true)

  useLayoutEffect(() => {
    const element = digitsRef.current
    if (!element) return

    if (isFirstRun.current) {
      isFirstRun.current = false
      element.textContent = format(value)
      return
    }
    const from = shown.current
    if (from === value) {
      element.textContent = format(value)
      return
    }

    // Flash in the current tool's pipe colour, then settle back.
    const restingColor = getComputedStyle(element).color
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || restingColor
    element.animate([{ color: accent }, { color: restingColor }], { duration: 900, easing: 'ease-out' })

    if (prefersReducedMotion()) {
      shown.current = value
      element.textContent = format(value)
      return
    }

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION)
      const eased = 1 - Math.pow(1 - progress, 4)
      shown.current = progress === 1 ? value : Math.round((from + (value - from) * eased) * 100) / 100
      element.textContent = format(shown.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // Correctness never depends on the animation: if frames are throttled (hidden tab), land on the exact value.
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(frame)
      shown.current = value
      element.textContent = format(value)
    }, DURATION + 120)
    // A newer value interrupts this tween and continues from whatever is on screen.
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settle)
    }
  }, [value, format])

  return (
    <span className={`tabular-nums ${className}`}>
      <span ref={digitsRef} aria-hidden="true" />
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}

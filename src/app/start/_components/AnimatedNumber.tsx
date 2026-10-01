'use client'

import { useEffect, useRef, useState } from 'react'

const fmt = new Intl.NumberFormat('en-US')

/**
 * Tweens between values (expo ease-out, or linear to track a paced reveal). Starts from `from` when given.
 * Visual only; pair with a live region for screen readers.
 */
export function AnimatedNumber({
  value,
  className,
  from,
  duration = 700,
  linear = false,
}: {
  value: number
  className?: string
  from?: number
  duration?: number
  linear?: boolean
}) {
  const [shown, setShown] = useState(from ?? value)
  const current = useRef(from ?? value)

  useEffect(() => {
    const start = current.current
    if (start === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = value
      setShown(value)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = linear || p === 1 ? p : 1 - Math.pow(2, -10 * p)
      const v = Math.round(start + (value - start) * eased)
      current.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, linear])

  return (
    <span className={className} aria-hidden="true">
      {fmt.format(shown)}
    </span>
  )
}

export const formatCount = (n: number) => fmt.format(n)

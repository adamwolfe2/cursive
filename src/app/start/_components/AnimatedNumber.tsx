'use client'

import { useEffect, useRef, useState } from 'react'

const fmt = new Intl.NumberFormat('en-US')

/** Tweens between values with an expo ease-out. Visual only; pair with a live region for screen readers. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    const start = from.current
    if (start === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value
      setShown(value)
      return
    }
    const t0 = performance.now()
    const duration = 700
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      const v = Math.round(start + (value - start) * eased)
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span className={className} aria-hidden="true">
      {fmt.format(shown)}
    </span>
  )
}

export const formatCount = (n: number) => fmt.format(n)

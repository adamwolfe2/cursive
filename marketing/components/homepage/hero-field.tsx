"use client"

import { useEffect, useRef } from "react"

/*
 * The hero's backdrop: flowing Cursive-blue lines that swell and brighten toward the cursor.
 * One 2D canvas behind the content (absolute, so no layout cost). Stops drawing while off screen or the tab is
 * hidden; under prefers-reduced-motion it paints one still frame.
 */

const LINES = 26
const STEP = 18 // px between points along a line
const BLUE = [0, 122, 255] as const

export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let w = 0
    let h = 0
    // Pointer target and the eased position actually drawn; starts off to the upper right so the first frame has shape.
    const target = { x: 0.72, y: 0.35, on: 0 }
    const eased = { x: 0.72, y: 0.35, on: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (t: number) => {
      eased.x += (target.x - eased.x) * 0.06
      eased.y += (target.y - eased.y) * 0.06
      eased.on += (target.on - eased.on) * 0.04
      ctx.clearRect(0, 0, w, h)
      const mx = eased.x * w
      const my = eased.y * h
      const reach = Math.max(180, w * 0.22)
      const pull = 26 + 34 * eased.on

      for (let i = 0; i < LINES; i++) {
        const base = h * (0.06 + (0.9 * i) / (LINES - 1))
        ctx.beginPath()
        let near = 0
        for (let x = -STEP; x <= w + STEP; x += STEP) {
          const wave =
            Math.sin(x * 0.0042 + t * 0.00032 + i * 0.42) * 16 + Math.sin(x * 0.011 - t * 0.00021 + i * 0.9) * 5
          const dx = x - mx
          const dy = base - my
          const g = Math.exp(-(dx * dx + dy * dy) / (2 * reach * reach))
          near = Math.max(near, g)
          // Lines part around the cursor: above it lift, below it sink.
          const y = base + wave + Math.sign(dy || 1) * g * pull
          if (x === -STEP) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        const alpha = 0.1 + 0.42 * near
        ctx.strokeStyle = `rgba(${BLUE[0]},${BLUE[1]},${BLUE[2]},${alpha.toFixed(3)})`
        ctx.lineWidth = 1 + near * 0.8
        ctx.stroke()
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (still) {
      draw(0)
      // Repaint the still frame on resize only.
      const repaint = new ResizeObserver(() => draw(0))
      repaint.observe(canvas)
      return () => {
        ro.disconnect()
        repaint.disconnect()
      }
    }

    let raf = 0
    let visible = true
    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVis)

    // Listen on the section (the canvas sits under the content and takes no pointer events).
    const host = canvas.parentElement ?? canvas
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      target.x = (e.clientX - r.left) / r.width
      target.y = (e.clientY - r.top) / r.height
      target.on = 1
    }
    const onLeave = () => {
      target.on = 0
    }
    host.addEventListener("pointermove", onMove)
    host.addEventListener("pointerleave", onLeave)
    start()

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      host.removeEventListener("pointermove", onMove)
      host.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  // Lines thin out behind the headline and form so the copy always reads first.
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(42%_46%_at_50%_48%,rgb(0_0_0/0.28),#000_100%)]"
    />
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { InlineMarkdown } from './InlineMarkdown'

/**
 * Smooth streaming text reveal — Perplexity-style.
 *
 * The server streams text in bursty chunks (Claude often emits 10-30 chars
 * per SSE event). Naive rendering makes this feel jolty. We hold a buffer
 * and paint it out at a steady reading pace (~120 chars/sec, ~20 wpm of
 * visible reveal), speeding up only when the backlog grows large enough
 * that a user would notice lag.
 *
 * Historic messages render instantly. Only actively-streaming messages
 * animate.
 */
interface StreamingTextProps {
  text: string
  isStreaming?: boolean
}

const BASE_CHARS_PER_SEC = 120
const BACKLOG_SOFT_LIMIT = 180
const BACKLOG_CATCHUP_FRAMES = 5

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const [revealed, setRevealed] = useState(() => (isStreaming ? 0 : text.length))
  const textRef = useRef(text)
  textRef.current = text
  const lastFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!isStreaming) return

    let raf = 0
    lastFrameRef.current = performance.now()

    const tick = (now: number) => {
      const dt = now - lastFrameRef.current
      lastFrameRef.current = now

      setRevealed((prev) => {
        const target = textRef.current.length
        if (prev >= target) {
          // Caught up — idle until more text arrives
          raf = requestAnimationFrame(tick)
          return prev
        }
        const backlog = target - prev
        // Steady reading pace
        let chars = Math.max(1, Math.round((dt * BASE_CHARS_PER_SEC) / 1000))
        // Speed up if we're noticeably behind
        if (backlog > BACKLOG_SOFT_LIMIT) {
          chars = Math.max(
            chars,
            Math.ceil((backlog - BACKLOG_SOFT_LIMIT) / BACKLOG_CATCHUP_FRAMES)
          )
        }
        raf = requestAnimationFrame(tick)
        return Math.min(prev + chars, target)
      })
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [isStreaming])

  // Flush to full when streaming ends
  useEffect(() => {
    if (!isStreaming) setRevealed(text.length)
  }, [isStreaming, text])

  return <InlineMarkdown text={text.slice(0, revealed)} />
}

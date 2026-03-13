'use client'

import { useEffect } from 'react'

export function CrispChat() {
  useEffect(() => {
    let loaded = false

    function loadCrisp() {
      if (loaded) return
      loaded = true

      // Remove interaction listeners once triggered
      events.forEach((ev) => window.removeEventListener(ev, loadCrisp))
      clearTimeout(idleTimer)

      // Bootstrap Crisp and append the script tag
      ;(window as unknown as Record<string, unknown>)['$crisp'] = []
      ;(window as unknown as Record<string, unknown>)['CRISP_WEBSITE_ID'] =
        '74f01aba-2977-4100-92ed-3297d60c6fcb'

      const s = document.createElement('script')
      s.src = 'https://client.crisp.chat/l.js'
      s.async = true
      document.head.appendChild(s)
    }

    // Load on first meaningful user interaction
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown'] as const
    events.forEach((ev) => window.addEventListener(ev, loadCrisp, { once: true, passive: true }))

    // Fallback: load after 5 s of idle regardless
    const idleTimer = setTimeout(loadCrisp, 5000)

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, loadCrisp))
      clearTimeout(idleTimer)
    }
  }, [])

  // Renders nothing — Crisp injects its own widget into the DOM
  return null
}

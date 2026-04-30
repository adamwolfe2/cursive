'use client'
import { useState, useEffect, useCallback } from 'react'

const CAL_LINK = 'https://cal.com/cursiveteam/30min'
const SPOTS_REMAINING = 7 // static for now

export function SuperPixelPopup() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const show = useCallback(() => {
    if (dismissed) return
    // Only show once per session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sp_popup_shown')) return
    setVisible(true)
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('sp_popup_shown', '1')
  }, [dismissed])

  useEffect(() => {
    // 15-second timer trigger
    const timer = setTimeout(show, 15000)

    // Exit intent trigger
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show()
    }
    document.addEventListener('mouseleave', onMouseLeave)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [show])

  const dismiss = () => {
    setVisible(false)
    setDismissed(true)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header bar */}
        <div className="bg-primary px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-white/80 text-xs font-mono">Limited availability</span>
          </div>
          <button onClick={dismiss} className="text-white/60 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6">
          {/* Urgency counter */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-5 flex items-center justify-between">
            <p className="text-amber-900 text-sm font-medium">Free pixel audits this month:</p>
            <span className="text-2xl font-bold text-amber-700">{SPOTS_REMAINING} <span className="text-sm font-normal">spots left</span></span>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
            See the Super Pixel running on your website — free.
          </h3>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            30-minute call. We install it live. You see your first identified visitors before the call ends.
          </p>

          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="block w-full text-center py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Book Your Free Demo →
          </a>

          <p className="text-center text-xs text-gray-400 mt-3">No credit card. No pressure. Just results.</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { AskYourDataPanel } from './AskYourDataPanel'

export function AskYourDataSlideOver() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button — blue, bottom-right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-lg transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Ask your data
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[420px] max-w-[100vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Ask Your Data</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {open && <AskYourDataPanel className="h-full border-0 rounded-none" />}
        </div>
      </div>
    </>
  )
}

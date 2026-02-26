'use client'

import { useState } from 'react'
import { AskYourDataPanel } from './AskYourDataPanel'

export function AskYourDataSlideOver() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-medium shadow-lg transition-colors"
      >
        <span>Ask your data</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setOpen(false)} />
          <div className="w-[480px] max-w-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Ask Your Data</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AskYourDataPanel className="h-full border-0 rounded-none" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

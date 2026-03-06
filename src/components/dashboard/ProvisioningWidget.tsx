'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Users } from 'lucide-react'

interface ProvisioningStep {
  id: string
  label: string
  sublabel?: string
  done: boolean
  href?: string
}

interface ProvisioningWidgetProps {
  steps: ProvisioningStep[]
}

export function ProvisioningWidget({ steps }: ProvisioningWidgetProps) {
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length

  // Dismiss permanently via localStorage once all steps are done
  const handleDismiss = () => {
    try { localStorage.setItem('provisioning_widget_dismissed', 'true') } catch {}
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${
      allDone ? 'border-green-200' : 'border-indigo-100'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {allDone ? 'Setup complete!' : 'Get set up'}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              allDone
                ? 'bg-green-100 text-green-700'
                : 'bg-indigo-50 text-indigo-700'
            }`}>
              {doneCount} of {steps.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                allDone
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        }
      </button>

      {/* Steps */}
      {expanded && (
        <div className="px-5 pb-4 space-y-2.5">
          {steps.map(step => (
            <div key={step.id} className="flex items-start gap-3">
              {step.done
                ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
                : <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" aria-hidden="true" />
              }
              <div className="flex-1 min-w-0">
                {!step.done && step.href ? (
                  <Link href={step.href} className="text-sm text-indigo-700 font-medium hover:text-indigo-800 transition-colors">
                    {step.label}
                  </Link>
                ) : (
                  <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {step.label}
                  </span>
                )}
                {step.sublabel && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.sublabel}</p>
                )}
              </div>
            </div>
          ))}

          {allDone && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">Your workspace is fully set up.</p>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {!allDone && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Invite your team after completing setup</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

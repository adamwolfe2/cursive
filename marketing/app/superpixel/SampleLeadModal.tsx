'use client'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const FULL_PROFILE = [
  { label: 'First Name', value: 'James', verified: true },
  { label: 'Last Name', value: 'Sullivan', verified: true },
  { label: 'Verified Email', value: 'j.sullivan@meridiantech.com', verified: true },
  { label: 'Verified Mobile', value: '+1 (512) 847-2391', verified: true },
  { label: 'Job Title', value: 'VP of Sales', verified: true },
  { label: 'Company', value: 'Meridian Technology Group', verified: true },
  { label: 'Industry', value: 'B2B SaaS', verified: true },
  { label: 'LinkedIn URL', value: 'linkedin.com/in/james-sullivan', verified: true },
  { label: 'Intent Score', value: 'High — 7-day spike detected', verified: true },
  { label: 'Page Visited', value: '/pricing', verified: true },
  { label: 'Visit Time', value: 'Today at 2:14 PM CST', verified: true },
  { label: 'Time on Page', value: '4 min 12 sec', verified: true },
  { label: 'Return Visits', value: '3 visits this week', verified: true },
  { label: 'Device Type', value: 'MacBook Pro · macOS 14', verified: true },
  { label: 'Location', value: 'Austin, TX 78701', verified: true },
  { label: 'Company Size', value: '150–200 employees', verified: true },
  { label: 'Company Revenue', value: '$15M–$25M ARR', verified: true },
  { label: 'DNC Status', value: 'Clean — contactable', verified: true },
  { label: 'Household Income', value: '$150K–$200K', verified: false },
  { label: 'Credit Score Range', value: 'Excellent (750–800)', verified: false },
  { label: 'Social Profiles', value: 'LinkedIn · Twitter', verified: true },
]

export function SampleLeadModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 text-[#007AFF] text-sm font-medium hover:underline flex items-center gap-1 mx-auto"
      >
        See Full Data Profile →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="bg-[#007AFF] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-white font-semibold text-sm">Full Data Profile</p>
                <p className="text-white/70 text-xs">James Sullivan · Meridian Technology Group</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-xl leading-none transition-colors">×</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-xs text-gray-500 mb-4 font-medium">50+ data points per identified visitor. Every field verified against our identity graph.</p>
              <div className="space-y-2">
                {FULL_PROFILE.map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-1.5 border-b border-gray-50">
                    <span className="text-xs text-gray-400 w-36 flex-shrink-0">{row.label}</span>
                    <span className="text-xs text-gray-800 font-medium flex-1">{row.value}</span>
                    <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${row.verified ? 'text-green-500' : 'text-gray-300'}`} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-4">* Sample record — actual fields vary by match quality</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

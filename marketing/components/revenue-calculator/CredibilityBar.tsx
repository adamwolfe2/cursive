const STATS = [
  { label: 'Visitor ID Rate', value: '70%' },
  { label: 'Email Bounce Rate', value: '0.05%' },
  { label: 'Verified Contacts', value: '420M+' },
  { label: 'US Households', value: '98%' },
  { label: 'Daily Intent Signals', value: '60B+' },
  { label: 'Data Refresh', value: '30-Day NCOA' },
]

export function CredibilityBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-8 border-y border-white/10">
      {STATS.map(s => (
        <div key={s.label} className="text-center">
          <div className="text-emerald-400 font-bold text-xl">{s.value}</div>
          <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

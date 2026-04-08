const STATS = [
  { label: 'Pixel Match Rate', value: '40\u201360%' },
  { label: 'Pixel Accuracy', value: '60\u201380%' },
  { label: 'Consumer Profiles', value: '280M+' },
  { label: 'Business Profiles', value: '140M+' },
  { label: 'Email Validation', value: '~20M/day' },
  { label: 'Data Refresh', value: '30-Day NCOA' },
]

export function CredibilityBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-8 border-y border-gray-200">
      {STATS.map(s => (
        <div key={s.label} className="text-center">
          <div className="text-primary font-bold text-xl">{s.value}</div>
          <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

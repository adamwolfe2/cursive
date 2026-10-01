export const STEPS = ['Read your site', 'Approve your buyers', 'Check your inbox', 'Open your list'] as const

/** Where the reader is in the free-leads journey. `current` is the 0-based step being worked on now. */
export function Steps({ current }: { current: number }) {
  return (
    <nav aria-label="Your progress" className="max-w-xl">
      <p className="text-[13px] font-medium text-[#4d5460]">
        Step {current + 1} of {STEPS.length}: <span className="text-[#1d2025]">{STEPS[current]}</span>
      </p>
      <ol className="mt-2.5 grid grid-cols-4 gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === current ? 'step' : undefined} className="min-w-0">
            <span className="block h-1.5 overflow-hidden rounded-full bg-[#e8edf5]">
              {i <= current && (
                <span
                  className={`block h-full rounded-full ${i < current ? 'bg-[#0063E6]' : 'fl-grow bg-[#0063E6]'}`}
                  style={i === current ? { width: '55%', animationDelay: '150ms' } : undefined}
                />
              )}
            </span>
            <span className={`mt-1.5 hidden truncate text-[12px] sm:block ${i <= current ? 'text-[#1d2025]' : 'text-[#6b7280]'}`}>
              {label}
              <span className="sr-only">{i < current ? ' (done)' : i === current ? ' (current)' : ''}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

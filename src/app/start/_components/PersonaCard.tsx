import type { ReactNode } from 'react'
import type { Persona } from '@/lib/free-leads/contract'

/** One real-sounding buyer behind the profile. Plain type, no icons or badges: it should read like a person. */
export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <section aria-labelledby="persona-heading" className="fl-rise rounded-2xl border border-[#e5e7eb] bg-white px-5 py-6 sm:px-10 sm:py-8">
      <h2 id="persona-heading" className="text-sm font-medium text-[#4d5460]">
        The person you are writing to
      </h2>
      <p className="mt-3 max-w-[40ch] text-xl leading-snug tracking-[-0.01em] text-[#1d2025] sm:text-[1.375rem]">
        <span className="font-semibold text-[#111318]">{persona.name}</span>, {persona.role} at {persona.company}
      </p>
      <dl className="mt-6 border-t border-[#e5e7eb]">
        <Row label="A typical week">{persona.day}</Row>
        {persona.measured_on.length > 0 && (
          <Row label="Judged on">
            <ul className="list-disc space-y-1 pl-5 marker:text-[#a0a5b1]">
              {persona.measured_on.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </Row>
        )}
        <Row label="What gets a reply">{persona.replies_when}</Row>
      </dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 border-b border-[#e5e7eb] py-4 last:border-b-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="text-[13px] font-medium text-[#4d5460] sm:pt-0.5">{label}</dt>
      <dd className="max-w-[60ch] text-[15px] leading-relaxed text-[#1d2025]">{children}</dd>
    </div>
  )
}

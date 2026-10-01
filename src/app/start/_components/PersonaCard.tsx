import { CalendarDays, MessageSquareReply, Target, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Persona } from '@/lib/free-leads/contract'

/** One believable buyer behind the profile, met like a person: who she is, her week, what she is judged on, what gets a reply. */
export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <section aria-labelledby="persona-heading" className="fl-rise overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0f1f3] px-5 py-3 sm:px-6">
        <h2 id="persona-heading" className="text-sm font-semibold text-[#1d2025]">
          An example buyer
        </h2>
        <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[12px] font-medium text-[#4d5460]">Illustrative</span>
      </div>
      <div className="flex items-start gap-4 px-5 pt-5 sm:gap-5 sm:px-6 sm:pt-6">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[1.5rem] font-semibold text-[#084fba] ring-4 ring-[#f5f9ff] sm:h-16 sm:w-16 sm:text-[1.75rem]"
          aria-hidden="true"
        >
          {persona.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight tracking-[-0.015em] text-[#111318] sm:text-[1.375rem]">{persona.name}</p>
          <p className="mt-1 text-[15px] leading-snug text-[#3a3f4b]">
            <span className="font-medium text-[#1d2025]">{persona.role}</span> at {persona.company}
          </p>
        </div>
      </div>
      <p className="px-5 pt-3 text-[13px] text-[#6b7280] sm:px-6">
        Made up from your profile to help you picture who you are writing to. Not one of your leads.
      </p>
      <dl className="mt-5 grid border-t border-[#f0f1f3] md:grid-cols-3 md:divide-x md:divide-[#f0f1f3] max-md:divide-y max-md:divide-[#f0f1f3]">
        <Block icon={CalendarDays} label="A typical week">
          {persona.day}
        </Block>
        {persona.measured_on.length > 0 && (
          <Block icon={Target} label="Judged on">
            <ul className="space-y-1.5">
              {persona.measured_on.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-[#0063E6]" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
          </Block>
        )}
        <Block icon={MessageSquareReply} label="What gets a reply">
          {persona.replies_when}
        </Block>
      </dl>
    </section>
  )
}

function Block({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4 sm:px-6 sm:py-5">
      <dt className="flex items-center gap-2 text-[13px] font-semibold text-[#1d2025]">
        <Icon className="h-4 w-4 text-[#0063E6]" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 text-[14px] leading-relaxed text-[#3a3f4b]">{children}</dd>
    </div>
  )
}

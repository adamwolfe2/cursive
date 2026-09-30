import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { devMock } from '../_components/dev-mock'
import { ResendLink } from '../_components/ResendLink'

export const metadata = { title: 'Check your inbox | Cursive' }

const INBOXES = [
  { name: 'Gmail', href: 'https://mail.google.com/mail/u/0/#search/from%3Ameetcursive.com+in%3Aanywhere' },
  { name: 'Outlook', href: 'https://outlook.office.com/mail/' },
]

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[]; mock?: string | string[] }>
}) {
  const params = await searchParams
  const email = typeof params.email === 'string' ? params.email.slice(0, 254) : null

  return (
    <div className="mx-auto w-full max-w-[72rem] px-5 pb-24 pt-14 sm:px-8 sm:pt-24">
      <div className="max-w-xl">
        <h1 className="text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[#111318] sm:text-[3.5rem]">
          Check your inbox.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[#4d5460]">
          We sent a sign-in link to{' '}
          {email ? <strong className="font-semibold text-[#111318] [overflow-wrap:anywhere]">{email}</strong> : 'your work email'}.
          Open it on this device and your 25 leads load right away.
        </p>

        <div className="mt-9 flex flex-col gap-2 sm:flex-row">
          {INBOXES.map((inbox) => (
            <a
              key={inbox.name}
              href={inbox.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-5 text-[15px] font-semibold text-[#1d2025] transition-colors hover:border-[#a0a5b1] hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              Open {inbox.name}
              <ArrowUpRight className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="mt-12 space-y-2 border-t border-[#e5e7eb] pt-6 text-sm text-[#4d5460]">
          <p>Nothing after a minute? Check spam or promotions, then <ResendLink mock={devMock(params.mock)} />.</p>
          <p>
            Wrong address?{' '}
            <Link href="/start" className="font-medium text-[#0063E6] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#0063E6]">
              Start over
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

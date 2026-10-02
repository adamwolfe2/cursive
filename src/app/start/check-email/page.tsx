import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { devMock } from '../_components/dev-mock'
import { InboxPreview } from '../_components/InboxPreview'
import { ResendLink } from '../_components/ResendLink'
import { Steps } from '../_components/Steps'

export const metadata = { title: 'Check your inbox | Cursive' }

const LINK =
  'inline-flex min-h-11 items-center font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

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
    <div className="mx-auto grid w-full max-w-[72rem] gap-14 px-5 pb-24 pt-8 sm:px-8 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-16">
      <div className="max-w-xl">
        <Steps current={2} />
        <h1 className="mt-10 text-[2.5rem] sm:mt-14 sm:text-[3.5rem] font-light leading-[1.05] tracking-[-0.02em] text-[#111827]">
          Check your
          <span className="block text-[#007AFF] pt-0.5">inbox.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[#4b5563]">
          We sent a sign-in link to{' '}
          {email ? <strong className="font-semibold text-[#111827] [overflow-wrap:anywhere]">{email}</strong> : 'your work email'}.
          Open it on this device and your 25 leads load right away.
        </p>

        <div className="mt-9 flex flex-col gap-2 sm:flex-row">
          {INBOXES.map((inbox) => (
            <a
              key={inbox.name}
              href={inbox.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-5 text-[15px] font-semibold text-[#111827] transition-colors hover:border-[#a0a5b1] hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              Open {inbox.name}
              <ArrowUpRight className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="mt-12 border-t border-[#e5e7eb] pt-6 text-sm text-[#4b5563]">
          <p>Nothing after a minute? Check spam or promotions.</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6">
            <Link href="/start" className={LINK}>
              Use a different email
            </Link>
            {/* Last in the row: it may unmount after reading sessionStorage, and nothing sits after it to move. */}
            <ResendLink mock={devMock(params.mock)} />
          </div>
        </div>
      </div>
      <div className="lg:pt-24">
        <InboxPreview />
      </div>
    </div>
  )
}

/**
 * /start/open?t=<token_hash>&c=<claim token>: the emailed link lands here, not on /auth/confirm.
 * Work inboxes run link scanners (Safe Links, Mimecast, Proofpoint) that GET every link in a
 * message; a GET to /auth/confirm would spend the single-use sign-in code before the person
 * clicks. Scanners do not submit forms, so the code is only used by this button's POST.
 */
import { Check } from 'lucide-react'
import { Steps } from '../_components/Steps'

export const metadata = { title: 'Open your 25 leads | Cursive', robots: { index: false, follow: false } }

const PRIMARY =
  'inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#007AFF] px-8 text-[17px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0052bf] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] sm:w-auto'

export default async function OpenLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[]; c?: string | string[] }>
}) {
  const params = await searchParams
  const t = typeof params.t === 'string' ? params.t.slice(0, 200) : ''
  const c = typeof params.c === 'string' ? params.c.slice(0, 200) : ''

  return (
    <div className="mx-auto w-full max-w-[72rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-14">
      <div className="max-w-xl">
        <Steps current={3} />
        <h1 className="mt-10 sm:mt-14 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-[#111827] sm:text-[3.5rem]">
          Your 25 leads
          <span className="block text-[#007AFF] pt-0.5">are ready.</span>
        </h1>
        {t && c ? (
          <>
            <p className="mt-5 text-lg leading-relaxed text-[#4b5563]">
              One tap signs you in and opens them. The link works once.
            </p>
            <form method="post" action="/api/start/open" className="mt-9">
              <input type="hidden" name="t" value={t} />
              <input type="hidden" name="c" value={c} />
              <button type="submit" className={PRIMARY}>
                Open my 25 leads
              </button>
            </form>
            <ul className="mt-10 grid gap-3 border-t border-[#e5e7eb] pt-6 text-[15px] text-[#374151] sm:grid-cols-3">
              {['25 names and titles', 'A work email for each', 'Why each one fits'].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[#0066DD]" aria-hidden="true">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-5 text-lg leading-relaxed text-[#4b5563]">
            This link is incomplete. Request a fresh one at{' '}
            <a href="/start" className="font-semibold text-[#0066DD] underline underline-offset-4">
              /start
            </a>{' '}
            with the same work email.
          </p>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { devMock } from '../_components/dev-mock'
import { LeadsView } from '../_components/LeadsView'

export const dynamic = 'force-dynamic'
// The emailed `c` token rides in the URL; keep it out of Referer headers on outbound links.
export const metadata: Metadata = { title: 'Your 25 leads | Cursive', referrer: 'no-referrer' }

export default async function StartLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ mock?: string | string[]; c?: string | string[] }>
}) {
  const params = await searchParams
  const mock = devMock(params.mock)
  const token = typeof params.c === 'string' && params.c ? params.c.slice(0, 512) : null
  // With a `c` token the API is the judge (401/403 renders the expired-link state); without one, a session is required.
  if (!mock && !token) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) redirect('/start')
  }
  return <LeadsView mock={mock} token={token} />
}

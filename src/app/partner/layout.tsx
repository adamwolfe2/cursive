import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartnerLayoutShell } from './partner-layout-shell'

export const metadata: Metadata = {
  title: 'Partner Dashboard | Cursive',
  description: 'Manage your lead uploads, track earnings, and monitor payouts in the Cursive Partner Portal.',
  openGraph: {
    title: 'Partner Dashboard | Cursive',
    description: 'Manage your lead uploads, track earnings, and monitor payouts.',
    url: 'https://leads.meetcursive.com/partner',
    siteName: 'Cursive',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partner Dashboard | Cursive',
    description: 'Manage your lead uploads, track earnings, and monitor payouts.',
  },
}

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SECURITY: Server-side auth check for partner routes.
  // Middleware handles basic auth, but this verifies the user has partner role.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/partner')
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!userRecord || userRecord.role !== 'partner') {
    redirect('/dashboard')
  }

  return <PartnerLayoutShell>{children}</PartnerLayoutShell>
}

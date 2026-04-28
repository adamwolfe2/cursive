import { ClientPortal, type PortalApprovals } from './ClientPortal'

interface PageProps {
  params: Promise<{ token: string }>
}

type ApprovalStatus = 'pending' | 'approved' | 'changes_requested'

type RawApprovalRow = { status: string; notes: string | null; updated_at: string } | null

function extractApprovalStatus(row: RawApprovalRow): ApprovalStatus | null {
  if (!row) return null
  const s = row.status
  if (s === 'approved' || s === 'pending' || s === 'changes_requested') return s
  return null
}

export default async function TokenPortalPage({ params }: PageProps) {
  const { token } = await params

  // Fetch portal data from API, token is the only auth mechanism.
  // Distinguish failure modes so a transient hiccup doesn't tell a real
  // prospect their valid link has expired.
  let portalData: {
    client: Record<string, unknown>
    approvals: Record<string, RawApprovalRow>
    tokenId: string
  } | null = null
  let failureKind: 'expired' | 'invalid' | 'transient' | null = null

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/portal/${token}`, {
      cache: 'no-store',
    })

    if (res.ok) {
      portalData = await res.json()
    } else if (res.status === 403 || res.status === 410) {
      failureKind = 'expired'
    } else if (res.status === 404) {
      failureKind = 'invalid'
    } else {
      failureKind = 'transient'
    }
  } catch {
    failureKind = 'transient'
  }

  if (!portalData) {
    if (failureKind === 'invalid') return <InvalidLink />
    if (failureKind === 'transient') return <TransientError token={token} />
    return <ExpiredLink />
  }

  // The API returns approvals as { step_type: { status, notes, updated_at } | null }
  // Flatten to the plain-string shape PortalApprovals expects
  const approvals: PortalApprovals = {
    domains: extractApprovalStatus(portalData.approvals.domains),
    copy: extractApprovalStatus(portalData.approvals.copy),
  }

  return (
    <ClientPortal
      client={portalData.client as unknown as Parameters<typeof ClientPortal>[0]['client']}
      approvals={approvals}
      tokenId={portalData.tokenId}
      token={token}
    />
  )
}

function ExpiredLink() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-gray-100 p-5 mb-6">
        <svg
          className="h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">
        This link has expired
      </h1>
      <p className="text-base text-gray-500 max-w-sm mb-8">
        This onboarding link is no longer valid. Please reach out to our team
        and we&apos;ll send you a fresh link.
      </p>
      <a
        href="mailto:support@meetcursive.com"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Contact support@meetcursive.com
      </a>
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-gray-100 p-5 mb-6">
        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">This link is not valid</h1>
      <p className="text-base text-gray-500 max-w-sm mb-8">
        We could not find an onboarding portal for this link. Please double-check the URL or reach out for a fresh one.
      </p>
      <a
        href="mailto:support@meetcursive.com"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Contact support@meetcursive.com
      </a>
    </div>
  )
}

function TransientError({ token }: { token: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-amber-50 p-5 mb-6">
        <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">We had trouble loading your portal</h1>
      <p className="text-base text-gray-500 max-w-sm mb-8">
        This is most likely a temporary hiccup. Try refreshing in a moment, your link is fine.
      </p>
      <a
        href={`/portal/${token}`}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Try again
      </a>
    </div>
  )
}

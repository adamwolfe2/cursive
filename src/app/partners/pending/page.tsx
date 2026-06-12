import Link from 'next/link'
import { Clock } from 'lucide-react'

export const metadata = { title: 'Partner Application | Cursive' }

export default function PartnerPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-primary">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Your partner account isn&apos;t active yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          We couldn&apos;t find an approved partner profile for your account. If you&apos;ve applied,
          your application is under review and you&apos;ll get an email once it&apos;s approved. If you
          haven&apos;t applied yet, you can do that below.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="https://www.meetcursive.com/partners"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            View the partner program
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

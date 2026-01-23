// 404 Not Found Page

import { Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <Search className="h-8 w-8 text-zinc-400" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-zinc-900 mb-2">404</h1>

        <h2 className="text-xl font-semibold text-zinc-900 mb-2">
          Page Not Found
        </h2>

        <p className="text-[14px] text-zinc-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Go to Homepage
          </Link>

          <Link
            href="/dashboard"
            className="text-[13px] text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

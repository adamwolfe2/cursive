import Image from 'next/image'
import { WaitlistForm } from '@/components/marketing/waitlist-form'

export const metadata = {
  title: 'Join the Waitlist | Cursive Leads',
  description: 'Get early access to Cursive Leads - the intelligent lead generation platform for sales teams.',
}

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <Image
              src="/cursive-logo.png"
              alt="Cursive"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-lg font-semibold text-zinc-900">Cursive</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-6 py-12">
        <div className="max-w-sm mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center text-sm text-blue-600 font-medium">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
              Coming Soon
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-semibold text-zinc-900 text-center mb-3">
            Free High-Intent Leads for Your Industry
          </h1>

          {/* Subheadline */}
          <p className="text-sm text-zinc-600 text-center mb-8">
            We deliver verified buyers actively searching for solutions in your vertical. No cost, no contracts.
          </p>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <WaitlistForm source="waitlist-page" />
          </div>

          {/* Footer */}
          <p className="text-xs text-zinc-400 text-center mt-6">
            Questions? hello@meetcursive.com
          </p>
        </div>
      </main>
    </div>
  )
}

import { WaitlistForm } from '@/components/marketing/waitlist-form'

export const metadata = {
  title: 'Join the Waitlist | Cursive Leads',
  description: 'Get early access to Cursive Leads - the intelligent lead generation platform for sales teams.',
}

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-zinc-900">Cursive</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-md mx-auto px-6 py-16">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center text-sm text-blue-600 font-medium">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
            Coming Soon
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-semibold text-zinc-900 text-center mb-4">
          Join the Waitlist
        </h1>

        {/* Subheadline */}
        <p className="text-zinc-600 text-center mb-10">
          Be the first to access Cursive Leads when we launch. We help sales teams discover high-intent prospects automatically.
        </p>

        {/* Form */}
        <WaitlistForm source="waitlist-page" />

        {/* Footer note */}
        <p className="text-xs text-zinc-400 text-center mt-8">
          Questions? Contact us at hello@meetcursive.com
        </p>
      </main>
    </div>
  )
}

import Image from 'next/image'
import { WaitlistForm } from '@/components/marketing/waitlist-form'

export const metadata = {
  title: 'Join the Waitlist | Cursive Leads',
  description: 'Get early access to Cursive Leads - the intelligent lead generation platform that helps you find and connect with high-intent buyers.',
}

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Cursive"
            width={48}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Coming Soon
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight mb-6">
            Find High-Intent Leads,{' '}
            <span className="text-emerald-600">Automatically</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
            Cursive Leads uses intent signals and AI to help you discover businesses
            actively searching for solutions like yours. Stop cold outreach.
            Start warm conversations.
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 text-left">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">Intent-Based Discovery</h3>
              <p className="text-sm text-zinc-600">Find companies actively researching solutions in your industry.</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">AI-Powered Outreach</h3>
              <p className="text-sm text-zinc-600">Personalized email sequences that actually get responses.</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">Verified Data</h3>
              <p className="text-sm text-zinc-600">Enriched contact information with real-time verification.</p>
            </div>
          </div>
        </div>

        {/* Signup Form Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-100 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                Get Early Access
              </h2>
              <p className="text-sm text-zinc-600">
                Join the waitlist and be the first to know when we launch.
              </p>
            </div>

            <WaitlistForm source="waitlist-page" />
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-md mx-auto mt-8 text-center">
          <p className="text-sm text-zinc-500">
            Built for sales teams in Solar, HVAC, Insurance, and more.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Cursive. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

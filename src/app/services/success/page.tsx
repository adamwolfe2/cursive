import Link from 'next/link'
import { CheckCircle, ArrowRight, Calendar, Mail } from 'lucide-react'

export const metadata = {
  title: 'Welcome to Cursive | Service Purchase Successful',
  description: 'Your service subscription is being set up.'
}

export default function ServiceSuccessPage({
  searchParams
}: {
  searchParams: { tier?: string; session_id?: string }
}) {
  const tierSlug = searchParams.tier || 'cursive-data'

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center h-20 w-20 bg-green-100 rounded-full mb-8">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">
          Welcome to Cursive!
        </h1>
        <p className="text-xl text-zinc-600 mb-8">
          Your subscription has been successfully created. We're setting everything up for you.
        </p>

        {/* Next Steps Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-8 mb-8 text-left">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            What Happens Next?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">
                  Check Your Email
                </h3>
                <p className="text-sm text-zinc-600">
                  You'll receive a confirmation email with your subscription details and invoice within the next few minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">
                  Onboarding Call
                </h3>
                <p className="text-sm text-zinc-600">
                  Our team will reach out within 24 hours to schedule your onboarding call. We'll discuss your ICP, goals, and get everything set up.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">
                  First Delivery
                </h3>
                <p className="text-sm text-zinc-600">
                  Your first lead list or campaign will be delivered within 5-7 business days after onboarding is complete.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <p className="font-semibold text-zinc-900">
              Questions? We're Here to Help
            </p>
          </div>
          <p className="text-sm text-zinc-600 mb-4">
            If you have any questions or need immediate assistance, reach out to our team.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="mailto:support@meetcursive.com"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              support@meetcursive.com
            </Link>
            <span className="text-zinc-400">•</span>
            <Link
              href="/contact"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium rounded-lg transition-colors"
          >
            View All Services
          </Link>
        </div>

        {/* Fine Print */}
        <p className="text-xs text-zinc-500 mt-12">
          You can manage your subscription, update billing details, or cancel anytime from your account settings.
        </p>
      </div>
    </div>
  )
}

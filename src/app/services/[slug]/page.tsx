import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Sparkles, Calendar, CreditCard, X } from 'lucide-react'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { CheckoutButton } from '@/components/services/CheckoutButton'

interface ServiceTierPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ServiceTierPageProps) {
  const tier = await serviceTierRepository.getTierBySlug(params.slug)

  if (!tier) {
    return {
      title: 'Service Not Found | Cursive'
    }
  }

  return {
    title: `${tier.name} | Cursive Services`,
    description: tier.description
  }
}

export default async function ServiceTierPage({ params }: ServiceTierPageProps) {
  const tier = await serviceTierRepository.getTierBySlug(params.slug)

  if (!tier) {
    notFound()
  }

  const features = (tier.features as string[]) || []
  const deliverables = (tier.deliverables as string[]) || []

  const formattedPriceMin = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(tier.monthly_price_min)

  const formattedPriceMax = tier.monthly_price_max
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(tier.monthly_price_max)
    : null

  const formattedSetupFee = tier.setup_fee
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(tier.setup_fee)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Hero Section */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to all services
            </Link>

            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4">
              {tier.name}
            </h1>
            <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
              {tier.description}
            </p>

            {/* Pricing */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-8 mb-8 max-w-md mx-auto">
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-5xl font-bold text-zinc-900">
                  {formattedPriceMin}
                </span>
                {formattedPriceMax && (
                  <>
                    <span className="text-3xl text-zinc-500">-</span>
                    <span className="text-5xl font-bold text-zinc-900">
                      {formattedPriceMax}
                    </span>
                  </>
                )}
                <span className="text-zinc-500 text-2xl">/mo</span>
              </div>
              {formattedSetupFee && (
                <p className="text-sm text-zinc-500 mb-4">
                  + {formattedSetupFee} one-time setup fee
                </p>
              )}

              {tier.qualification_required ? (
                <Link
                  href="/services/contact"
                  className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Contact Sales
                </Link>
              ) : (
                <CheckoutButton tierSlug={tier.slug} />
              )}
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-zinc-600">
              {tier.onboarding_required && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Onboarding included</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">
          What You Get
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-white rounded-lg border border-zinc-200 p-4"
            >
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-zinc-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 mb-12">
            <h3 className="text-2xl font-bold text-zinc-900 mb-4">
              Monthly Deliverables
            </h3>
            <ul className="space-y-3">
              {deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-zinc-900 mb-12 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                {tier.qualification_required ? 'Schedule Call' : 'Purchase'}
              </h3>
              <p className="text-sm text-zinc-600">
                {tier.qualification_required
                  ? 'Book a consultation to discuss your needs'
                  : 'Select your plan and complete checkout'}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Onboarding
              </h3>
              <p className="text-sm text-zinc-600">
                We learn your ICP, messaging, and goals
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Execution
              </h3>
              <p className="text-sm text-zinc-600">
                We build and deliver your lead generation engine
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
                4
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Results
              </h3>
              <p className="text-sm text-zinc-600">
                Get qualified leads and pipeline flowing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-2">
              How long does onboarding take?
            </h3>
            <p className="text-zinc-600 text-sm">
              {tier.onboarding_required
                ? 'Onboarding typically takes 5-7 business days. We'll schedule a kickoff call to understand your needs and begin delivery within the first week.'
                : 'Get started immediately! Access your account and begin using the platform right away.'}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-zinc-600 text-sm">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-2">
              What if I want to upgrade later?
            </h3>
            <p className="text-zinc-600 text-sm">
              You can upgrade to a higher tier at any time. We'll prorate your current plan and smoothly transition you to the new service level.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-zinc-600 text-sm">
              We offer a 30-day money-back guarantee. If you're not satisfied with the service quality, we'll provide a full refund.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started with {tier.name}?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {tier.qualification_required
              ? 'Schedule a call with our team to discuss your needs.'
              : 'Join companies generating millions in pipeline with Cursive.'}
          </p>
          {tier.qualification_required ? (
            <Link
              href="/services/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-zinc-50 text-blue-600 font-medium rounded-lg transition-colors text-lg"
            >
              Schedule a Call
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <CheckoutButton tierSlug={tier.slug} variant="white" size="large" />
          )}
        </div>
      </div>
    </div>
  )
}

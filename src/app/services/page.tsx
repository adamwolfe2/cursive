import { Suspense } from 'react'
import Link from 'next/link'
import { Package, ArrowRight, CheckCircle, Zap, TrendingUp, Sparkles } from 'lucide-react'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { ServiceTierCard } from '@/components/services/ServiceTierCard'
import { GradientCard } from '@/components/ui/gradient-card'
import { ServicePageTracker } from '@/components/analytics/ServicePageTracker'

export const metadata = {
  title: 'Service Tiers - From DIY to Done-For-You | Cursive',
  description: 'Choose your perfect lead generation service: Cursive Data for custom lead lists ($1k-3k/mo), Cursive Outbound for managed campaigns ($3-5k/mo), or Cursive Pipeline for full-stack growth ($5-10k/mo).',
  keywords: 'lead generation service, done-for-you leads, B2B outreach, email campaigns, sales pipeline',
  openGraph: {
    title: 'Cursive Service Tiers - Scale Your Lead Generation',
    description: 'From DIY lead lists to full-service growth partnership. Choose the tier that matches your needs.',
    type: 'website',
    url: 'https://leads.meetcursive.com/services',
    images: [
      {
        url: 'https://leads.meetcursive.com/og-services.png',
        width: 1200,
        height: 630,
        alt: 'Cursive Service Tiers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursive Service Tiers - Scale Your Lead Generation',
    description: 'From DIY lead lists to full-service growth partnership.',
    images: ['https://leads.meetcursive.com/og-services.png'],
  },
}

async function getServiceTiers() {
  try {
    const tiers = await serviceTierRepository.getAllPublicTiers()
    return tiers
  } catch (error) {
    console.error('Error fetching service tiers:', error)
    return []
  }
}

export default async function ServicesPage() {
  const tiers = await getServiceTiers()

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <ServicePageTracker page="hub" />
      {/* Hero Section */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Package className="h-4 w-4" />
              Service Tiers
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-6">
              Your Complete Lead Generation Engine
            </h1>
            <p className="text-xl text-zinc-600 mb-8">
              From DIY lead lists to full-service growth partnership.
              Cursive scales with you at every stage.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="#tiers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Explore Services
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#comparison"
                className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium rounded-lg transition-colors"
              >
                Compare Plans
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Start Fast</h3>
            <p className="text-zinc-600">
              Get your first leads within days. No complex setup or learning curve.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 bg-green-100 text-green-600 rounded-lg mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Scale Effortlessly</h3>
            <p className="text-zinc-600">
              Upgrade as you grow. Each tier builds on the last with seamless transitions.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Proven Results</h3>
            <p className="text-zinc-600">
              Join companies generating millions in pipeline with Cursive services.
            </p>
          </div>
        </div>
      </div>

      {/* Service Tiers */}
      <div id="tiers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            Choose Your Growth Path
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Whether you're just getting started or ready to scale, we have a service tier designed for your stage.
          </p>
        </div>

        {tiers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">No service tiers available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <ServiceTierCard key={tier.id} tier={tier} />
            ))}
          </div>
        )}
      </div>

      {/* Social Proof */}
      <div className="bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Trusted by Growth Teams
            </h2>
            <p className="text-lg text-zinc-600">
              Companies using Cursive to power their lead generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">42%</span>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-600 text-sm mb-2">
                    "Cursive Data gave us 42% more qualified leads than our previous vendor, at half the cost."
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    Sarah Chen, VP Sales @ TechCo
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-green-600">3x</span>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-600 text-sm mb-2">
                    "With Cursive Outbound, we 3x'd our pipeline in 90 days. The AI personalization is incredible."
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    Mike Rodriguez, Founder @ GrowthLabs
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-600">$2M</span>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-600 text-sm mb-2">
                    "Cursive Pipeline helped us generate $2M in pipeline in our first quarter. Game-changing."
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    Jessica Park, CMO @ ScaleUp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div id="comparison" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">
            What's Included
          </h2>
          <p className="text-lg text-zinc-600">
            Compare features across all service tiers
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">
                    Feature
                  </th>
                  {tiers.map((tier) => (
                    <th key={tier.id} className="px-6 py-4 text-center text-sm font-semibold text-zinc-900">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    Monthly lead delivery
                  </td>
                  {tiers.map((tier) => (
                    <td key={tier.id} className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    Email campaigns
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-400">—</td>
                  {tiers.slice(1).map((tier) => (
                    <td key={tier.id} className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    AI SDR & meeting booking
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-400">—</td>
                  <td className="px-6 py-4 text-center text-zinc-400">—</td>
                  {tiers.slice(2).map((tier) => (
                    <td key={tier.id} className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Scale Your Lead Generation?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start with Cursive Data today or schedule a call to discuss custom solutions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={tiers[0] ? `/services/${tiers[0].slug}` : '/services'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 text-blue-600 font-medium rounded-lg transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
            >
              Schedule a Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

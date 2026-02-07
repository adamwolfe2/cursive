'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import type { Database } from '@/types/database.types'
import { trackCTAClick } from '@/lib/analytics/service-tier-events'

type ServiceTier = Database['public']['Tables']['service_tiers']['Row']

interface ServiceTierCardProps {
  tier: ServiceTier
  featured?: boolean
}

export function ServiceTierCard({ tier, featured = false }: ServiceTierCardProps) {
  const features = (tier.features as string[]) || []

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
    <div
      className={`relative bg-white rounded-xl border-2 transition-all hover:shadow-lg ${
        featured
          ? 'border-primary shadow-lg'
          : 'border-zinc-200 hover:border-primary/60'
      }`}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-block px-4 py-1 bg-primary text-white text-sm font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-zinc-900 mb-2">
            {tier.name}
          </h3>
          <p className="text-zinc-600 text-sm mb-4">
            {tier.description}
          </p>

          {/* Pricing */}
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-zinc-900">
                {formattedPriceMin}
              </span>
              {formattedPriceMax && (
                <>
                  <span className="text-2xl text-zinc-500">-</span>
                  <span className="text-4xl font-bold text-zinc-900">
                    {formattedPriceMax}
                  </span>
                </>
              )}
              <span className="text-zinc-500 text-lg">/mo</span>
            </div>
            {formattedSetupFee && (
              <p className="text-sm text-zinc-500 mt-1">
                + {formattedSetupFee} setup fee
              </p>
            )}
          </div>

          {/* CTA Button */}
          {tier.qualification_required ? (
            <Link
              href="/services/contact"
              className="block w-full text-center px-4 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
              onClick={() => trackCTAClick(tier.slug, 'services_hub', 'Contact Sales', {
                tier_name: tier.name,
                tier_price: tier.monthly_price_min
              })}
            >
              Contact Sales
            </Link>
          ) : (
            <Link
              href={`/services/${tier.slug}`}
              className={`block w-full text-center px-4 py-3 font-medium rounded-lg transition-colors ${
                featured
                  ? 'bg-primary hover:bg-primary/90 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
              onClick={() => trackCTAClick(tier.slug, 'services_hub', 'Get Started', {
                tier_name: tier.name,
                tier_price: tier.monthly_price_min
              })}
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-200 mb-6" />

        {/* Features */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-zinc-900 mb-3">
            What's included:
          </p>
          {features.slice(0, 6).map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-600">{feature}</span>
            </div>
          ))}
          {features.length > 6 && (
            <Link
              href={`/services/${tier.slug}`}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/90 font-medium mt-4"
            >
              See all features
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Learn More Link */}
        <Link
          href={`/services/${tier.slug}`}
          className="flex items-center justify-center gap-2 w-full mt-6 text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
        >
          Learn more about {tier.name}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

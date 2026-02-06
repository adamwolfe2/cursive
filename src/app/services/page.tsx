import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { GradientCard } from '@/components/ui/gradient-card'
import { Package, Database, Sparkles, Check } from 'lucide-react'
import Link from 'next/link'

/**
 * Services Hub - Choose your approach
 *
 * Direct checkout links for website integration:
 * - /services/checkout?tier=cursive-data
 * - /services/checkout?tier=cursive-outbound
 * - /services/checkout?tier=cursive-pipeline
 * - /services/checkout?tier=cursive-venture-studio (calendar booking)
 */
export default function ServicesPage() {
  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Choose Your Approach"
        description="From DIY to done-for-you, we've got you covered"
      />

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {/* DIY Platform */}
        <GradientCard variant="subtle" className="flex flex-col">
          <div className="mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">DIY Platform</h3>
            <div className="text-3xl font-bold text-primary mb-2">$2k-5k/mo</div>
            <p className="text-muted-foreground">Use the platform yourself</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">Visitor identification</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">AI Studio for outreach</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">CRM & integrations</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">Marketplace access</span>
            </li>
          </ul>

          <Link
            href="/signup"
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-center"
          >
            Start Free
          </Link>
        </GradientCard>

        {/* Cursive Data - POPULAR */}
        <GradientCard variant="primary" className="flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-4 py-1 rounded-full text-xs font-semibold border-2 border-blue-600">
            MOST POPULAR
          </div>

          <div className="mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Cursive Data</h3>
            <div className="text-3xl font-bold text-white mb-2">$1k/mo</div>
            <p className="text-white/90">We deliver 500+ fresh leads monthly</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
              <span className="text-sm text-white">Custom lead lists</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
              <span className="text-sm text-white">Industry-specific targeting</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
              <span className="text-sm text-white">Verified contact data</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
              <span className="text-sm text-white">Weekly delivery</span>
            </li>
          </ul>

          <Link
            href="/services/onboarding?tier=cursive-data"
            className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition-colors text-center"
          >
            Get Started
          </Link>
        </GradientCard>

        {/* Cursive Outbound */}
        <GradientCard variant="subtle" className="flex flex-col">
          <div className="mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Cursive Outbound</h3>
            <div className="text-3xl font-bold text-primary mb-2">$5k/mo</div>
            <p className="text-muted-foreground">We run campaigns for you</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">Everything in Data</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">Campaign strategy</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">Content creation</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">Meeting booking</span>
            </li>
          </ul>

          <a
            href="https://cal.com/adamwolfe/cursive-ai-audit"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-center"
          >
            Book Call
          </a>
        </GradientCard>
      </div>

      {/* Comparison Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Not sure which is right for you?</h2>
        <GradientCard variant="subtle" className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border-b border-border">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                ?
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Choose DIY if:</h3>
                <p className="text-sm text-muted-foreground">
                  You want full control, have time to set up campaigns, and prefer hands-on management.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border-b border-border">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                ?
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Choose Cursive Data if:</h3>
                <p className="text-sm text-muted-foreground">
                  You need high-quality leads fast but want to manage outreach yourself.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                ?
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Choose Cursive Outbound if:</h3>
                <p className="text-sm text-muted-foreground">
                  You want a completely hands-off solution with dedicated campaign management.
                </p>
              </div>
            </div>
          </div>
        </GradientCard>
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">
          Schedule a call to discuss which approach is best for your business.
        </p>
        <a
          href="https://cal.com/adamwolfe/cursive-ai-audit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Book Strategy Call
        </a>
      </div>
    </PageContainer>
  )
}

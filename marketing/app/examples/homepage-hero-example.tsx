'use client';

/**
 * Example: Homepage Hero CTA A/B Test
 *
 * This demonstrates Test #1 from the priority tests:
 * Testing different CTA copy to increase demo bookings
 */

import { ABTestWrapper, ABTestVariant, trackABTestConversion, useABTest, type TestVariant } from '@/lib/ab-testing';
import { useRouter } from 'next/navigation';

export default function HomepageHeroExample() {
  const router = useRouter();

  const handleCTAClick = (variant: TestVariant) => {
    // Track conversion
    trackABTestConversion('homepage-hero-cta', variant.id, 'cta_clicked');

    // Navigate to demo booking
    router.push('/book-demo');
  };

  return (
    <section className="hero bg-gradient-to-br from-blue-50 to-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-light mb-6">
          Turn Anonymous Website Visitors Into Qualified Leads
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Cursive identifies up to 70% of your website traffic and helps you
          convert them automatically.
        </p>

        {/* A/B Test: CTA Button */}
        <ABTestWrapper
          testId="homepage-hero-cta"
          onVariantAssigned={(variant) => {
            // Variant assignment tracked via ABTestWrapper
          }}
        >
          {(variant) => (
            <button
              onClick={() => handleCTAClick(variant)}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {variant.name}
            </button>
          )}
        </ABTestWrapper>

        <p className="text-sm text-gray-500 mt-4">
          No credit card required • 5-minute setup
        </p>
      </div>
    </section>
  );
}

/**
 * Alternative: Using the hook approach
 */
export function HomepageHeroHookExample() {
  const router = useRouter();
  const { variant, trackConversion } = useABTest('homepage-hero-cta');

  const handleCTAClick = () => {
    trackConversion('cta_clicked');
    router.push('/book-demo');
  };

  return (
    <section className="hero">
      <h1>Turn Anonymous Visitors Into Leads</h1>
      <button onClick={handleCTAClick}>
        {variant?.name || 'Book a Demo'}
      </button>
    </section>
  );
}

/**
 * Alternative: Using variant-specific components
 */
export function HomepageHeroVariantExample() {
  return (
    <section className="hero">
      <h1>Turn Anonymous Visitors Into Leads</h1>

      <ABTestVariant testId="homepage-hero-cta" variantId="control">
        <button className="cta-button">Book a Demo</button>
      </ABTestVariant>

      <ABTestVariant testId="homepage-hero-cta" variantId="variant-b">
        <button className="cta-button">See Cursive in Action</button>
      </ABTestVariant>

      <ABTestVariant testId="homepage-hero-cta" variantId="variant-c">
        <button className="cta-button">Identify Your Website Visitors</button>
      </ABTestVariant>
    </section>
  );
}

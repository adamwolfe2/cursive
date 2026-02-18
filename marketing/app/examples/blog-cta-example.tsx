'use client';

/**
 * Example: Blog CTA Placement A/B Test
 *
 * This demonstrates Test #3 from the priority tests:
 * Testing different CTA placements to increase blog → demo conversions
 */

import {
  useABTest,
  trackABTestMetric,
  useABTestScrollTracking,
} from '@/lib/ab-testing';
import { useEffect, useState } from 'react';

// CTA Component
function BlogCTA({ position }: { position: string }) {
  const { variant, trackConversion } = useABTest('blog-cta-placement');

  const handleCTAClick = () => {
    if (variant) {
      trackConversion(`cta_clicked_${position}`);
      trackABTestMetric('blog-cta-placement', variant.id, `cta_position`, position);
    }
  };

  return (
    <div className="blog-cta bg-blue-50 border-2 border-blue-200 rounded-lg p-6 my-8">
      <h3 className="text-2xl font-medium mb-2">
        Ready to identify your website visitors?
      </h3>
      <p className="text-gray-600 mb-4">
        See how Cursive can help you convert anonymous traffic into qualified leads.
      </p>
      <button
        onClick={handleCTAClick}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Book a Demo
      </button>
    </div>
  );
}

// Inline CTA (smaller, less intrusive)
function InlineCTA({ position }: { position: string }) {
  const { variant, trackConversion } = useABTest('blog-cta-placement');

  return (
    <div className="inline-cta bg-gray-50 border-l-4 border-blue-600 p-4 my-4">
      <p className="text-sm text-gray-700">
        Want to see this in action?{' '}
        <button
          onClick={() => variant && trackConversion(`inline_cta_${position}`)}
          className="text-blue-600 hover:underline font-medium"
        >
          Book a demo →
        </button>
      </p>
    </div>
  );
}

// Blog Post Component
export default function BlogPostExample() {
  const { variant } = useABTest('blog-cta-placement');
  const [paragraphCount, setParagraphCount] = useState(0);

  // Track scroll depth
  useABTestScrollTracking('blog-cta-placement', variant?.id || 'control');

  // Count paragraphs for inline CTA placement
  useEffect(() => {
    const paragraphs = document.querySelectorAll('.blog-content p');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParagraphCount(paragraphs.length);
  }, []);

  // Helper to show CTA based on variant
  const shouldShowMidCTA = variant?.id === 'variant-b' || variant?.id === 'variant-c';
  const shouldShowInlineCTAs = variant?.id === 'variant-c';

  return (
    <article className="blog-post max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-light mb-4">
          How to Convert Anonymous Website Visitors Into Qualified Leads
        </h1>
        <p className="text-gray-600">
          Published on February 4, 2026 • 8 min read
        </p>
      </header>

      <div className="blog-content prose prose-lg">
        <p>
          Every day, thousands of potential customers visit your website. They
          browse your product pages, read your blog posts, and check your
          pricing—then leave without a trace.
        </p>

        <p>
          In fact, 98% of website visitors never fill out a form. That means
          you're flying blind on the vast majority of your traffic.
        </p>

        <h2>The Problem: Anonymous Traffic is Wasted Opportunity</h2>

        <p>
          Traditional analytics tools tell you how many visitors you had, which
          pages they viewed, and how long they stayed. But they don't tell you
          WHO those visitors are.
        </p>

        {/* Inline CTA #1 - After 3 paragraphs */}
        {shouldShowInlineCTAs && <InlineCTA position="after_paragraph_3" />}

        <p>
          Without knowing who's visiting, you can't:
        </p>

        <ul>
          <li>Follow up with interested prospects</li>
          <li>Personalize your outreach</li>
          <li>Prioritize high-value accounts</li>
          <li>Measure true conversion rates</li>
        </ul>

        <h2>The Solution: Visitor Identification</h2>

        <p>
          Visitor identification technology reveals the companies and individuals
          browsing your site—even if they don't fill out a form.
        </p>

        {/* Mid-post CTA - Variant B and C */}
        {shouldShowMidCTA && <BlogCTA position="mid_post" />}

        <p>
          Here's how it works: When someone visits your website, identification
          software matches their IP address, device fingerprint, and browsing
          behavior against a database of 280M profiles.
        </p>

        {/* Inline CTA #2 */}
        {shouldShowInlineCTAs && <InlineCTA position="after_paragraph_7" />}

        <h2>3 Ways to Use Visitor Data</h2>

        <p>
          Once you know who's visiting, you can take action:
        </p>

        <h3>1. Sales Prospecting</h3>
        <p>
          Your sales team can see which companies viewed your pricing page this
          week and reach out while they're still interested.
        </p>

        <h3>2. Retargeting Campaigns</h3>
        <p>
          Launch targeted ad campaigns to visitors who didn't convert, with
          messaging specific to the pages they viewed.
        </p>

        {/* Inline CTA #3 */}
        {shouldShowInlineCTAs && <InlineCTA position="after_paragraph_11" />}

        <h3>3. Lead Scoring</h3>
        <p>
          Automatically score leads based on company fit, page views, and
          engagement level—then route the hottest leads to sales.
        </p>

        <h2>Real Results</h2>

        <p>
          Companies using visitor identification see:
        </p>

        <ul>
          <li><strong>3x more qualified demos</strong> - because sales knows who to call</li>
          <li><strong>40% shorter sales cycles</strong> - by reaching out at the right time</li>
          <li><strong>2x ROI on ad spend</strong> - through better retargeting</li>
        </ul>

        {/* Inline CTA #4 */}
        {shouldShowInlineCTAs && <InlineCTA position="after_paragraph_14" />}

        <h2>Getting Started</h2>

        <p>
          The good news? Setting up visitor identification is easier than you
          think. Most platforms require just a simple pixel installation (takes
          5 minutes) and you'll start seeing identified visitors within 24 hours.
        </p>

        <p>
          The key is choosing a platform that:
        </p>

        <ul>
          <li>Has a large, accurate database (70%+ identification rate)</li>
          <li>Integrates with your CRM and marketing tools</li>
          <li>Includes activation capabilities (not just data)</li>
          <li>Provides real-time identification (not batch processing)</li>
        </ul>

        <p>
          Stop letting 98% of your traffic disappear. Start identifying who's
          visiting and turn anonymous browsers into qualified leads.
        </p>

        {/* Bottom CTA - All variants */}
        <BlogCTA position="bottom" />
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full mr-4"></div>
          <div>
            <p className="font-medium">Marketing Team</p>
            <p className="text-sm text-gray-600">Cursive</p>
          </div>
        </div>
      </footer>
    </article>
  );
}

/**
 * Alternative: Dynamic inline CTA insertion
 */
export function BlogPostDynamicCTAExample({ content }: { content: string }) {
  const { variant, trackConversion } = useABTest('blog-cta-placement');

  // Split content into paragraphs
  const paragraphs = content.split('\n\n');

  // Insert CTAs based on variant
  const shouldShowMidCTA = variant?.id === 'variant-b' || variant?.id === 'variant-c';
  const shouldShowInlineCTAs = variant?.id === 'variant-c';

  return (
    <div className="blog-content">
      {paragraphs.map((paragraph, index) => (
        <div key={index}>
          <p>{paragraph}</p>

          {/* Mid-post CTA at 50% */}
          {shouldShowMidCTA && index === Math.floor(paragraphs.length / 2) && (
            <BlogCTA position={`mid_${index}`} />
          )}

          {/* Inline CTAs every 3-4 paragraphs */}
          {shouldShowInlineCTAs && index > 0 && index % 4 === 0 && (
            <InlineCTA position={`paragraph_${index}`} />
          )}
        </div>
      ))}

      {/* Bottom CTA - always shown */}
      <BlogCTA position="bottom" />
    </div>
  );
}

/**
 * Example Blog Post
 *
 * This demonstrates a complete, production-ready blog post following
 * all AEO best practices and Cursive's brand voice guidelines.
 *
 * To use this template:
 * 1. Copy this structure
 * 2. Replace content with your topic
 * 3. Follow the patterns demonstrated here
 * 4. Reference BLOG_POST_GUIDE.md for detailed instructions
 */

import { BlogPost } from '../lib/blog-utils'

export const exampleBlogPost: BlogPost = {
  // SEO Metadata
  title: 'How to Identify Anonymous Website Visitors in 2026',
  description:
    'Learn how to identify up to 70% of anonymous website visitors with visitor identification technology. Step-by-step guide for B2B companies, complete with tools, best practices, and implementation tips.',

  // Content (HTML)
  content: `
    <h2 id="introduction">Introduction</h2>
    <p>
      Visitor identification reveals which companies are browsing your website—even when they don't fill out a form.
      For B2B companies, this transforms anonymous traffic into actionable sales intelligence, helping you identify
      prospects actively researching your product.
    </p>

    <p>
      In this guide, you'll learn exactly how visitor identification works, why 70% identification rates are achievable,
      and how to implement it in under 5 minutes. By the end, you'll know how to turn your website into an active
      lead generation engine that works 24/7.
    </p>

    <h2 id="what-is-visitor-identification">What is Visitor Identification?</h2>
    <p>
      Visitor identification is the process of matching anonymous website traffic to real companies and individuals.
      Unlike traditional web analytics that show "anonymous user" or a session ID, visitor identification connects
      that traffic to specific businesses, often including company name, size, industry, and key contacts.
    </p>

    <p>
      According to industry research, 98% of B2B website visitors leave without converting. If you're driving 10,000
      visitors per month, only 200 are filling out forms. Visitor identification helps you capture the other 9,800
      prospects who remain anonymous.
    </p>

    <h2 id="how-it-works">How Visitor Identification Works</h2>
    <p>
      Visitor identification combines multiple data sources and techniques to match website traffic to known companies:
    </p>

    <h3 id="ip-address-lookup">IP Address Lookup</h3>
    <p>
      Every website visitor has an IP address. By cross-referencing IP addresses with databases of business IP ranges,
      you can identify which companies are visiting your site. This method works best for larger companies with
      dedicated IP addresses or IP ranges they own.
    </p>

    <p>
      <strong>Accuracy</strong>: High for enterprise companies, lower for small businesses using residential ISPs.
    </p>

    <h3 id="reverse-dns">Reverse DNS Lookup</h3>
    <p>
      Domain Name System (DNS) records reveal the organization associated with an IP address. For example, if a visitor
      comes from an IP with a DNS record pointing to "ibm.com," you know IBM visited your site. This is particularly
      effective for companies that own their IP infrastructure.
    </p>

    <h3 id="behavioral-fingerprinting">Behavioral Fingerprinting</h3>
    <p>
      By tracking patterns like device type, browser, screen resolution, time zone, and browsing behavior, visitor
      identification platforms create unique visitor profiles. These profiles can be matched against databases of
      known companies and their typical browsing patterns.
    </p>

    <h3 id="data-enrichment">Data Enrichment</h3>
    <p>
      Once a company is identified, enrichment services append additional firmographic data:
    </p>

    <ul>
      <li><strong>Company details</strong>: Industry, size, revenue, location</li>
      <li><strong>Technology stack</strong>: What software and tools they use</li>
      <li><strong>Contact information</strong>: Key decision-makers and their emails</li>
      <li><strong>Intent signals</strong>: Topics and keywords they're researching</li>
    </ul>

    <h2 id="identification-rates">What Identification Rates to Expect</h2>
    <p>
      Not all traffic can be identified. Accuracy depends on traffic type and source:
    </p>

    <ul>
      <li><strong>B2B traffic</strong>: 60-70% identification rate (business IP addresses are easier to match)</li>
      <li><strong>B2C traffic</strong>: 15-25% identification rate (residential IPs are harder to identify)</li>
      <li><strong>Mobile traffic</strong>: Lower rates due to carrier IP pooling and shared addresses</li>
      <li><strong>VPN users</strong>: Cannot be reliably identified (VPN masks true IP)</li>
    </ul>

    <p>
      Cursive achieves a 70% identification rate for B2B traffic—among the highest in the industry. This is possible
      through our proprietary combination of IP matching, behavioral analysis, and real-time data enrichment.
    </p>

    <h2 id="implementation-guide">How to Implement Visitor Identification</h2>
    <p>
      Setting up visitor identification is straightforward and typically takes less than 5 minutes:
    </p>

    <h3 id="step-1">Step 1: Install Tracking Pixel</h3>
    <p>
      Add a JavaScript snippet to your website, similar to how you'd install Google Analytics. Most platforms provide
      a one-line script that goes in your site's <code>&lt;head&gt;</code> section.
    </p>

    <p>
      <strong>Example</strong>: For Cursive, you'd add:
    </p>

    <pre><code>&lt;script src="https://track.meetcursive.com/pixel.js" data-site-id="your-site-id"&gt;&lt;/script&gt;</code></pre>

    <h3 id="step-2">Step 2: Configure Tracking Rules</h3>
    <p>
      Decide which pages to track and what data to capture:
    </p>

    <ul>
      <li><strong>Track all pages</strong>: See complete visitor journey</li>
      <li><strong>Track high-intent pages</strong>: Focus on pricing, demo, case studies</li>
      <li><strong>Custom events</strong>: Track button clicks, form starts, video plays</li>
    </ul>

    <h3 id="step-3">Step 3: Connect Your CRM</h3>
    <p>
      Sync identified companies to Salesforce, HubSpot, or your CRM of choice. This ensures your sales team sees
      visitor data alongside existing prospect information.
    </p>

    <p>
      Most platforms offer native integrations that sync automatically without custom development.
    </p>

    <h3 id="step-4">Step 4: Set Up Alerts</h3>
    <p>
      Configure notifications for high-value actions:
    </p>

    <ul>
      <li>Target account visits your site</li>
      <li>Visitor views pricing page 3+ times</li>
      <li>Competitor's customer visits your comparison page</li>
    </ul>

    <h3 id="step-5">Step 5: Build Activation Workflows</h3>
    <p>
      Automatically route hot leads or trigger follow-up campaigns:
    </p>

    <ul>
      <li><strong>Sales automation</strong>: Create tasks for reps when target accounts visit</li>
      <li><strong>Email campaigns</strong>: Send personalized outreach based on pages viewed</li>
      <li><strong>Retargeting ads</strong>: Show LinkedIn or Google ads to identified visitors</li>
    </ul>

    <h2 id="use-cases">Top Use Cases for Visitor Identification</h2>

    <h3 id="sales-prioritization">1. Sales Prioritization</h3>
    <p>
      Instead of cold calling from static lists, your sales team focuses on companies actively showing interest.
    </p>

    <p>
      <strong>Example</strong>: If a target account visits your pricing page three times in one week and downloads
      a case study, that's a strong signal they're evaluating vendors. Your sales team receives an alert and can
      reach out while the company is still in active research mode—dramatically increasing connection rates.
    </p>

    <h3 id="account-based-marketing">2. Account-Based Marketing (ABM)</h3>
    <p>
      Visitor identification is essential for ABM programs. Track which target accounts are engaging with your content,
      personalize their website experience, and coordinate sales and marketing outreach.
    </p>

    <p>
      <strong>Example</strong>: When a target account visits your site, you can dynamically change the homepage hero
      to reference their industry, show relevant case studies, or display personalized messaging.
    </p>

    <h3 id="lead-scoring">3. Enhanced Lead Scoring</h3>
    <p>
      Combine firmographic data (company size, industry, revenue) with behavioral data (pages viewed, time on site,
      return visits) to create more accurate lead scores.
    </p>

    <p>
      A company that matches your ICP <em>and</em> visited your site five times in two weeks scores much higher than
      one that only matches on firmographics.
    </p>

    <h3 id="retargeting">4. Retargeting Campaigns</h3>
    <p>
      Build custom audiences for LinkedIn, Google, or Facebook ads based on specific page visits.
    </p>

    <p>
      <strong>Example</strong>: Retarget companies that viewed your pricing page but didn't request a demo with ads
      highlighting your free trial or customer success stories.
    </p>

    <h2 id="privacy-compliance">Privacy and Compliance</h2>
    <p>
      Visitor identification must comply with privacy regulations:
    </p>

    <ul>
      <li><strong>GDPR (Europe)</strong>: Requires consent for tracking personal data. Company-level identification
      is generally lower risk than individual tracking.</li>
      <li><strong>CCPA (California)</strong>: Allows visitors to opt out of data sale and sharing. You must honor
      opt-out requests within 15 days.</li>
      <li><strong>Consent management</strong>: Use cookie consent banners and respect visitor preferences.</li>
    </ul>

    <p>
      Cursive is fully compliant with GDPR and CCPA, with built-in consent management and automated opt-out handling.
    </p>

    <h2 id="choosing-platform">Choosing a Visitor Identification Platform</h2>
    <p>
      When evaluating visitor identification tools, consider these factors:
    </p>

    <ul>
      <li><strong>Identification accuracy</strong>: What percentage of B2B traffic can they identify? (Look for 60%+)</li>
      <li><strong>Real-time vs. batch processing</strong>: Real-time identification enables immediate action</li>
      <li><strong>Data coverage</strong>: How many companies and contacts are in their database?</li>
      <li><strong>Integrations</strong>: Does it connect to your CRM, marketing automation, and ad platforms?</li>
      <li><strong>Enrichment quality</strong>: What firmographic and contact data is included?</li>
      <li><strong>Activation capabilities</strong>: Can you act on the data (send emails, launch ads, trigger workflows)?</li>
      <li><strong>Pricing model</strong>: Per visitor, per identified company, or flat monthly fee?</li>
    </ul>

    <h2 id="best-practices">Best Practices for Visitor Identification</h2>

    <ul>
      <li><strong>Track the right pages</strong>: Focus on high-intent pages like pricing, product pages, case studies</li>
      <li><strong>Set up alerts strategically</strong>: Too many alerts create noise; focus on target accounts and high-intent behavior</li>
      <li><strong>Combine with other signals</strong>: Use visitor data alongside form fills, email engagement, and intent data</li>
      <li><strong>Respect privacy</strong>: Honor opt-outs, be transparent about tracking, comply with regulations</li>
      <li><strong>Act quickly</strong>: The sooner you reach out after a visit, the higher your connection rate</li>
    </ul>

    <h2 id="common-mistakes">Common Mistakes to Avoid</h2>

    <ol>
      <li><strong>Waiting too long to reach out</strong>: The data is most valuable when it's fresh. If a prospect
      visited yesterday, reach out today.</li>
      <li><strong>Treating all visitors equally</strong>: Prioritize based on fit (ICP match) and intent (pages viewed,
      frequency).</li>
      <li><strong>Only tracking homepage visits</strong>: The real signal is in product pages, pricing, case studies.</li>
      <li><strong>Not connecting to your CRM</strong>: Visitor data is most powerful when integrated with your existing
      sales workflow.</li>
      <li><strong>Ignoring mobile traffic</strong>: Mobile has lower identification rates, but it's still valuable data.</li>
    </ol>

    <h2 id="conclusion">Conclusion</h2>
    <p>
      Visitor identification transforms your website from a passive marketing tool into an active lead generation engine.
      By identifying 60-70% of anonymous traffic, you can prioritize sales outreach, personalize marketing campaigns,
      and improve conversion rates on your existing traffic.
    </p>

    <p>
      The implementation is straightforward—install a tracking pixel, connect your CRM, and start seeing which companies
      are researching your product. With the right platform, you can be up and running in under 5 minutes.
    </p>

    <p>
      Ready to see who's visiting your site? Cursive identifies up to 70% of B2B traffic and syncs directly to your
      CRM, marketing automation, and ad platforms.
    </p>
  `,

  // Post metadata
  category: 'visitor-identification',
  slug: 'how-to-identify-anonymous-website-visitors',

  // Author information
  author: {
    name: 'Sarah Chen',
    role: 'Head of Growth',
    avatar: '/images/authors/sarah-chen.jpg',
    bio: 'Sarah leads growth at Cursive and has helped 200+ B2B companies implement visitor identification strategies that increased their pipeline by an average of 40%.',
    social: {
      twitter: 'https://twitter.com/sarahchen',
      linkedin: 'https://linkedin.com/in/sarahchen',
      website: 'https://sarahchen.com',
    },
  },

  // Dates (ISO 8601 format)
  publishedAt: '2026-02-01T08:00:00Z',
  updatedAt: '2026-02-04T10:00:00Z',

  // Featured image
  image: '/images/blog/visitor-identification-dashboard.jpg',
  imageAlt:
    'Website visitor identification dashboard showing company details, page views, and engagement metrics',

  // Tags for categorization
  tags: [
    'visitor identification',
    'lead generation',
    'B2B marketing',
    'website analytics',
    'sales intelligence',
  ],

  // FAQ section (generates FAQ schema)
  faqs: [
    {
      question: 'How accurate is visitor identification?',
      answer:
        'For B2B traffic, visitor identification typically achieves 60-70% accuracy. Cursive identifies up to 70% of business visitors. The remaining 30% includes residential IPs, VPN users, and mobile carrier traffic that cannot be reliably matched to companies. Accuracy is highest for enterprise companies with dedicated IP addresses.',
    },
    {
      question: 'Is visitor identification legal under GDPR?',
      answer:
        'Yes, when implemented correctly. Company-level identification (revealing which business visited) is generally lower risk than individual tracking. However, you must provide clear privacy policies, obtain consent where required, and honor opt-out requests. Cursive is fully GDPR-compliant with built-in consent management and automated opt-out handling.',
    },
    {
      question: 'How much does visitor identification cost?',
      answer:
        'Pricing varies widely by provider. Some platforms charge per identified visitor (pay-as-you-go), others use monthly subscription models based on traffic volume. Cursive offers flexible pricing starting at $299/month for small businesses, with custom enterprise plans for high-traffic sites. Most platforms include CRM integration and basic enrichment in the base price.',
    },
    {
      question: 'Can visitor identification identify individual people?',
      answer:
        'Visitor identification focuses primarily on company-level data (which business visited). Some platforms can identify individual contacts when they return to your site after previously filling out a form, or through email link tracking. However, identifying unknown individuals at scale raises privacy concerns and is less common. Most platforms provide company details plus key contacts at that company.',
    },
    {
      question: 'How long does it take to implement visitor identification?',
      answer:
        'Implementation is typically very fast. Adding the tracking pixel takes 5-10 minutes (similar to installing Google Analytics). Connecting your CRM and setting up workflows might take 1-2 hours depending on your tech stack. Most companies start seeing identified companies within 24 hours of installation. Cursive provides step-by-step guides and support to help you get set up quickly.',
    },
    {
      question: "What's the difference between visitor identification and website analytics?",
      answer:
        'Traditional analytics (like Google Analytics) shows you aggregate metrics and anonymous user sessions—you know someone visited, but not who they are. Visitor identification reveals which specific companies and sometimes which individuals are visiting. Think of it as adding a name tag to your anonymous traffic. You can see "IBM visited your pricing page 3 times" instead of just "anonymous user viewed /pricing."',
    },
    {
      question: 'Does visitor identification work on mobile traffic?',
      answer:
        'Yes, but with lower accuracy rates. Mobile traffic is harder to identify because mobile carriers use shared IP addresses (many users share the same IP). Desktop traffic from corporate networks has the highest identification rates (70%+), while mobile typically identifies 20-30% of B2B traffic. Despite lower rates, mobile visitor data is still valuable for understanding the full buyer journey.',
    },
    {
      question: 'How do I prevent competitors from seeing my website visitors?',
      answer:
        'Most visitor identification platforms only show you who visits <em>your</em> site—your competitors would need to install their own tracking pixel to see their traffic. However, be aware that if you visit competitor sites, they may identify your company. Use a VPN or residential IP if you want to browse competitor sites anonymously.',
    },
  ],

  // Related posts (slugs to fetch)
  relatedPosts: [
    'intent-data-guide',
    'b2b-lead-generation-strategies',
    'account-based-marketing-guide',
  ],
}

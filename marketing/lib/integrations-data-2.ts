import type { Integration } from './integrations-data'

export const integrationsBatch2: Integration[] = [
  // ============================================================
  // DATA / ENRICHMENT (3 more)
  // ============================================================
  {
    slug: 'zoominfo',
    name: 'ZoomInfo',
    category: 'Data Enrichment',
    logo: '🔍',
    connectionMethod: 'webhook',
    description:
      'ZoomInfo is a leading B2B intelligence platform that provides contact, company, and intent data for sales and marketing teams. It powers prospecting, territory planning, and go-to-market execution at scale.',
    whyCursive:
      'Cursive identifies the companies and people visiting your website, then cross-references that data with ZoomInfo to deliver verified contacts, direct dials, and buying intent signals. Instead of cold outreach, your reps engage warm visitors with ZoomInfo-enriched context.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'ZoomInfo Contacts', description: 'Match anonymous visitors to verified ZoomInfo contact records with direct dials and emails.' },
      { cursiveField: 'Company Profiles', toolField: 'ZoomInfo Company Data', description: 'Enrich visitor company data with firmographics, technographics, and org charts.' },
      { cursiveField: 'Page Visit Intent', toolField: 'ZoomInfo Intent Signals', description: 'Combine on-site behavior with ZoomInfo intent topics to score buying readiness.' },
      { cursiveField: 'Visitor Emails', toolField: 'ZoomInfo Email Verification', description: 'Validate visitor email addresses against ZoomInfo deliverability data.' },
      { cursiveField: 'Visitor Job Titles', toolField: 'ZoomInfo Seniority Data', description: 'Map visitor roles to ZoomInfo seniority levels for accurate lead routing.' },
    ],
    workflows: [
      {
        title: 'Cross-Reference Visitors with ZoomInfo Data',
        description:
          'When Cursive identifies a website visitor, automatically query ZoomInfo for verified contact details, org chart position, and technographic data. Attach the enriched profile to the lead record so reps have full context before the first touch.',
      },
      {
        title: 'Enrich Contacts with Direct Dials',
        description:
          'For every new visitor Cursive identifies, pull ZoomInfo direct dial numbers and verified emails. Push enriched contacts into your CRM or sequencer so SDRs can call within minutes of a high-intent page visit.',
      },
      {
        title: 'Verify Emails Before Outreach',
        description:
          'Before adding Cursive-identified visitors to email sequences, validate their addresses through ZoomInfo deliverability checks. This keeps bounce rates low and sender reputation intact.',
      },
    ],
    setupSteps: [
      'Connect your Cursive account and navigate to the Integrations page.',
      'Generate a ZoomInfo API key from your ZoomInfo admin panel under Integrations > API.',
      'In Cursive, add a new webhook destination and paste the ZoomInfo API endpoint along with your key.',
      'Configure which visitor events trigger enrichment lookups (e.g., new visitor identified, high-intent page view).',
      'Test the connection by visiting your site and confirming enriched data appears in Cursive within a few minutes.',
    ],
    faqs: [
      { question: 'Do I need a ZoomInfo subscription to use this integration?', answer: 'Yes. You need an active ZoomInfo plan that includes API access. Cursive sends visitor data to ZoomInfo for enrichment, which consumes your ZoomInfo credits.' },
      { question: 'How quickly does ZoomInfo enrichment happen?', answer: 'Enrichment typically completes in under 30 seconds after Cursive identifies a visitor. The enriched data is appended to the visitor record and can trigger downstream workflows immediately.' },
      { question: 'Will this integration use up my ZoomInfo credits?', answer: 'Each enrichment lookup counts against your ZoomInfo credit allocation. You can set filters in Cursive to only enrich visitors that meet certain criteria (e.g., company size, pages visited) to manage credit usage.' },
      { question: 'Can I enrich only visitors from specific companies?', answer: 'Yes. Cursive lets you set conditions such as company revenue, employee count, or industry before triggering a ZoomInfo lookup, so you only spend credits on high-value prospects.' },
      { question: 'What data fields does ZoomInfo return for enrichment?', answer: 'ZoomInfo can return verified emails, direct dial numbers, job title, seniority, department, company firmographics, technographics, and intent topics depending on your ZoomInfo plan tier.' },
    ],
    keywords: [
      'zoominfo visitor identification',
      'zoominfo lead enrichment',
      'cursive zoominfo integration',
      'zoominfo website visitor tracking',
      'zoominfo intent data',
      'B2B contact enrichment zoominfo',
      'zoominfo API integration',
    ],
  },
  {
    slug: 'lusha',
    name: 'Lusha',
    category: 'Data Enrichment',
    logo: '📇',
    connectionMethod: 'webhook',
    description:
      'Lusha is a B2B contact enrichment platform that provides verified email addresses, direct phone numbers, and company data. It helps sales teams quickly find and connect with decision-makers.',
    whyCursive:
      'Cursive identifies the people browsing your site, then sends that data to Lusha for instant enrichment with verified direct dials and business emails. Your sales team gets actionable contact info for warm visitors instead of relying on generic lead forms.',
    dataMapping: [
      { cursiveField: 'Visitor Emails', toolField: 'Lusha Verified Emails', description: 'Validate and enrich visitor emails with Lusha-verified business addresses.' },
      { cursiveField: 'Company Profiles', toolField: 'Lusha Company Data', description: 'Append company size, industry, and location from Lusha to visitor company records.' },
      { cursiveField: 'Identified Visitors', toolField: 'Lusha Contact Records', description: 'Match visitors to Lusha profiles for direct dials and verified contact info.' },
      { cursiveField: 'Visitor Job Titles', toolField: 'Lusha Role Data', description: 'Confirm visitor job titles and seniority levels through Lusha verification.' },
    ],
    workflows: [
      {
        title: 'Enrich Visitor Emails Instantly',
        description:
          'When Cursive captures a visitor email, automatically run it through Lusha to verify deliverability and append the best available business email. Push verified contacts to your CRM with confidence that outreach will land in the inbox.',
      },
      {
        title: 'Find Direct Dials for High-Intent Visitors',
        description:
          'For visitors who view pricing pages or request demos, trigger a Lusha lookup to retrieve direct phone numbers. Route these warm leads to SDRs with phone numbers ready so they can connect the same day.',
      },
      {
        title: 'Verify Contact Data Before Sequencing',
        description:
          'Before enrolling Cursive-identified visitors in an outbound sequence, verify their contact data through Lusha. This ensures your sequences target real, reachable contacts and maintains healthy deliverability metrics.',
      },
    ],
    setupSteps: [
      'Log into Cursive and go to Settings > Integrations.',
      'Retrieve your Lusha API key from the Lusha dashboard under Settings > API.',
      'Create a new webhook in Cursive, select Lusha as the destination, and paste your API key.',
      'Choose the enrichment triggers: new visitor identified, pricing page visit, or demo request.',
      'Send a test event and verify that Lusha-enriched data appears on the visitor record in Cursive.',
    ],
    faqs: [
      { question: 'How does Lusha enrichment differ from ZoomInfo?', answer: 'Lusha focuses on speed and simplicity for contact-level enrichment, especially direct dials and verified emails. ZoomInfo offers broader firmographic and intent data. Many teams use both for different use cases.' },
      { question: 'Does Lusha enrichment happen in real time?', answer: 'Yes. Lusha lookups return results in seconds, so enriched contact data is available on the visitor record almost immediately after identification.' },
      { question: 'How are Lusha credits consumed?', answer: 'Each successful enrichment lookup uses one Lusha credit. You can configure Cursive to only trigger lookups for visitors matching specific criteria to conserve credits.' },
      { question: 'Can I use Lusha enrichment alongside other enrichment tools?', answer: 'Absolutely. Cursive supports multiple enrichment webhooks simultaneously. You can run Lusha for direct dials and another tool for firmographic data in parallel.' },
      { question: 'What happens if Lusha cannot find data for a visitor?', answer: 'If Lusha returns no match, Cursive keeps the original visitor record unchanged and does not consume a credit. You can set up a fallback enrichment provider for unmatched visitors.' },
    ],
    keywords: [
      'lusha visitor identification',
      'lusha lead enrichment',
      'cursive lusha integration',
      'lusha direct dial lookup',
      'lusha email verification',
      'B2B contact enrichment lusha',
    ],
  },
  {
    slug: 'clearbit',
    name: 'Clearbit',
    category: 'Data Enrichment',
    logo: '🔷',
    connectionMethod: 'webhook',
    description:
      'Clearbit, now part of HubSpot, provides real-time company and contact enrichment, reveal (IP-to-company), and audience intelligence for B2B marketing teams. It turns anonymous traffic into actionable company data.',
    whyCursive:
      'Cursive goes beyond IP-based reveal by identifying individual visitors, then layers Clearbit enrichment on top for a complete picture. Combining Cursive person-level identification with Clearbit firmographic and technographic data gives your team the most complete visitor profiles available.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Clearbit Person Enrichment', description: 'Enrich Cursive-identified visitors with Clearbit role, seniority, and social profiles.' },
      { cursiveField: 'Company Profiles', toolField: 'Clearbit Company Enrichment', description: 'Append detailed firmographics, tech stack, and funding data from Clearbit to visitor companies.' },
      { cursiveField: 'Anonymous Visitors', toolField: 'Clearbit Reveal', description: 'Cross-validate Cursive identification with Clearbit IP-to-company reveal for higher match rates.' },
      { cursiveField: 'Visitor Scores', toolField: 'Clearbit Fit Scores', description: 'Combine Cursive engagement data with Clearbit ideal customer profile scores.' },
      { cursiveField: 'Page Visit History', toolField: 'Clearbit Audience Segments', description: 'Build Clearbit audience segments informed by Cursive behavioral data.' },
    ],
    workflows: [
      {
        title: 'Combine Visitor ID with Clearbit Enrichment',
        description:
          'When Cursive identifies a visitor by name and email, fire a Clearbit enrichment call to append company details, tech stack, employee count, and funding stage. The combined record gives reps a 360-degree view of who visited and why they are a fit.',
      },
      {
        title: 'Cross-Validate Identification Data',
        description:
          'Run Cursive identification and Clearbit Reveal in parallel. Where both match, confidence is highest. Where only one matches, flag the record for review. This dual-source approach maximizes accuracy and coverage.',
      },
      {
        title: 'Build Enriched Visitor Profiles for ABM',
        description:
          'Combine Cursive behavioral data (pages viewed, time on site, return visits) with Clearbit firmographic data to build detailed prospect profiles. Feed these profiles into your ABM platform to personalize campaigns at the account level.',
      },
    ],
    setupSteps: [
      'Open Cursive and navigate to Settings > Integrations > Add New.',
      'Copy your Clearbit API key from the HubSpot/Clearbit dashboard under API Keys.',
      'In Cursive, add a webhook destination for Clearbit enrichment and paste the API key.',
      'Select which visitor events trigger Clearbit lookups (new identification, company match, etc.).',
      'Run a test visitor through your site and verify enriched Clearbit data appears on the Cursive visitor record.',
    ],
    faqs: [
      { question: 'Is Clearbit still available as a standalone product?', answer: 'Clearbit was acquired by HubSpot in 2023. Its enrichment and reveal APIs are still accessible, and HubSpot customers get Clearbit features built into their HubSpot plan. Standalone API access may depend on your agreement.' },
      { question: 'How does Cursive differ from Clearbit Reveal?', answer: 'Clearbit Reveal identifies companies from IP addresses. Cursive identifies individual visitors by name and email. Combining both gives you person-level identification plus company-level enrichment.' },
      { question: 'Can I use Clearbit enrichment if I also use HubSpot?', answer: 'Yes. Clearbit enrichment in Cursive works independently of your HubSpot setup. You can enrich visitor records in Cursive and also sync them to HubSpot where Clearbit data may already be present.' },
      { question: 'What data does Clearbit return per visitor?', answer: 'Clearbit can return name, role, seniority, company name, industry, employee count, revenue range, tech stack, social profiles, and more depending on match quality and your plan.' },
      { question: 'Does Clearbit enrichment slow down visitor identification?', answer: 'No. Cursive identifies visitors first, then triggers Clearbit enrichment asynchronously. Identification is not delayed by the enrichment call.' },
    ],
    keywords: [
      'clearbit visitor identification',
      'clearbit lead enrichment',
      'cursive clearbit integration',
      'clearbit reveal alternative',
      'clearbit hubspot enrichment',
      'B2B data enrichment clearbit',
      'clearbit company data',
    ],
  },

  // ============================================================
  // AD PLATFORMS (3)
  // ============================================================
  {
    slug: 'google-ads',
    name: 'Google Ads',
    category: 'Ad Platforms',
    logo: '📣',
    connectionMethod: 'csv',
    description:
      'Google Ads is the world\'s largest digital advertising platform, enabling search, display, video, and shopping campaigns across Google properties. Customer Match lets advertisers target known contacts with tailored ads.',
    whyCursive:
      'Cursive identifies the people visiting your website and exports them as audience lists for Google Ads Customer Match. This lets you retarget warm visitors with search and display ads, exclude existing customers to reduce waste, and measure the true visitor-to-conversion path.',
    dataMapping: [
      { cursiveField: 'Visitor Emails', toolField: 'Google Customer Match Lists', description: 'Export identified visitor emails as Customer Match lists for targeted search and display campaigns.' },
      { cursiveField: 'Company Segments', toolField: 'Google Ads Audiences', description: 'Build audience segments from visitor company attributes for B2B ad targeting.' },
      { cursiveField: 'Conversion Events', toolField: 'Google Ads Conversions', description: 'Send visitor-to-customer conversion events back to Google Ads for smart bidding optimization.' },
      { cursiveField: 'Existing Customers', toolField: 'Google Ads Exclusion Lists', description: 'Exclude known customers from acquisition campaigns to reduce wasted ad spend.' },
    ],
    workflows: [
      {
        title: 'Build Retargeting Audiences from Visitors',
        description:
          'Export Cursive-identified visitor emails as a Customer Match list in Google Ads. Target these warm visitors with tailored search ads when they search for your product category, increasing click-through rates because they already know your brand.',
      },
      {
        title: 'Exclude Existing Customers from Campaigns',
        description:
          'Upload your existing customer list from Cursive as an exclusion audience in Google Ads. This prevents your acquisition budget from being spent on people who already converted, focusing every dollar on net-new prospects.',
      },
      {
        title: 'Track Visitor-to-Conversion Path',
        description:
          'Send offline conversion data from Cursive (e.g., a visitor became a paying customer) back to Google Ads. This closes the attribution loop and lets Google smart bidding optimize for visitors who actually buy, not just click.',
      },
    ],
    setupSteps: [
      'In Cursive, go to Integrations and select Google Ads.',
      'Choose your export format: CSV download for manual upload or webhook for automated syncing.',
      'For CSV, download the visitor list and upload it to Google Ads under Audience Manager > Customer Lists.',
      'For webhook, configure the Google Ads API credentials and select which visitor segments to sync automatically.',
      'Set a sync schedule (daily recommended) and verify the audience appears in your Google Ads account within 24 hours.',
    ],
    faqs: [
      { question: 'How large does my Customer Match list need to be?', answer: 'Google Ads requires a minimum of 1,000 matched contacts for Customer Match audiences to serve. Cursive typically identifies enough visitors within the first few weeks to meet this threshold.' },
      { question: 'Can I use this for Google Display Network campaigns?', answer: 'Yes. Customer Match audiences work across Google Search, Display, YouTube, and Gmail campaigns. You can retarget identified visitors on any Google property.' },
      { question: 'How often should I refresh the audience list?', answer: 'We recommend daily or weekly syncs to keep your audience fresh with new visitors. Stale lists lead to lower match rates and missed opportunities.' },
      { question: 'Does this comply with Google Ads data policies?', answer: 'Customer Match requires that contacts were collected with proper consent. Cursive identifies visitors through compliant methods, but you should review Google Ads Customer Match policies for your specific use case and region.' },
      { question: 'What match rate should I expect?', answer: 'Google Customer Match typically achieves 30-60% match rates on B2B email lists. Match rates depend on whether visitors use personal or work email addresses with Google accounts.' },
    ],
    keywords: [
      'google ads visitor identification',
      'google ads lead enrichment',
      'cursive google ads integration',
      'google customer match B2B',
      'google ads retargeting website visitors',
      'google ads audience sync',
    ],
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    category: 'Ad Platforms',
    logo: '📘',
    connectionMethod: 'csv',
    description:
      'Meta Ads (Facebook and Instagram advertising) reaches billions of users with precise targeting through Custom Audiences, Lookalike Audiences, and Conversions API. It is a cornerstone of most B2B and B2C paid media strategies.',
    whyCursive:
      'Cursive turns anonymous website visitors into named contacts, then exports those contacts to Meta as Custom Audiences. You can retarget identified visitors on Facebook and Instagram, build Lookalike Audiences to find similar prospects, and feed offline conversions back to Meta for smarter optimization.',
    dataMapping: [
      { cursiveField: 'Visitor Emails', toolField: 'Meta Custom Audiences', description: 'Export identified visitor emails to create targeted Custom Audiences on Facebook and Instagram.' },
      { cursiveField: 'Company Segments', toolField: 'Meta Lookalike Audiences', description: 'Seed Lookalike Audiences with high-value visitor segments to find similar prospects at scale.' },
      { cursiveField: 'Conversion Events', toolField: 'Meta Conversions API', description: 'Send offline conversion events from Cursive to Meta for attribution and optimization.' },
      { cursiveField: 'Visitor Engagement Scores', toolField: 'Meta Audience Segments', description: 'Create audience tiers based on visitor engagement level for differentiated ad messaging.' },
    ],
    workflows: [
      {
        title: 'Retarget Identified Visitors on Social',
        description:
          'Upload Cursive-identified visitor emails to Meta as a Custom Audience. Serve these warm visitors personalized ads on Facebook and Instagram that reference their specific interests based on pages they visited on your site.',
      },
      {
        title: 'Build Lookalike Audiences from Best Visitors',
        description:
          'Take your highest-engagement visitors from Cursive (pricing page viewers, repeat visitors, demo requesters) and use them as a seed audience for Meta Lookalikes. Meta finds millions of similar users, dramatically expanding your qualified reach.',
      },
      {
        title: 'Track Offline Conversions for Better Optimization',
        description:
          'When a Cursive-identified visitor converts to a customer offline (signed contract, closed deal), send that conversion event to Meta via the Conversions API. This teaches Meta which ad clicks lead to real revenue, improving future ad delivery.',
      },
    ],
    setupSteps: [
      'In Cursive, navigate to Integrations and select Meta Ads.',
      'Download a CSV of your visitor segment or configure a webhook to Meta Conversions API.',
      'For Custom Audiences, upload the CSV in Meta Business Manager under Audiences > Create Custom Audience > Customer List.',
      'For automated syncing, enter your Meta Pixel ID and Conversions API access token in Cursive.',
      'Verify the audience populates in Meta Business Manager and test by running a small campaign against it.',
    ],
    faqs: [
      { question: 'What is the minimum audience size for Meta Custom Audiences?', answer: 'Meta requires at least 100 people in a Custom Audience for it to be usable, though larger audiences (1,000+) perform significantly better for optimization.' },
      { question: 'Can I use this for Instagram ads too?', answer: 'Yes. Meta Custom Audiences apply across Facebook, Instagram, Messenger, and the Audience Network. Any campaign using the audience will serve across all Meta placements.' },
      { question: 'How does the Conversions API integration work?', answer: 'Cursive sends server-side events (visitor identified, lead converted, deal closed) to Meta Conversions API. This supplements pixel data with higher-quality signals for better attribution and optimization.' },
      { question: 'Will this work with my existing Meta Pixel?', answer: 'Yes. Cursive Conversions API events complement your existing pixel setup. Meta deduplicates events automatically when both pixel and server events are present.' },
      { question: 'How often should I refresh Custom Audiences?', answer: 'Sync weekly at minimum. For fast-moving sales cycles, daily syncs ensure new visitors are targeted promptly and converted visitors are excluded from acquisition campaigns.' },
    ],
    keywords: [
      'meta ads visitor identification',
      'facebook ads lead enrichment',
      'cursive meta ads integration',
      'meta custom audience website visitors',
      'facebook retargeting B2B',
      'meta conversions API integration',
      'instagram ads visitor targeting',
    ],
  },
  {
    slug: 'linkedin-ads',
    name: 'LinkedIn Ads',
    category: 'Ad Platforms',
    logo: '💼',
    connectionMethod: 'csv',
    description:
      'LinkedIn Ads is the premier B2B advertising platform, offering Matched Audiences, Company Targeting, and Conversion Tracking to reach professionals by job title, company, industry, and seniority.',
    whyCursive:
      'Cursive identifies which companies and people visit your website, then feeds that data to LinkedIn Ads as Matched Audiences. Target visitor companies with sponsored content, run ABM campaigns to decision-makers at accounts showing intent, and measure how LinkedIn ads influence pipeline.',
    dataMapping: [
      { cursiveField: 'Visitor Emails', toolField: 'LinkedIn Matched Audiences (Contact)', description: 'Upload identified visitor emails to target individuals on LinkedIn with sponsored content.' },
      { cursiveField: 'Company Domains', toolField: 'LinkedIn Matched Audiences (Company)', description: 'Upload visitor company domains to target entire buying committees at visiting accounts.' },
      { cursiveField: 'Conversion Events', toolField: 'LinkedIn Conversion Tracking', description: 'Send offline conversions to LinkedIn to measure true campaign influence on pipeline.' },
      { cursiveField: 'Company Segments', toolField: 'LinkedIn ABM Lists', description: 'Build ABM target lists from high-intent visitor companies for LinkedIn campaign targeting.' },
    ],
    workflows: [
      {
        title: 'Target Visitor Companies on LinkedIn',
        description:
          'Export company domains of Cursive-identified visitors and upload them as a LinkedIn Company Matched Audience. Run sponsored content targeting decision-makers at these companies, knowing they have already shown interest by visiting your site.',
      },
      {
        title: 'Run ABM Campaigns for High-Intent Accounts',
        description:
          'Filter Cursive visitors to companies that visited pricing or case study pages. Upload these as a LinkedIn company list and layer job title and seniority filters to reach the buying committee. Serve them content tailored to their stage in the buyer journey.',
      },
      {
        title: 'Measure LinkedIn Influence on Pipeline',
        description:
          'Send Cursive conversion events (demo booked, deal closed) back to LinkedIn as offline conversions. This reveals which LinkedIn campaigns and audiences actually drive pipeline, enabling better budget allocation across channels.',
      },
    ],
    setupSteps: [
      'In Cursive, go to Integrations and select LinkedIn Ads.',
      'Export your visitor company list or contact list as a CSV formatted for LinkedIn Matched Audiences.',
      'In LinkedIn Campaign Manager, go to Plan > Audiences > Create Matched Audience and upload the CSV.',
      'For conversion tracking, configure LinkedIn Conversions API credentials in Cursive and map your conversion events.',
      'Wait 24-48 hours for LinkedIn to match your audience, then build campaigns targeting the new audience.',
    ],
    faqs: [
      { question: 'How large does a LinkedIn Matched Audience need to be?', answer: 'LinkedIn requires a minimum of 300 matched members for a contact list audience and 1,000 for a company list audience. Cursive typically generates enough data within the first few weeks of deployment.' },
      { question: 'Can I target specific job titles within visitor companies?', answer: 'Yes. After uploading a company Matched Audience, you can layer LinkedIn targeting filters for job title, seniority, function, and skills to reach specific decision-makers within those companies.' },
      { question: 'How does this differ from LinkedIn Insight Tag retargeting?', answer: 'LinkedIn Insight Tag retargets anyone who visits your site. Cursive Matched Audiences let you target the specific companies and people Cursive identified, with the ability to segment by engagement level and intent signals.' },
      { question: 'How often should I update my LinkedIn audience?', answer: 'Weekly updates are recommended. LinkedIn audience matching takes 24-48 hours, so daily uploads can create overlap. A weekly cadence keeps lists fresh without processing delays.' },
      { question: 'Does this work for LinkedIn Sponsored InMail?', answer: 'Yes. Matched Audiences can be used across all LinkedIn ad formats including Sponsored Content, Sponsored InMail (Message Ads), Text Ads, and Dynamic Ads.' },
    ],
    keywords: [
      'linkedin ads visitor identification',
      'linkedin ads lead enrichment',
      'cursive linkedin ads integration',
      'linkedin matched audiences B2B',
      'linkedin ABM campaign visitors',
      'linkedin company targeting website visitors',
    ],
  },

  // ============================================================
  // ANALYTICS (4)
  // ============================================================
  {
    slug: 'google-analytics',
    name: 'Google Analytics',
    category: 'Analytics',
    logo: '📊',
    connectionMethod: 'webhook',
    description:
      'Google Analytics 4 (GA4) is the industry-standard web analytics platform that tracks user behavior, acquisition channels, and conversion events across websites and apps. It powers data-driven marketing decisions for millions of businesses.',
    whyCursive:
      'Cursive enriches your GA4 data by attaching company names and contact details to previously anonymous sessions. Build GA4 audiences of identified B2B visitors, track B2B conversion paths from first visit to closed deal, and send enriched events to GA4 for deeper analysis.',
    dataMapping: [
      { cursiveField: 'Visitor Events', toolField: 'GA4 Custom Events', description: 'Send Cursive identification events to GA4 as custom events for tracking and reporting.' },
      { cursiveField: 'Company Name', toolField: 'GA4 User Properties', description: 'Set company name, industry, and size as GA4 user properties for B2B segmentation.' },
      { cursiveField: 'Visitor Segments', toolField: 'GA4 Audiences', description: 'Create GA4 audiences from Cursive-identified visitor segments for retargeting and analysis.' },
      { cursiveField: 'Conversion Data', toolField: 'GA4 Conversion Events', description: 'Send offline conversion events to GA4 to complete the B2B attribution picture.' },
    ],
    workflows: [
      {
        title: 'Enrich GA4 with Company Data',
        description:
          'When Cursive identifies a visitor, send company name, industry, and employee count to GA4 as user properties. This transforms your GA4 reports from anonymous session data into B2B intelligence, letting you filter reports by company attributes.',
      },
      {
        title: 'Build Audiences from Identified Visitors',
        description:
          'Create GA4 audiences based on Cursive identification events. For example, build an audience of "identified visitors from enterprise companies who viewed pricing." Use these audiences for Google Ads retargeting or deeper funnel analysis.',
      },
      {
        title: 'Track B2B Conversion Paths',
        description:
          'Send Cursive conversion events (demo booked, proposal sent, deal won) to GA4. Use GA4 path exploration and attribution reports to understand the full journey from first anonymous visit to closed revenue, broken down by company segment.',
      },
    ],
    setupSteps: [
      'In Cursive, navigate to Integrations and select Google Analytics.',
      'Enter your GA4 Measurement ID (starts with G-) and API secret from the GA4 admin panel.',
      'Map Cursive visitor fields to GA4 user properties and events using the configuration wizard.',
      'Enable the events you want to send: visitor identified, company matched, conversion events.',
      'Verify data flow by checking GA4 Realtime reports and DebugView for incoming Cursive events.',
    ],
    faqs: [
      { question: 'Does this replace my existing GA4 tracking?', answer: 'No. Cursive sends additional events and user properties to GA4 that supplement your existing tracking. Your current GA4 setup continues to work as-is.' },
      { question: 'Can I use Cursive data in GA4 Explorations?', answer: 'Yes. Once Cursive user properties and events flow into GA4, you can use them in any GA4 report, exploration, funnel, or path analysis just like native GA4 data.' },
      { question: 'Will Cursive events count against my GA4 event limits?', answer: 'GA4 allows up to 500 distinct event names and 25 user properties. Cursive typically uses 3-5 events and 4-6 user properties, well within standard limits.' },
      { question: 'How does this work with GA4 BigQuery export?', answer: 'Cursive events and user properties flow through to BigQuery export just like any other GA4 data. This means you can join Cursive company data with your full GA4 dataset in BigQuery.' },
      { question: 'Can I build Google Ads audiences from Cursive GA4 data?', answer: 'Yes. GA4 audiences that include Cursive user properties or events can be shared with your linked Google Ads account for retargeting campaigns.' },
    ],
    keywords: [
      'google analytics visitor identification',
      'GA4 lead enrichment',
      'cursive google analytics integration',
      'GA4 B2B analytics',
      'google analytics company data',
      'GA4 user properties enrichment',
      'B2B website analytics',
    ],
  },
  {
    slug: 'segment',
    name: 'Segment',
    category: 'Analytics',
    logo: '🟢',
    connectionMethod: 'webhook',
    description:
      'Segment is a customer data platform (CDP) that collects, cleans, and routes user data to hundreds of downstream tools. It provides a single API for tracking, identify calls, and group calls across your entire stack.',
    whyCursive:
      'Cursive feeds identified visitor data into Segment as Identify and Group calls, enriching your entire downstream stack at once. Every tool connected to Segment receives Cursive visitor data automatically, creating a unified customer view from first anonymous visit through closed deal.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Segment Identify Calls', description: 'Send visitor name, email, and traits to Segment as Identify calls to enrich user profiles across all destinations.' },
      { cursiveField: 'Visitor Events', toolField: 'Segment Track Calls', description: 'Send Cursive events (visitor identified, page viewed, intent detected) as Segment Track calls.' },
      { cursiveField: 'Company Profiles', toolField: 'Segment Group Calls', description: 'Send company data as Segment Group calls to associate visitors with their organizations.' },
      { cursiveField: 'Visitor Traits', toolField: 'Segment User Traits', description: 'Map Cursive enrichment fields to Segment user traits for downstream tool consumption.' },
    ],
    workflows: [
      {
        title: 'Enrich Segment Profiles with Visitor Identity',
        description:
          'When Cursive identifies a website visitor, send an Identify call to Segment with the visitor name, email, company, and job title. This enriches the Segment profile and propagates the data to every connected destination automatically.',
      },
      {
        title: 'Route Visitor Data to Your Warehouse',
        description:
          'Use Segment Warehouses destination to route Cursive-identified visitor data to Snowflake, BigQuery, or Redshift. Build unified tables that combine website behavior with CRM data, product usage, and support tickets for a complete customer view.',
      },
      {
        title: 'Create Unified Customer View',
        description:
          'Combine Cursive visitor identification with Segment Identity Resolution to merge anonymous sessions with known user profiles. This closes the gap between marketing website visits and product signups, giving every team a single source of truth.',
      },
    ],
    setupSteps: [
      'In Cursive, go to Integrations and select Segment.',
      'Copy your Segment Write Key from the Segment Sources page for your website source.',
      'Paste the Write Key in Cursive and configure which visitor events to send as Track calls.',
      'Map Cursive visitor fields to Segment Identify traits (name, email, company, title, etc.).',
      'Send a test event and verify it appears in the Segment Debugger, then confirm it flows to downstream destinations.',
    ],
    faqs: [
      { question: 'Does Cursive replace my existing Segment source?', answer: 'No. Cursive acts as an additional Segment source. Your existing analytics.js or server-side tracking continues to work. Cursive adds enrichment data on top of what you already collect.' },
      { question: 'Will Cursive data flow to all my Segment destinations?', answer: 'Yes. Once Cursive sends Identify and Track calls to Segment, that data routes to every enabled destination in your Segment workspace, including CRMs, email tools, analytics, and warehouses.' },
      { question: 'How does this work with Segment Protocols?', answer: 'You can add Cursive events and traits to your Segment Tracking Plan in Protocols. This ensures Cursive data is validated and conforms to your data governance standards before reaching destinations.' },
      { question: 'Can I use Segment Personas with Cursive data?', answer: 'Yes. Cursive Identify calls enrich Segment Personas (now Unify) profiles. You can build computed traits and audiences that combine Cursive visitor data with data from other sources.' },
      { question: 'Does this count against my Segment MTU (Monthly Tracked Users)?', answer: 'Yes. Each unique visitor Cursive identifies and sends to Segment counts as an MTU. Plan your Segment tier accordingly, and use Cursive filters to send only high-value visitors if needed.' },
    ],
    keywords: [
      'segment visitor identification',
      'segment lead enrichment',
      'cursive segment integration',
      'segment CDP visitor data',
      'segment identify call enrichment',
      'customer data platform integration',
    ],
  },
  {
    slug: 'mixpanel',
    name: 'Mixpanel',
    category: 'Analytics',
    logo: '🟣',
    connectionMethod: 'webhook',
    description:
      'Mixpanel is a product analytics platform that tracks user interactions with web and mobile applications. It provides event-based analytics, funnel analysis, retention tracking, and cohort segmentation for product and growth teams.',
    whyCursive:
      'Cursive connects the dots between anonymous website visitors and product users by enriching Mixpanel profiles with company and contact data. Product teams can segment analytics by company size, industry, or visitor intent to understand B2B usage patterns and drive expansion revenue.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Mixpanel User Profiles', description: 'Enrich Mixpanel user profiles with Cursive-identified visitor names, emails, and company data.' },
      { cursiveField: 'Visitor Events', toolField: 'Mixpanel Events', description: 'Send website visitor events to Mixpanel for unified web-to-product funnel analysis.' },
      { cursiveField: 'Company Segments', toolField: 'Mixpanel Cohorts', description: 'Build Mixpanel cohorts based on Cursive company segments for B2B product analysis.' },
      { cursiveField: 'Visitor Engagement Scores', toolField: 'Mixpanel User Properties', description: 'Set engagement scores as Mixpanel user properties for segmentation and filtering.' },
    ],
    workflows: [
      {
        title: 'Enrich Product Analytics with Company Data',
        description:
          'Send Cursive company data (name, industry, size, revenue) to Mixpanel as user profile properties. Product teams can then filter every Mixpanel report by company attributes, revealing how enterprise vs. SMB users behave differently.',
      },
      {
        title: 'Build B2B Cohorts from Visitor Segments',
        description:
          'Create Mixpanel cohorts based on Cursive visitor segments such as "enterprise companies viewing API docs" or "returning visitors from target accounts." Track how these cohorts progress through product adoption stages.',
      },
      {
        title: 'Track Visitor-to-User Conversion',
        description:
          'Combine Cursive website visitor events with Mixpanel product events to build end-to-end funnels. See how many identified visitors become signups, how quickly they activate, and which visitor behaviors predict successful conversion.',
      },
    ],
    setupSteps: [
      'In Cursive, navigate to Integrations and select Mixpanel.',
      'Copy your Mixpanel Project Token and API Secret from Mixpanel Project Settings.',
      'Paste the credentials in Cursive and choose whether to send events, user profiles, or both.',
      'Map Cursive visitor fields to Mixpanel user profile properties (company, industry, size, etc.).',
      'Send a test event, then check the Mixpanel Live View to confirm data is flowing correctly.',
    ],
    faqs: [
      { question: 'Will Cursive events appear alongside my existing Mixpanel product events?', answer: 'Yes. Cursive events are sent to the same Mixpanel project and can be combined with your existing product events in funnels, flows, and retention reports.' },
      { question: 'How does user identity resolution work between Cursive and Mixpanel?', answer: 'When Cursive identifies a visitor, it sends a profile update using the visitor email as the distinct_id. If the same email exists in Mixpanel from product usage, the profiles merge automatically.' },
      { question: 'Can I use Cursive data in Mixpanel Flows?', answer: 'Yes. Cursive website events (page views, identification events) can be included in Mixpanel Flows alongside product events to visualize the full user journey from website to product.' },
      { question: 'Does this integration work with Mixpanel Group Analytics?', answer: 'Yes. Cursive sends company data that can be used with Mixpanel Group Analytics (available on Growth and Enterprise plans) to analyze product usage at the account level.' },
      { question: 'How does this affect my Mixpanel event quota?', answer: 'Each Cursive event sent to Mixpanel counts toward your monthly event quota. Use Cursive filters to limit which events are sent (e.g., only identified visitors, only high-intent pages) to manage volume.' },
    ],
    keywords: [
      'mixpanel visitor identification',
      'mixpanel lead enrichment',
      'cursive mixpanel integration',
      'mixpanel B2B product analytics',
      'mixpanel company data enrichment',
      'product analytics visitor identification',
    ],
  },
  {
    slug: 'amplitude',
    name: 'Amplitude',
    category: 'Analytics',
    logo: '📈',
    connectionMethod: 'webhook',
    description:
      'Amplitude is a digital analytics platform focused on product intelligence, offering behavioral analytics, experimentation, and customer data management. It helps product and growth teams understand user behavior and drive retention.',
    whyCursive:
      'Cursive bridges the gap between your marketing website and your product by enriching Amplitude user profiles with visitor company data and intent signals. Understand which types of companies convert best, how website behavior predicts product adoption, and where B2B users drop off.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Amplitude User Properties', description: 'Set company name, industry, and size as Amplitude user properties for B2B segmentation.' },
      { cursiveField: 'Visitor Events', toolField: 'Amplitude Events', description: 'Send website visitor events to Amplitude for cross-platform behavioral analysis.' },
      { cursiveField: 'Company Segments', toolField: 'Amplitude Cohorts', description: 'Build Amplitude behavioral cohorts enriched with Cursive company attributes.' },
      { cursiveField: 'Visitor Engagement Scores', toolField: 'Amplitude User Properties', description: 'Attach website engagement scores to Amplitude profiles for conversion analysis.' },
    ],
    workflows: [
      {
        title: 'Connect Website Visitors to Product Users',
        description:
          'When Cursive identifies a website visitor who later signs up for your product, Amplitude merges the website and product profiles. This reveals the complete journey from first website visit through product activation, tied to a real person and company.',
      },
      {
        title: 'B2B Product Analytics by Company Segment',
        description:
          'With Cursive company data in Amplitude user properties, segment any product report by company size, industry, or revenue. Discover that enterprise users adopt features differently than SMBs, and tailor your product strategy accordingly.',
      },
      {
        title: 'Conversion Analysis from Visit to Activation',
        description:
          'Build Amplitude funnels that start with Cursive website events (identified visitor, pricing page view) and end with product activation milestones. Identify which website behaviors predict successful product adoption and optimize your marketing accordingly.',
      },
    ],
    setupSteps: [
      'In Cursive, navigate to Integrations and select Amplitude.',
      'Copy your Amplitude API Key and Secret Key from Amplitude Settings > Projects.',
      'Paste the keys in Cursive and select the events and user properties to sync.',
      'Map Cursive visitor fields to Amplitude user properties (company, industry, employee count, etc.).',
      'Trigger a test event and verify it appears in Amplitude User Lookup and the event stream.',
    ],
    faqs: [
      { question: 'How does identity resolution work between Cursive and Amplitude?', answer: 'Cursive sends events with the visitor email as the user_id. When the same email appears in your product tracking, Amplitude merges the profiles through its ID resolution system.' },
      { question: 'Can I use Cursive data in Amplitude Experiments?', answer: 'Yes. Cursive user properties (company size, industry) can be used as targeting criteria in Amplitude Experiments, letting you run experiments segmented by B2B attributes.' },
      { question: 'Does this work with Amplitude Audiences?', answer: 'Yes. Cursive-enriched user properties and events can be used to build Amplitude Audiences (cohorts) for syncing to ad platforms, email tools, or other destinations.' },
      { question: 'Will this integration affect my Amplitude event volume pricing?', answer: 'Yes. Cursive events count toward your Amplitude monthly event volume. Configure Cursive to send only the events you need, and use Amplitude data governance to manage incoming data.' },
      { question: 'Can I see website and product data in the same Amplitude chart?', answer: 'Yes. Once Cursive events flow into Amplitude, you can combine website events and product events in the same chart, funnel, or retention analysis for a unified view.' },
    ],
    keywords: [
      'amplitude visitor identification',
      'amplitude lead enrichment',
      'cursive amplitude integration',
      'amplitude B2B analytics',
      'amplitude company data',
      'product analytics website visitors',
      'amplitude user property enrichment',
    ],
  },

  // ============================================================
  // SPREADSHEETS / DATA (4)
  // ============================================================
  {
    slug: 'google-sheets',
    name: 'Google Sheets',
    category: 'Spreadsheets',
    logo: '📗',
    connectionMethod: 'csv',
    description:
      'Google Sheets is a cloud-based spreadsheet application that enables real-time collaboration, data organization, and lightweight analysis. It is widely used by sales and marketing teams for lead tracking, reporting, and team coordination.',
    whyCursive:
      'Cursive exports identified visitor lists directly to Google Sheets, giving your team immediate access to fresh leads without any CRM login required. Share visitor data with stakeholders, build lightweight dashboards, and create pivot reports that update with each export.',
    dataMapping: [
      { cursiveField: 'Visitor Name', toolField: 'Sheet Row (Name Column)', description: 'Each identified visitor becomes a row with their full name in the Name column.' },
      { cursiveField: 'Visitor Email', toolField: 'Sheet Row (Email Column)', description: 'Visitor email address populates the Email column for outreach or CRM import.' },
      { cursiveField: 'Company Name', toolField: 'Sheet Row (Company Column)', description: 'Visitor company name fills the Company column for account-level grouping.' },
      { cursiveField: 'Pages Visited', toolField: 'Sheet Row (Pages Column)', description: 'Key pages visited are listed in the Pages column to indicate visitor intent.' },
      { cursiveField: 'Visit Timestamp', toolField: 'Sheet Row (Date Column)', description: 'The date and time of the visit for chronological sorting and freshness tracking.' },
    ],
    workflows: [
      {
        title: 'Auto-Export Daily Visitor Lists',
        description:
          'Schedule a daily CSV export from Cursive to a shared Google Sheet. Every morning, your sales team opens the sheet and sees yesterday\'s identified visitors with names, emails, companies, and pages viewed, ready for outreach prioritization.',
      },
      {
        title: 'Share Visitor Data with Your Team',
        description:
          'Use Google Sheets sharing to give marketing, sales, and leadership access to the same visitor list. Add comments, assign follow-up owners, and track outreach status in additional columns without needing a CRM.',
      },
      {
        title: 'Build Pivot Reports for Executive Visibility',
        description:
          'Use Google Sheets pivot tables to summarize Cursive visitor data by company, industry, or page viewed. Create charts that show weekly visitor trends, top visiting companies, and conversion rates for executive reporting.',
      },
    ],
    setupSteps: [
      'In Cursive, go to Integrations and select Google Sheets / CSV Export.',
      'Choose your export filters: date range, visitor segment, minimum engagement score, etc.',
      'Click Export and download the CSV file from Cursive.',
      'Open Google Sheets and use File > Import to upload the CSV, or paste data into an existing sheet.',
      'Set up a recurring export schedule in Cursive to automate daily or weekly updates to the sheet.',
    ],
    faqs: [
      { question: 'Can Cursive push data directly to Google Sheets without a CSV?', answer: 'Currently, Cursive provides CSV exports that you upload to Google Sheets. You can automate this with a Zapier or Make integration that watches for new Cursive exports and appends rows to your sheet.' },
      { question: 'How many visitors can I export at once?', answer: 'Cursive CSV exports can include thousands of visitors per file. Google Sheets supports up to 10 million cells, so even large exports fit comfortably.' },
      { question: 'Can I filter which visitors appear in the export?', answer: 'Yes. Cursive lets you filter exports by date range, company size, pages visited, engagement score, and other criteria so you only export the visitors that matter to your workflow.' },
      { question: 'Will the sheet update automatically?', answer: 'CSV exports are point-in-time snapshots. For automatic updates, connect Cursive to Google Sheets through a Zapier or Make automation that appends new visitors as they are identified.' },
      { question: 'Can I use this data for mail merge?', answer: 'Yes. Export visitor data to Google Sheets, then use a mail merge add-on (like Yet Another Mail Merge) to send personalized outreach emails directly from Gmail.' },
    ],
    keywords: [
      'google sheets visitor export',
      'google sheets lead list',
      'cursive google sheets integration',
      'export website visitors spreadsheet',
      'visitor data google sheets',
      'B2B lead export CSV',
    ],
  },
  {
    slug: 'airtable',
    name: 'Airtable',
    category: 'Spreadsheets',
    logo: '🗃️',
    connectionMethod: 'webhook',
    description:
      'Airtable is a flexible database-spreadsheet hybrid that combines the simplicity of a spreadsheet with the power of a relational database. It supports custom views, automations, and integrations for managing structured data.',
    whyCursive:
      'Cursive sends identified visitor data to Airtable via webhook, automatically creating records in your visitor database. Build custom views for different teams, trigger Airtable automations when high-value visitors arrive, and create a lightweight sales pipeline without a full CRM.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Airtable Records', description: 'Each identified visitor becomes a record in your Airtable base with all available fields.' },
      { cursiveField: 'Company Profiles', toolField: 'Airtable Linked Records', description: 'Company data populates a linked Companies table for relational organization.' },
      { cursiveField: 'Visitor Segments', toolField: 'Airtable Views', description: 'Cursive segments map to filtered Airtable views for team-specific workflows.' },
      { cursiveField: 'Engagement Scores', toolField: 'Airtable Number Fields', description: 'Visitor engagement scores populate number fields for sorting and filtering.' },
      { cursiveField: 'Visit Timestamps', toolField: 'Airtable Date Fields', description: 'Visit dates fill date fields for chronological tracking and automation triggers.' },
    ],
    workflows: [
      {
        title: 'Build a Visitor Database Automatically',
        description:
          'Every time Cursive identifies a new visitor, a webhook creates a record in Airtable with name, email, company, pages viewed, and engagement score. Your team has a searchable, sortable database of every identified visitor without manual data entry.',
      },
      {
        title: 'Trigger Automations for Hot Visitors',
        description:
          'Use Airtable Automations to watch for new records with high engagement scores. When a hot visitor record appears, automatically send a Slack notification to the assigned sales rep, create a follow-up task, or send an email through a connected tool.',
      },
      {
        title: 'Create Sales Pipeline Views',
        description:
          'Add a "Status" single-select field (New, Contacted, Meeting Booked, Qualified, Closed) to your Airtable visitor base. Use Kanban view to visually manage your pipeline, and Gallery view to give leadership a snapshot of active opportunities.',
      },
    ],
    setupSteps: [
      'Create an Airtable base with the fields you want: Name, Email, Company, Pages Visited, Score, Date, Status.',
      'In Airtable, go to Automations > Create Automation > When webhook received, and copy the webhook URL.',
      'In Cursive, go to Integrations > Add Webhook and paste the Airtable webhook URL.',
      'Map Cursive visitor fields to your Airtable field names in the webhook configuration.',
      'Test by visiting your site and confirming a new record appears in your Airtable base within minutes.',
    ],
    faqs: [
      { question: 'Can I use Airtable as a lightweight CRM with Cursive?', answer: 'Yes. Many teams use Airtable with Cursive as a simple CRM. Add status fields, owner assignments, and note columns to track outreach and deal progress without paying for a full CRM.' },
      { question: 'Does Cursive create new records or update existing ones?', answer: 'By default, Cursive creates new records. You can configure Airtable Automations to check for duplicate emails and update existing records instead of creating duplicates.' },
      { question: 'Can I connect multiple Airtable bases?', answer: 'Yes. You can set up multiple webhooks in Cursive, each pointing to a different Airtable base or table. Use this to route different visitor segments to different teams.' },
      { question: 'What Airtable plan do I need?', answer: 'Airtable webhooks and automations are available on the Team plan and above. The free plan supports manual CSV imports from Cursive but not automated webhook ingestion.' },
      { question: 'Can I build charts and dashboards in Airtable from Cursive data?', answer: 'Yes. Airtable Interface Designer lets you build dashboards with charts, summary blocks, and filtered views on top of your Cursive visitor data.' },
    ],
    keywords: [
      'airtable visitor identification',
      'airtable lead database',
      'cursive airtable integration',
      'airtable webhook leads',
      'airtable CRM alternative',
      'visitor data airtable',
      'airtable sales pipeline visitors',
    ],
  },
  {
    slug: 'excel',
    name: 'Microsoft Excel',
    category: 'Spreadsheets',
    logo: '📊',
    connectionMethod: 'csv',
    description:
      'Microsoft Excel is the most widely used spreadsheet application in the world, offering powerful data analysis, pivot tables, charting, and macro capabilities. It remains the go-to tool for enterprise reporting and offline data manipulation.',
    whyCursive:
      'Cursive exports identified visitor data as CSV files that open directly in Excel. Teams that rely on Excel for reporting, analysis, or CRM data prep can work with Cursive data in their familiar environment, complete with pivot tables, VLOOKUP formulas, and executive-ready charts.',
    dataMapping: [
      { cursiveField: 'Visitor Name', toolField: 'Excel Row (Name Column)', description: 'Each identified visitor becomes a row with their name in the designated column.' },
      { cursiveField: 'Visitor Email', toolField: 'Excel Row (Email Column)', description: 'Email addresses populate the Email column for outreach and deduplication.' },
      { cursiveField: 'Company Name', toolField: 'Excel Row (Company Column)', description: 'Company names fill the Company column for account-level analysis.' },
      { cursiveField: 'Pages Visited', toolField: 'Excel Row (Intent Column)', description: 'Key pages visited indicate intent level and interest areas.' },
    ],
    workflows: [
      {
        title: 'Export for Offline Analysis',
        description:
          'Download Cursive visitor data as a CSV, open it in Excel, and use pivot tables, conditional formatting, and charts to analyze visitor trends offline. Ideal for teams without real-time dashboard access or those who prefer Excel\'s analysis depth.',
      },
      {
        title: 'Mail Merge for Personalized Outreach',
        description:
          'Use Cursive CSV exports as the data source for an Outlook or Word mail merge. Personalize outreach emails with visitor name, company, and pages visited to craft relevant messages at scale without a dedicated email tool.',
      },
      {
        title: 'Executive Reporting',
        description:
          'Build an Excel template with charts and summary tables that refresh when you paste new Cursive export data. Deliver weekly executive reports showing visitor volume, top companies, industry breakdown, and conversion metrics in a polished format.',
      },
    ],
    setupSteps: [
      'In Cursive, go to Integrations and select CSV Export.',
      'Choose your date range, visitor segment, and fields to include in the export.',
      'Click Export and save the CSV file to your computer.',
      'Open the CSV in Microsoft Excel. Use Data > From Text/CSV if Excel does not open it automatically.',
      'Format as a table (Ctrl+T) to enable sorting, filtering, and pivot table creation.',
    ],
    faqs: [
      { question: 'What CSV format does Cursive use?', answer: 'Cursive exports standard UTF-8 encoded CSV files with comma delimiters. Excel opens these natively on both Windows and Mac without any special configuration.' },
      { question: 'Can I automate Excel imports from Cursive?', answer: 'Cursive provides manual CSV downloads. For automation, use Power Automate to watch a folder for new CSV files and import them into an Excel workbook automatically.' },
      { question: 'How many rows can I export?', answer: 'Cursive CSV exports can include tens of thousands of visitor records. Excel supports over one million rows per sheet, so even large exports are handled without issue.' },
      { question: 'Can I use Power Query with Cursive data?', answer: 'Yes. Import the Cursive CSV into Excel using Power Query for automatic data type detection, transformations, and scheduled refresh when new exports are available.' },
      { question: 'Does the export include all visitor fields?', answer: 'You choose which fields to include during export configuration. Available fields include name, email, company, job title, pages visited, visit count, engagement score, and timestamps.' },
    ],
    keywords: [
      'excel visitor export',
      'excel lead list',
      'cursive excel integration',
      'export website visitors excel',
      'visitor data CSV excel',
      'B2B lead export microsoft excel',
    ],
  },
  {
    slug: 'notion',
    name: 'Notion',
    category: 'Spreadsheets',
    logo: '📝',
    connectionMethod: 'webhook',
    description:
      'Notion is an all-in-one workspace that combines documents, databases, wikis, and project management. Its flexible database feature lets teams build custom CRMs, trackers, and dashboards without code.',
    whyCursive:
      'Cursive sends identified visitor data to Notion databases via webhook, automatically creating entries for each new visitor. Build a prospect tracker, deal pipeline, or team visibility dashboard in Notion using real-time visitor data from your website.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Notion Database Items', description: 'Each identified visitor becomes a new item in your Notion database with all mapped properties.' },
      { cursiveField: 'Company Profiles', toolField: 'Notion Relation Properties', description: 'Company data populates related database entries for account-level organization.' },
      { cursiveField: 'Visitor Notes', toolField: 'Notion Page Content', description: 'Visitor details and visit history are written as page content within each database item.' },
      { cursiveField: 'Engagement Scores', toolField: 'Notion Number Properties', description: 'Engagement scores populate number properties for sorting and formula-based prioritization.' },
    ],
    workflows: [
      {
        title: 'Create Prospect Entries Automatically',
        description:
          'When Cursive identifies a new visitor, a webhook creates a Notion database item with name, email, company, pages viewed, and engagement score. No manual entry required. Your team finds fresh prospects in Notion every morning.',
      },
      {
        title: 'Build a Deal Tracker in Notion',
        description:
          'Add Status, Owner, and Value properties to your Notion visitor database. Use Board view to visualize your pipeline stages (New, Contacted, Meeting, Proposal, Closed). Drag prospects through stages as deals progress.',
      },
      {
        title: 'Give Your Team Full Visibility',
        description:
          'Share the Notion visitor database with your entire GTM team. Marketing sees which campaigns drive visitors, sales sees who to contact, and leadership sees pipeline health. Different Notion views give each team the perspective they need.',
      },
    ],
    setupSteps: [
      'Create a Notion database with properties: Name (title), Email (email), Company (text), Pages (text), Score (number), Date (date), Status (select).',
      'In Notion, create an integration at notion.so/my-integrations and copy the Internal Integration Token.',
      'Share your Notion database with the integration by clicking Share > Invite and selecting your integration.',
      'In Cursive, go to Integrations > Add Webhook, select Notion, and paste your integration token and database ID.',
      'Test the connection by visiting your site and confirming a new item appears in your Notion database.',
    ],
    faqs: [
      { question: 'Can I use Notion as a CRM with Cursive?', answer: 'Yes. Notion databases with Cursive data make an effective lightweight CRM. Add status, owner, and pipeline stage properties to track deals from first visit to close, all within Notion.' },
      { question: 'Do I need a paid Notion plan?', answer: 'Notion API integrations work on the free plan for personal use. For team collaboration with shared databases, you will need a Notion Team or Business plan.' },
      { question: 'Can Cursive update existing Notion entries?', answer: 'The webhook creates new entries by default. You can use a Notion automation or middleware (like Make or Zapier) to check for existing entries by email and update them instead of creating duplicates.' },
      { question: 'Can I use Notion formulas with Cursive data?', answer: 'Yes. Once visitor data is in Notion, you can use Notion formulas to calculate lead scores, days since last visit, or priority rankings based on the properties Cursive provides.' },
      { question: 'How quickly do new visitors appear in Notion?', answer: 'Webhook delivery is near real-time. New visitors typically appear in your Notion database within 30 seconds to 2 minutes of identification by Cursive.' },
    ],
    keywords: [
      'notion visitor identification',
      'notion lead database',
      'cursive notion integration',
      'notion CRM alternative',
      'notion webhook leads',
      'visitor data notion database',
      'notion sales pipeline visitors',
    ],
  },

  // ============================================================
  // DATA WAREHOUSES (3)
  // ============================================================
  {
    slug: 'snowflake',
    name: 'Snowflake',
    category: 'Data Warehouses',
    logo: '❄️',
    connectionMethod: 'webhook',
    description:
      'Snowflake is a cloud-native data warehouse that separates compute from storage, enabling scalable analytics, data sharing, and machine learning workloads. It is the backbone of modern data stacks at thousands of companies.',
    whyCursive:
      'Cursive streams identified visitor data into Snowflake, where it can be joined with product usage, CRM records, billing data, and support tickets. Build comprehensive BI dashboards, train ML models on visitor behavior, and power data-driven GTM strategies from a single source of truth.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Snowflake Visitors Table', description: 'Each identified visitor is inserted as a row in your Snowflake visitors table with all available fields.' },
      { cursiveField: 'Company Profiles', toolField: 'Snowflake Companies Table', description: 'Company data populates a companies table that can be joined with visitor records.' },
      { cursiveField: 'Visitor Events', toolField: 'Snowflake Events Table', description: 'Page views, identification events, and intent signals are streamed to an events table.' },
      { cursiveField: 'Engagement Scores', toolField: 'Snowflake Scoring Schema', description: 'Engagement scores land in a scoring schema for predictive analytics and lead prioritization.' },
    ],
    workflows: [
      {
        title: 'Centralize Visitor Data with Your Data Stack',
        description:
          'Stream Cursive visitor data into Snowflake alongside CRM data, product usage, and marketing data. Run SQL queries that join website visitors with closed deals to calculate true visitor-to-revenue conversion rates across every channel.',
      },
      {
        title: 'Join Visitors with Product Usage',
        description:
          'In Snowflake, join the Cursive visitors table with your product usage tables on email or company domain. Discover which website behaviors predict successful product adoption and which visitor segments have the highest lifetime value.',
      },
      {
        title: 'Build BI Dashboards from Visitor Data',
        description:
          'Connect Snowflake to your BI tool (Looker, Tableau, Metabase) and build dashboards powered by Cursive visitor data. Track visitor volume trends, top visiting companies, conversion funnels, and pipeline influence all from live Snowflake queries.',
      },
    ],
    setupSteps: [
      'In Snowflake, create a database and schema for Cursive data (e.g., CURSIVE.VISITORS, CURSIVE.COMPANIES, CURSIVE.EVENTS).',
      'Create a Snowflake user and role with INSERT permissions on the Cursive tables.',
      'In Cursive, go to Integrations > Add Destination and select Snowflake.',
      'Enter your Snowflake account URL, database, schema, warehouse, user, and password or key pair.',
      'Test the connection, then enable streaming. Verify data appears in Snowflake by querying the visitors table.',
    ],
    faqs: [
      { question: 'How is data loaded into Snowflake?', answer: 'Cursive can stream data via webhook to a staging area or load CSV batches via Snowflake stages. For real-time needs, webhook streaming with a COPY INTO pattern is recommended.' },
      { question: 'What Snowflake edition do I need?', answer: 'Cursive works with any Snowflake edition (Standard, Enterprise, Business Critical). The integration uses standard SQL INSERT and COPY operations that are available on all plans.' },
      { question: 'Can I use Snowflake Streams and Tasks with Cursive data?', answer: 'Yes. Set up Snowflake Streams on your Cursive tables to capture changes, then use Tasks to process new visitors incrementally for downstream analytics or enrichment.' },
      { question: 'How much Snowflake compute does this use?', answer: 'Visitor data volumes are typically small compared to product or event data. An X-Small warehouse can handle Cursive data ingestion for most companies without issue.' },
      { question: 'Can I share Cursive data with other Snowflake accounts?', answer: 'Yes. Use Snowflake Data Sharing to provide read-only access to your Cursive visitor data to partners, agencies, or other business units with their own Snowflake accounts.' },
    ],
    keywords: [
      'snowflake visitor identification',
      'snowflake lead enrichment',
      'cursive snowflake integration',
      'snowflake B2B visitor data',
      'data warehouse visitor analytics',
      'snowflake marketing data',
      'snowflake visitor pipeline',
    ],
  },
  {
    slug: 'bigquery',
    name: 'BigQuery',
    category: 'Data Warehouses',
    logo: '🔵',
    connectionMethod: 'webhook',
    description:
      'Google BigQuery is a serverless, highly scalable data warehouse designed for fast SQL analytics over large datasets. It supports streaming inserts, ML model training with BigQuery ML, and native integration with the Google Cloud ecosystem.',
    whyCursive:
      'Cursive sends visitor data to BigQuery via streaming inserts or batch loads, enabling real-time visitor analytics at scale. Join visitor data with GA4 exports, Google Ads data, and product usage for complete cross-channel attribution and ML-powered lead scoring.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'BigQuery Visitors Table', description: 'Each identified visitor is inserted into a BigQuery table with full visitor attributes.' },
      { cursiveField: 'Visitor Events', toolField: 'BigQuery Events Table (Streaming)', description: 'Real-time visitor events are streamed to BigQuery for immediate analysis.' },
      { cursiveField: 'Company Profiles', toolField: 'BigQuery Companies Dataset', description: 'Company data lands in a companies dataset for joining with visitor and CRM data.' },
      { cursiveField: 'Conversion Events', toolField: 'BigQuery Conversions Table', description: 'Conversion events (demo booked, deal closed) populate a conversions table for attribution analysis.' },
    ],
    workflows: [
      {
        title: 'Real-Time Visitor Analytics',
        description:
          'Use BigQuery streaming inserts to analyze visitor data in near real-time. Build dashboards that show who is on your site right now, trending visitor companies, and real-time conversion rates. Query visitor data alongside GA4 BigQuery exports for unified analysis.',
      },
      {
        title: 'ML Model Training for Lead Scoring',
        description:
          'Use BigQuery ML to train lead scoring models directly in SQL. Feed Cursive visitor features (pages viewed, visit frequency, company size) alongside conversion outcomes to build models that predict which visitors are most likely to become customers.',
      },
      {
        title: 'Cross-Channel Attribution',
        description:
          'Join Cursive visitor data with Google Ads, GA4, and CRM data in BigQuery to build a complete attribution model. Understand which channels drive the most identified visitors, which visitors convert, and what the true cost per qualified visitor is across channels.',
      },
    ],
    setupSteps: [
      'In Google Cloud Console, create a BigQuery dataset for Cursive data (e.g., cursive_visitors).',
      'Create a service account with BigQuery Data Editor permissions and download the JSON key file.',
      'In Cursive, go to Integrations > Add Destination and select BigQuery.',
      'Upload the service account key file and specify the project ID, dataset, and table names.',
      'Test the connection with a sample event, then verify data appears by running a SELECT query in the BigQuery console.',
    ],
    faqs: [
      { question: 'Does Cursive use streaming inserts or batch loads?', answer: 'Cursive supports both. Streaming inserts provide near real-time data availability (within seconds). Batch loads via Cloud Storage are more cost-effective for high-volume historical exports.' },
      { question: 'How much will this cost in BigQuery?', answer: 'BigQuery charges for storage and queries. Visitor data volumes are typically small (a few GB per month). Streaming insert costs are minimal. Query costs depend on your usage patterns and can be managed with partitioned tables.' },
      { question: 'Can I join Cursive data with GA4 BigQuery exports?', answer: 'Yes. This is one of the most powerful use cases. Join Cursive visitor records with GA4 event data on user_pseudo_id or email to enrich every GA4 session with company and contact information.' },
      { question: 'What about BigQuery ML for lead scoring?', answer: 'You can use BigQuery ML to train classification models (logistic regression, boosted trees) on Cursive visitor data to predict conversion likelihood. Models train directly in SQL with no external ML infrastructure needed.' },
      { question: 'Can I use Looker Studio with Cursive BigQuery data?', answer: 'Yes. Connect Looker Studio (formerly Data Studio) to your BigQuery Cursive tables to build interactive dashboards and reports that auto-refresh with new visitor data.' },
    ],
    keywords: [
      'bigquery visitor identification',
      'bigquery lead enrichment',
      'cursive bigquery integration',
      'bigquery B2B analytics',
      'bigquery visitor data warehouse',
      'bigquery ML lead scoring',
      'google cloud visitor analytics',
    ],
  },
  {
    slug: 'redshift',
    name: 'Amazon Redshift',
    category: 'Data Warehouses',
    logo: '🟥',
    connectionMethod: 'webhook',
    description:
      'Amazon Redshift is a fully managed cloud data warehouse on AWS that delivers fast query performance on structured data at petabyte scale. It integrates natively with the AWS ecosystem including S3, Glue, and SageMaker.',
    whyCursive:
      'Cursive loads identified visitor data into Redshift where it joins your existing AWS data ecosystem. Build attribution models that connect website visitors to revenue, create executive dashboards in QuickSight, and feed visitor features into SageMaker for predictive lead scoring.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Redshift Visitors Table', description: 'Each identified visitor is loaded into a Redshift visitors table with all visitor attributes.' },
      { cursiveField: 'Company Profiles', toolField: 'Redshift Companies Table', description: 'Company data populates a companies table for account-level joins and analysis.' },
      { cursiveField: 'Visitor Events', toolField: 'Redshift Events Schema', description: 'Visitor events are loaded into an events schema for behavioral analysis and funnel building.' },
      { cursiveField: 'Conversion Data', toolField: 'Redshift Conversions Table', description: 'Conversion events are loaded for attribution modeling and ROI analysis.' },
    ],
    workflows: [
      {
        title: 'Warehouse Visitor Data on AWS',
        description:
          'Load Cursive visitor data into Redshift alongside your CRM exports, product database, and billing data. Run SQL queries that trace the full customer journey from first website visit through product usage and renewal, all in one place.',
      },
      {
        title: 'Build Attribution Models',
        description:
          'Join Cursive visitor data with ad spend, email campaigns, and content engagement in Redshift. Build multi-touch attribution models in SQL that reveal which marketing channels drive the most high-value visitors and pipeline.',
      },
      {
        title: 'Executive Dashboards in QuickSight',
        description:
          'Connect Amazon QuickSight to your Redshift Cursive tables and build dashboards for leadership. Show weekly visitor trends, top visiting accounts, pipeline created from visitors, and marketing ROI, all updated automatically.',
      },
    ],
    setupSteps: [
      'In AWS, create a Redshift cluster or serverless namespace with a schema for Cursive data.',
      'Create a Redshift user with INSERT and CREATE TABLE permissions on the Cursive schema.',
      'In Cursive, go to Integrations > Add Destination and select Amazon Redshift.',
      'Enter your Redshift endpoint, port, database name, schema, user, and password.',
      'Test the connection, then enable data loading. Verify by querying the visitors table in the Redshift query editor.',
    ],
    faqs: [
      { question: 'How is data loaded into Redshift?', answer: 'Cursive can load data via S3 staging with COPY commands (recommended for batch loads) or direct INSERT for smaller real-time volumes. The S3 COPY pattern is most cost-effective and performant.' },
      { question: 'Does this work with Redshift Serverless?', answer: 'Yes. Cursive supports both provisioned Redshift clusters and Redshift Serverless. The integration uses standard SQL and JDBC connectivity that works with both options.' },
      { question: 'Can I use Redshift Spectrum with Cursive data?', answer: 'Yes. If Cursive loads data to S3 as well, you can query it with Redshift Spectrum without loading it into Redshift tables, saving storage costs for cold historical data.' },
      { question: 'How much Redshift compute does this require?', answer: 'Visitor data volumes are modest compared to clickstream or product data. A 2-node dc2.large cluster or a Redshift Serverless configuration can handle Cursive data ingestion and querying for most companies.' },
      { question: 'Can I feed Redshift data into SageMaker for ML?', answer: 'Yes. Use Redshift ML or export visitor features to S3 for SageMaker training jobs. Build predictive lead scoring models using Cursive visitor behavior as input features.' },
    ],
    keywords: [
      'redshift visitor identification',
      'redshift lead enrichment',
      'cursive redshift integration',
      'redshift B2B visitor data',
      'AWS data warehouse visitors',
      'redshift marketing analytics',
      'amazon redshift visitor pipeline',
    ],
  },

  // ============================================================
  // PROJECT MANAGEMENT (4)
  // ============================================================
  {
    slug: 'asana',
    name: 'Asana',
    category: 'Project Management',
    logo: '🎯',
    connectionMethod: 'webhook',
    description:
      'Asana is a work management platform that helps teams organize, track, and manage their projects and tasks. It offers boards, timelines, custom fields, and automation rules for streamlined collaboration.',
    whyCursive:
      'Cursive automatically creates Asana tasks when high-value visitors are identified on your website. Sales reps see follow-up tasks in their Asana workflow with visitor context already attached, ensuring no hot lead falls through the cracks.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Asana Tasks', description: 'Each high-value visitor triggers a new Asana task with visitor details in the description.' },
      { cursiveField: 'Company Profiles', toolField: 'Asana Custom Fields', description: 'Company name, size, and industry populate custom fields on the task for sorting and filtering.' },
      { cursiveField: 'Visitor Segments', toolField: 'Asana Projects/Sections', description: 'Different visitor segments route to different Asana projects or board sections.' },
      { cursiveField: 'Engagement Scores', toolField: 'Asana Priority Field', description: 'Visitor engagement scores map to Asana task priority for outreach ordering.' },
    ],
    workflows: [
      {
        title: 'Create Follow-Up Tasks for Hot Visitors',
        description:
          'When Cursive identifies a visitor with a high engagement score (pricing page, multiple visits, target account), automatically create an Asana task with the visitor name, company, email, pages visited, and suggested talking points in the task description.',
      },
      {
        title: 'Assign Tasks to Sales Reps',
        description:
          'Use Cursive segment rules and Asana project assignments to route visitor follow-up tasks to the right rep. Enterprise visitors go to the enterprise AE, mid-market to the mid-market team. Each rep sees their assigned leads in their Asana My Tasks view.',
      },
      {
        title: 'Track Outreach Progress',
        description:
          'Move Asana tasks through board columns (New Lead, Contacted, Meeting Scheduled, Qualified, Closed) as reps progress through outreach. Use Asana reporting to measure time-to-contact, conversion rates, and pipeline velocity from Cursive-sourced leads.',
      },
    ],
    setupSteps: [
      'In Asana, create a project for Cursive leads with sections matching your sales workflow (New, Contacted, Meeting, Qualified, etc.).',
      'Add custom fields for Company, Engagement Score, and Source to the project.',
      'In Cursive, go to Integrations > Add Webhook and select Asana. Authenticate with your Asana account.',
      'Map Cursive visitor fields to Asana task fields and set conditions for which visitors trigger task creation.',
      'Test by visiting your site from a qualifying company and confirming a task appears in your Asana project.',
    ],
    faqs: [
      { question: 'Can I control which visitors create Asana tasks?', answer: 'Yes. Set conditions in Cursive such as minimum engagement score, specific pages visited, company size thresholds, or target account lists. Only visitors meeting your criteria trigger task creation.' },
      { question: 'How are tasks assigned to specific team members?', answer: 'You can configure assignment rules in Cursive based on visitor attributes (territory, company size, industry) or use Asana Rules to auto-assign tasks after creation based on custom field values.' },
      { question: 'Will this create duplicate tasks for repeat visitors?', answer: 'Cursive includes deduplication logic. If a visitor has already triggered a task (matched by email), Cursive can add a comment to the existing task instead of creating a new one.' },
      { question: 'Can I use Asana automations with Cursive tasks?', answer: 'Yes. Asana Rules can trigger on new tasks from Cursive. For example, auto-assign based on custom field values, move to a section, add followers, or send notifications.' },
      { question: 'What Asana plan do I need?', answer: 'Custom fields and advanced automations require Asana Premium or Business. Basic task creation works on the free plan, but you will miss the sorting and routing capabilities.' },
    ],
    keywords: [
      'asana visitor identification',
      'asana lead enrichment',
      'cursive asana integration',
      'asana sales task automation',
      'asana lead follow-up tasks',
      'visitor data asana',
      'asana B2B lead management',
    ],
  },
  {
    slug: 'monday',
    name: 'monday.com',
    category: 'Project Management',
    logo: '📋',
    connectionMethod: 'webhook',
    description:
      'monday.com is a work operating system that lets teams build custom workflows for project management, sales pipelines, and operations. Its flexible board structure supports multiple views, automations, and integrations.',
    whyCursive:
      'Cursive creates items on your monday.com boards whenever high-value visitors are identified. Build a visual sales pipeline board where visitor leads flow from identification through outreach and closing, with all visitor context attached to each item.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'monday.com Items', description: 'Each qualified visitor creates a new item on your monday.com board with all visitor details.' },
      { cursiveField: 'Company Profiles', toolField: 'monday.com Columns', description: 'Company name, size, and industry populate dedicated columns for grouping and filtering.' },
      { cursiveField: 'Engagement Scores', toolField: 'monday.com Number Column', description: 'Engagement scores fill a number column for sorting leads by priority.' },
      { cursiveField: 'Visitor Segments', toolField: 'monday.com Groups', description: 'Different visitor segments route to different groups within the board.' },
    ],
    workflows: [
      {
        title: 'Add Visitor Leads to Pipeline Board',
        description:
          'When Cursive identifies a high-intent visitor, automatically create an item on your monday.com sales pipeline board. The item includes visitor name, email, company, pages viewed, and engagement score, giving the rep everything needed to start outreach.',
      },
      {
        title: 'Automate Lead Assignments',
        description:
          'Use monday.com automations to assign new Cursive items to reps based on column values. Route enterprise leads to senior AEs, assign by territory based on company location, or round-robin among the team for even distribution.',
      },
      {
        title: 'Track Deal Progress Visually',
        description:
          'Move items across monday.com status columns (New Lead, Contacted, Demo Scheduled, Proposal Sent, Won, Lost) as deals progress. Use the dashboard widget to show pipeline value, win rates, and average time-to-close for Cursive-sourced leads.',
      },
    ],
    setupSteps: [
      'Create a monday.com board with columns for Name, Email, Company, Pages Visited, Score, Status, and Owner.',
      'In monday.com, go to Integrations and enable the incoming webhook. Copy the webhook URL.',
      'In Cursive, go to Integrations > Add Webhook and paste the monday.com webhook URL.',
      'Map Cursive fields to monday.com columns and set conditions for which visitors trigger item creation.',
      'Test the integration by visiting your site and verifying a new item appears on your monday.com board.',
    ],
    faqs: [
      { question: 'Can I use monday.com CRM with Cursive?', answer: 'Yes. monday.com CRM boards work well with Cursive data. Visitor leads become CRM items with deal stages, contact info, and activity tracking built into the monday.com CRM template.' },
      { question: 'How do monday.com automations work with Cursive items?', answer: 'monday.com automations can trigger on new items created by Cursive. Auto-assign owners, change status, send notifications, create linked items, or push data to other tools based on column values.' },
      { question: 'Can I see Cursive leads in different monday.com views?', answer: 'Yes. Use Table, Kanban, Timeline, Chart, and Dashboard views to visualize Cursive lead data in whatever format works best for your team.' },
      { question: 'Will this create duplicate items for returning visitors?', answer: 'Configure Cursive to check for existing items by email before creating new ones. Returning visitors can update the existing item with new visit data instead of creating duplicates.' },
      { question: 'What monday.com plan is required?', answer: 'Webhook integrations and automations require the Standard plan or higher. The free plan supports manual data entry only.' },
    ],
    keywords: [
      'monday.com visitor identification',
      'monday.com lead enrichment',
      'cursive monday.com integration',
      'monday.com sales pipeline visitors',
      'monday.com lead management',
      'visitor data monday.com',
    ],
  },
  {
    slug: 'jira',
    name: 'Jira',
    category: 'Project Management',
    logo: '🔷',
    connectionMethod: 'webhook',
    description:
      'Jira by Atlassian is the most widely used project tracking tool for software development and IT teams. It supports issues, sprints, custom workflows, and extensive custom fields for tracking any type of work item.',
    whyCursive:
      'Cursive creates Jira issues when enterprise-grade visitors are identified, bridging the gap between marketing visitor data and the tools your technical sales and implementation teams already use. Track high-value prospects through your existing Jira workflows without switching tools.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Jira Issues', description: 'High-value visitors create Jira issues with visitor details in the description and custom fields.' },
      { cursiveField: 'Company Profiles', toolField: 'Jira Custom Fields', description: 'Company name, size, and industry populate Jira custom fields for filtering and JQL queries.' },
      { cursiveField: 'Visitor Segments', toolField: 'Jira Projects', description: 'Different visitor tiers route to different Jira projects (e.g., Enterprise vs. Mid-Market).' },
      { cursiveField: 'Engagement Scores', toolField: 'Jira Priority Field', description: 'Engagement scores map to Jira issue priority for triaging and sprint planning.' },
    ],
    workflows: [
      {
        title: 'Create Sales Tickets from Enterprise Visitors',
        description:
          'When Cursive identifies a visitor from a target enterprise account viewing technical documentation or API pages, create a Jira issue in your sales engineering project. The issue includes company context and technical interest areas so SEs can prepare relevant demo environments.',
      },
      {
        title: 'Track Enterprise Prospect Lifecycle',
        description:
          'Use Jira workflows to move visitor issues through stages: Identified, Research, Outreach, Meeting, Technical Evaluation, Proposal, Closed. Your team uses the same Jira board they already work in, with full visibility into prospect status.',
      },
      {
        title: 'Manage Implementation Planning',
        description:
          'When an enterprise visitor converts to a customer, link the original Cursive Jira issue to an implementation epic. All the visitor context (pages viewed, technical interests, company requirements) carries over to inform the implementation plan.',
      },
    ],
    setupSteps: [
      'In Jira, create a project for Cursive leads (e.g., "Sales Leads" or "Prospects") with a workflow matching your sales process.',
      'Add custom fields for Company, Engagement Score, Visitor Email, and Source to the project.',
      'In Cursive, go to Integrations > Add Webhook and select Jira. Enter your Jira instance URL and API token.',
      'Configure field mapping and set conditions for which visitors create Jira issues (e.g., enterprise companies, technical page views).',
      'Test the integration by visiting your site and confirming a new issue appears in your Jira project.',
    ],
    faqs: [
      { question: 'Is Jira a good fit for sales lead tracking?', answer: 'Jira works well when your sales process involves technical teams (sales engineers, solution architects) who already live in Jira. It keeps prospect context in the tool they use daily without forcing them into a separate CRM.' },
      { question: 'Can I use JQL to query Cursive visitors?', answer: 'Yes. With custom fields populated by Cursive, you can write JQL queries like "project = SALES AND Company = Acme AND priority = High" to find specific visitor leads.' },
      { question: 'Does this work with Jira Cloud and Jira Data Center?', answer: 'Cursive supports both Jira Cloud and Jira Data Center through their respective REST APIs. Configuration differs slightly but both are supported.' },
      { question: 'Can I link Cursive issues to other Jira projects?', answer: 'Yes. Use Jira issue linking to connect Cursive visitor issues to implementation epics, support tickets, or feature requests in other projects for full traceability.' },
      { question: 'How do I prevent too many Jira issues from being created?', answer: 'Set strict filters in Cursive: minimum company size, specific page visits (pricing, API docs), or target account lists. Only high-value visitors that warrant technical sales attention should create issues.' },
    ],
    keywords: [
      'jira visitor identification',
      'jira lead tracking',
      'cursive jira integration',
      'jira sales engineering',
      'jira enterprise prospect tracking',
      'visitor data jira',
      'jira B2B lead management',
    ],
  },
  {
    slug: 'clickup',
    name: 'ClickUp',
    category: 'Project Management',
    logo: '✅',
    connectionMethod: 'webhook',
    description:
      'ClickUp is an all-in-one productivity platform that combines project management, docs, goals, and chat. Its flexible hierarchy (Spaces, Folders, Lists, Tasks) and custom fields support virtually any workflow.',
    whyCursive:
      'Cursive creates ClickUp tasks when qualified visitors are identified, putting lead follow-up directly in your team\'s daily workflow. Use ClickUp views to manage your visitor pipeline, assign reps, and track outreach alongside other work.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'ClickUp Tasks', description: 'Each qualified visitor creates a ClickUp task with visitor details in the description and custom fields.' },
      { cursiveField: 'Company Profiles', toolField: 'ClickUp Custom Fields', description: 'Company name, size, and industry populate custom fields for sorting and grouping.' },
      { cursiveField: 'Visitor Segments', toolField: 'ClickUp Lists', description: 'Different visitor segments route to different ClickUp Lists within your sales Space.' },
      { cursiveField: 'Engagement Scores', toolField: 'ClickUp Priority', description: 'Visitor engagement maps to ClickUp task priority (Urgent, High, Normal, Low).' },
      { cursiveField: 'Visit Timestamps', toolField: 'ClickUp Due Dates', description: 'Follow-up due dates are set automatically based on visitor recency and engagement level.' },
    ],
    workflows: [
      {
        title: 'Create Follow-Up Tasks from Visitor Data',
        description:
          'When Cursive identifies a visitor meeting your criteria, a ClickUp task is created with the visitor name, email, company, pages viewed, and engagement score. The task lands in the appropriate List and is ready for rep assignment.',
      },
      {
        title: 'Assign and Route to the Right Rep',
        description:
          'Use ClickUp Automations to assign tasks based on custom field values. Route enterprise leads to senior reps, mid-market to the mid-market team, and set due dates based on engagement urgency. Reps see assigned tasks in their ClickUp Home.',
      },
      {
        title: 'Build Pipeline Views for Leadership',
        description:
          'Create a Board view in ClickUp to visualize Cursive leads by status (New, Contacted, Meeting, Qualified, Won). Add a Dashboard with widgets showing total leads, pipeline value, conversion rates, and rep performance from Cursive-sourced visitors.',
      },
    ],
    setupSteps: [
      'In ClickUp, create a Space and List for Cursive leads with statuses matching your sales process.',
      'Add custom fields for Company, Email, Engagement Score, Pages Visited, and Source.',
      'In Cursive, go to Integrations > Add Webhook and select ClickUp. Authenticate with your ClickUp API token.',
      'Map Cursive visitor fields to ClickUp task fields and set conditions for task creation triggers.',
      'Test the connection by visiting your site and confirming a new task appears in your ClickUp List.',
    ],
    faqs: [
      { question: 'Can I use ClickUp as a CRM for Cursive leads?', answer: 'Yes. ClickUp\'s CRM template or a custom List with deal stages works well as a lightweight CRM. Cursive populates the leads, and your team manages them through ClickUp\'s Board and List views.' },
      { question: 'How do ClickUp Automations work with Cursive tasks?', answer: 'ClickUp Automations can trigger when new tasks are created by Cursive. Auto-assign, change status, add watchers, send emails, or move tasks between Lists based on custom field values.' },
      { question: 'Can I see Cursive data in ClickUp Dashboards?', answer: 'Yes. ClickUp Dashboards can display widgets for task counts, custom field summaries, status breakdowns, and time tracking data from Cursive-created tasks.' },
      { question: 'What ClickUp plan supports webhooks?', answer: 'ClickUp webhooks and API access are available on the Free plan and above. Automations with advanced conditions require the Business plan or higher.' },
      { question: 'How do I prevent duplicate tasks for returning visitors?', answer: 'Cursive checks for existing tasks by visitor email before creating new ones. Returning visitors update the existing task with new visit information instead of creating duplicates.' },
    ],
    keywords: [
      'clickup visitor identification',
      'clickup lead enrichment',
      'cursive clickup integration',
      'clickup sales pipeline visitors',
      'clickup task automation leads',
      'visitor data clickup',
      'clickup B2B lead management',
    ],
  },

  // ============================================================
  // OTHER HIGH-VALUE (4)
  // ============================================================
  {
    slug: 'intercom',
    name: 'Intercom',
    category: 'Customer Messaging',
    logo: '💬',
    connectionMethod: 'webhook',
    description:
      'Intercom is a customer messaging platform that combines live chat, chatbots, help center, and product tours. It helps businesses engage website visitors, support customers, and drive conversions through targeted messaging.',
    whyCursive:
      'Cursive enriches Intercom with visitor identity and company data before they even start a chat. When a visitor opens the Intercom widget, your support and sales teams already know who they are, what company they represent, and what pages they viewed, enabling faster, more relevant conversations.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'Intercom Contacts', description: 'Cursive-identified visitors are created or updated as Intercom contacts with name, email, and traits.' },
      { cursiveField: 'Company Profiles', toolField: 'Intercom Companies', description: 'Visitor company data creates or updates Intercom company records, linking contacts to accounts.' },
      { cursiveField: 'Visitor Events', toolField: 'Intercom Events', description: 'Page views and intent signals are sent as Intercom events for triggering automated messages.' },
      { cursiveField: 'Engagement Scores', toolField: 'Intercom Custom Attributes', description: 'Visitor engagement scores become Intercom custom attributes for segmentation and routing.' },
    ],
    workflows: [
      {
        title: 'Enrich Chat Visitors with Company Context',
        description:
          'Before a visitor opens the chat widget, Cursive has already identified them and sent their name, company, and browsing history to Intercom. When they start a conversation, the agent sees full context immediately, no need to ask "What company are you with?"',
      },
      {
        title: 'Trigger Proactive Messages to Hot Visitors',
        description:
          'Use Cursive engagement scores in Intercom to trigger proactive messages. When a visitor from a target account views the pricing page for the third time, Intercom automatically sends a personalized message offering to help, with the visitor\'s name and company already known.',
      },
      {
        title: 'Route High-Value Visitors to Sales',
        description:
          'Configure Intercom routing rules to send conversations from Cursive-identified enterprise visitors directly to your sales team. Smaller companies go to self-serve support. Engagement score and company size determine which queue handles each visitor.',
      },
    ],
    setupSteps: [
      'In Cursive, navigate to Integrations and select Intercom.',
      'Authenticate with your Intercom account using OAuth or paste your Intercom API access token.',
      'Map Cursive visitor fields to Intercom contact attributes (name, email, company, custom attributes).',
      'Configure which visitor events to send to Intercom (page views, identification, intent signals).',
      'Test by visiting your site and checking that the Intercom contact record shows Cursive-enriched data.',
    ],
    faqs: [
      { question: 'Does this work with Intercom Fin (AI chatbot)?', answer: 'Yes. Cursive data enriches the contact record that Fin accesses. Fin can use company attributes and engagement scores in conversation routing and handoff logic.' },
      { question: 'Can I trigger Intercom Series from Cursive data?', answer: 'Yes. Cursive custom attributes and events can trigger Intercom Series (automated message sequences). Target visitors by engagement score, company size, or specific page views.' },
      { question: 'Will Cursive create duplicate Intercom contacts?', answer: 'No. Cursive matches on email address. If a contact already exists in Intercom, Cursive updates the existing record with new data instead of creating a duplicate.' },
      { question: 'How does this affect my Intercom pricing?', answer: 'Intercom charges based on active contacts. Cursive-identified visitors who are created as Intercom contacts count toward your active seat/contact limits. Use filters to only sync visitors likely to engage.' },
      { question: 'Can I use Cursive data in Intercom reporting?', answer: 'Yes. Cursive custom attributes and company data appear in Intercom reporting. Segment conversations and performance metrics by company size, industry, or engagement score.' },
    ],
    keywords: [
      'intercom visitor identification',
      'intercom lead enrichment',
      'cursive intercom integration',
      'intercom company data enrichment',
      'intercom proactive messaging visitors',
      'live chat visitor identification',
      'intercom sales routing',
    ],
  },
  {
    slug: 'calendly',
    name: 'Calendly',
    category: 'Scheduling',
    logo: '📅',
    connectionMethod: 'webhook',
    description:
      'Calendly is a scheduling automation platform that eliminates back-and-forth emails for booking meetings. It offers round-robin scheduling, team pages, routing forms, and calendar integrations used by millions of professionals.',
    whyCursive:
      'Cursive identifies high-intent visitors and can trigger personalized Calendly meeting links, pre-filling visitor context so reps know who they are meeting and why. Track which visitors book meetings and measure show rates to optimize your visitor-to-meeting pipeline.',
    dataMapping: [
      { cursiveField: 'Visitor Emails', toolField: 'Calendly Invitees', description: 'Identified visitor emails are matched to Calendly invitees for attribution tracking.' },
      { cursiveField: 'Visitor Names', toolField: 'Calendly Invitee Name', description: 'Pre-fill the invitee name field when directing visitors to Calendly booking pages.' },
      { cursiveField: 'Company Profiles', toolField: 'Calendly UTM/Custom Fields', description: 'Pass company name and context as UTM parameters or custom questions for rep preparation.' },
      { cursiveField: 'Booking Events', toolField: 'Cursive Conversion Events', description: 'When a visitor books via Calendly, the event syncs back to Cursive as a conversion.' },
    ],
    workflows: [
      {
        title: 'Auto-Schedule Meetings with Hot Visitors',
        description:
          'When Cursive identifies a high-engagement visitor (e.g., pricing page plus case study plus return visit), trigger an email or on-site popup with a personalized Calendly link. The link pre-fills the visitor name and company, reducing friction to book.',
      },
      {
        title: 'Pre-Fill Meeting Context for Reps',
        description:
          'When a visitor books through a Cursive-triggered Calendly link, the meeting invitation includes pages visited, engagement score, company size, and industry. The rep walks into the meeting fully prepared without any pre-meeting research.',
      },
      {
        title: 'Track Visitor-to-Meeting Show Rates',
        description:
          'Correlate Cursive visitor identification data with Calendly booking and attendance data. Measure what percentage of identified visitors book meetings, what percentage attend, and which visitor attributes predict highest show rates.',
      },
    ],
    setupSteps: [
      'In Calendly, go to Integrations > Webhooks and create a webhook subscription for event.created notifications.',
      'Copy the webhook URL and configure it as an inbound webhook in Cursive to receive booking confirmations.',
      'In Cursive, configure outbound visitor triggers that include Calendly booking links with UTM parameters for visitor context.',
      'Map Cursive visitor fields to Calendly UTM parameters or custom invitee questions.',
      'Test by triggering a high-engagement visitor event and confirming the Calendly link is generated with pre-filled context.',
    ],
    faqs: [
      { question: 'Can Cursive automatically send Calendly links to visitors?', answer: 'Yes. When a visitor meets your engagement criteria, Cursive can trigger an email or on-site popup containing a personalized Calendly link. The link can include UTM parameters with visitor context.' },
      { question: 'How does meeting context get passed to the rep?', answer: 'Cursive passes visitor data (company, pages, score) as UTM parameters or Calendly custom questions. The rep sees this context in the meeting confirmation and calendar invite.' },
      { question: 'Can I track which visitors booked meetings?', answer: 'Yes. Calendly sends booking webhooks back to Cursive, where they are logged as conversion events. You can track the full funnel from visitor identification through meeting booking.' },
      { question: 'Does this work with Calendly round-robin?', answer: 'Yes. Cursive works with all Calendly event types including round-robin, collective, and team pages. The visitor context is available regardless of which team member is assigned the meeting.' },
      { question: 'Can I measure meeting show rates by visitor segment?', answer: 'Yes. By matching Calendly booking and attendance data with Cursive visitor segments, you can measure show rates by company size, industry, engagement level, or any other Cursive attribute.' },
    ],
    keywords: [
      'calendly visitor identification',
      'calendly lead scheduling',
      'cursive calendly integration',
      'calendly meeting booking visitors',
      'auto-schedule meetings website visitors',
      'calendly pre-fill visitor data',
    ],
  },
  {
    slug: 'typeform',
    name: 'Typeform',
    category: 'Forms & Surveys',
    logo: '📝',
    connectionMethod: 'webhook',
    description:
      'Typeform is a form and survey platform known for its conversational, one-question-at-a-time design. It supports hidden fields, logic jumps, and integrations that make it powerful for lead qualification, surveys, and interactive content.',
    whyCursive:
      'Cursive pre-fills Typeform hidden fields with visitor identity and company data, so when a visitor starts a Typeform survey, you already know who they are. This means shorter forms (no need to ask for name and company), personalized questions, and richer qualification data.',
    dataMapping: [
      { cursiveField: 'Visitor Name', toolField: 'Typeform Hidden Field (name)', description: 'Pre-fill the visitor name in a Typeform hidden field so the form can greet them personally.' },
      { cursiveField: 'Visitor Email', toolField: 'Typeform Hidden Field (email)', description: 'Pre-fill the email field so visitors do not need to type it, reducing form abandonment.' },
      { cursiveField: 'Company Name', toolField: 'Typeform Hidden Field (company)', description: 'Pass company name for personalized questions and skip fields the visitor does not need to answer.' },
      { cursiveField: 'Form Responses', toolField: 'Cursive Visitor Enrichment', description: 'Typeform responses sync back to Cursive, enriching the visitor record with qualification data.' },
    ],
    workflows: [
      {
        title: 'Pre-Fill Forms with Visitor Data',
        description:
          'When a Cursive-identified visitor clicks a CTA that opens a Typeform, their name, email, and company are passed as hidden fields. The form skips identity questions and jumps straight to qualification questions, resulting in higher completion rates.',
      },
      {
        title: 'Personalize Survey Questions',
        description:
          'Use Cursive company data in Typeform logic jumps. If the visitor is from an enterprise company, show enterprise-specific questions. If they are from a startup, ask different questions. Tailor the experience based on who they are, not just what they answer.',
      },
      {
        title: 'Qualify Leads with Rich Context',
        description:
          'Combine Typeform responses (budget, timeline, decision process) with Cursive visitor data (pages viewed, engagement score, company size) for a complete lead qualification picture. Route qualified leads to sales with both behavioral and self-reported data.',
      },
    ],
    setupSteps: [
      'In Typeform, add hidden fields to your form for name, email, company, and any other Cursive fields you want to pass.',
      'Copy the Typeform URL with hidden field parameters (e.g., ?name=xxx&email=xxx&company=xxx).',
      'In Cursive, configure your CTA links or popups to use the Typeform URL with dynamic hidden field values from the visitor record.',
      'In Typeform, set up a webhook to send responses back to Cursive for visitor record enrichment.',
      'Test by visiting your site as an identified visitor, clicking the Typeform CTA, and confirming hidden fields are pre-filled.',
    ],
    faqs: [
      { question: 'What are Typeform hidden fields?', answer: 'Hidden fields are form parameters that are filled programmatically (not by the respondent). Cursive passes visitor data as hidden fields in the Typeform URL, so the data is captured without asking the visitor to type it.' },
      { question: 'Does pre-filling reduce form completion rates?', answer: 'The opposite. Pre-filling identity fields means shorter forms with fewer questions, which significantly increases completion rates. Visitors appreciate not having to enter information you already know.' },
      { question: 'Can I use Typeform logic jumps with Cursive data?', answer: 'Yes. Hidden field values from Cursive can drive Typeform logic jumps. For example, show different questions based on company size or skip the email field if it is already pre-filled.' },
      { question: 'How do Typeform responses get back to Cursive?', answer: 'Configure a Typeform webhook that sends completed responses to Cursive. The response data is matched to the visitor record by email and appended as enrichment data.' },
      { question: 'Can I use this with Typeform quizzes and calculators?', answer: 'Yes. Any Typeform that supports hidden fields works with Cursive pre-filling. This includes quizzes, calculators, surveys, lead forms, and any other Typeform content type.' },
    ],
    keywords: [
      'typeform visitor identification',
      'typeform lead qualification',
      'cursive typeform integration',
      'typeform hidden fields pre-fill',
      'typeform personalized forms',
      'visitor data typeform',
      'typeform B2B lead capture',
    ],
  },
  {
    slug: 'gohighlevel',
    name: 'GoHighLevel',
    category: 'Marketing Automation',
    logo: '🚀',
    connectionMethod: 'native',
    description:
      'GoHighLevel is an all-in-one marketing and sales platform built for agencies and SMBs. It combines CRM, email marketing, SMS, funnels, scheduling, and pipeline management in a single white-label-ready platform.',
    whyCursive:
      'Cursive offers a native GoHighLevel integration that automatically creates contacts, builds pipeline opportunities, and triggers automations when website visitors are identified. No webhook configuration needed. Visitor data flows directly into GoHighLevel with full two-way sync.',
    dataMapping: [
      { cursiveField: 'Identified Visitors', toolField: 'GoHighLevel Contacts', description: 'Each identified visitor is automatically created as a GoHighLevel contact with full profile data.' },
      { cursiveField: 'Visitor Intent Signals', toolField: 'GoHighLevel Opportunities', description: 'High-intent visitors create pipeline opportunities with stage, value, and visitor context.' },
      { cursiveField: 'Company Profiles', toolField: 'GoHighLevel Custom Fields', description: 'Company data populates GoHighLevel custom fields for segmentation and workflow triggers.' },
      { cursiveField: 'Engagement Scores', toolField: 'GoHighLevel Tags', description: 'Engagement tiers are applied as GoHighLevel tags for automation triggering and list segmentation.' },
      { cursiveField: 'Visitor Events', toolField: 'GoHighLevel Workflow Triggers', description: 'Visitor events (page view, return visit, form view) trigger GoHighLevel workflows and automations.' },
    ],
    workflows: [
      {
        title: 'Auto-Create Contacts from Visitors',
        description:
          'The native integration automatically creates a GoHighLevel contact for every identified visitor. Name, email, company, phone (if available), and visitor context are all populated. No manual import or webhook setup required.',
      },
      {
        title: 'Build Pipeline from Visitor Intent',
        description:
          'When Cursive identifies a high-intent visitor (pricing page, multiple visits, target account), automatically create a GoHighLevel pipeline opportunity. The opportunity includes deal stage, estimated value based on company size, and full visitor context for the assigned rep.',
      },
      {
        title: 'Trigger GoHighLevel Automations',
        description:
          'Cursive visitor events trigger GoHighLevel workflows. When a visitor is identified, start a nurture email sequence. When they return to the pricing page, send an SMS. When engagement score crosses a threshold, notify the sales team via GoHighLevel\'s internal notification system.',
      },
    ],
    setupSteps: [
      'In Cursive, go to Integrations and select GoHighLevel (Native).',
      'Click Connect and authenticate with your GoHighLevel account credentials.',
      'Select which GoHighLevel sub-account (location) to sync visitor data to.',
      'Map Cursive visitor fields to GoHighLevel contact fields and configure pipeline settings.',
      'Enable the integration. Visitor data begins flowing to GoHighLevel immediately with no additional configuration.',
    ],
    faqs: [
      { question: 'Why is GoHighLevel a native integration instead of webhook?', answer: 'GoHighLevel is one of Cursive\'s native integrations because of its popularity with agencies and SMBs. The native integration provides deeper functionality including two-way sync, pipeline creation, and workflow triggers that go beyond what a webhook can offer.' },
      { question: 'Does this work with GoHighLevel white-label accounts?', answer: 'Yes. The integration works with any GoHighLevel account, including white-label versions. Connect at the sub-account level to sync visitor data to the correct location.' },
      { question: 'Can I trigger GoHighLevel workflows from Cursive events?', answer: 'Yes. Cursive visitor events (identification, page view, intent signal) can trigger GoHighLevel workflows. Build multi-step automations that combine email, SMS, tasks, and pipeline updates based on visitor behavior.' },
      { question: 'How does the two-way sync work?', answer: 'Cursive creates and updates contacts in GoHighLevel, and GoHighLevel contact updates (tags added, pipeline stage changed) sync back to Cursive. This keeps both systems in sync without manual data management.' },
      { question: 'Can I use this with GoHighLevel\'s funnel builder?', answer: 'Yes. Visitors identified on pages built with GoHighLevel funnels are captured by Cursive and synced as contacts. Funnel step progression combined with Cursive identification creates a complete conversion picture.' },
    ],
    keywords: [
      'gohighlevel visitor identification',
      'gohighlevel lead enrichment',
      'cursive gohighlevel integration',
      'gohighlevel CRM automation',
      'gohighlevel pipeline visitors',
      'gohighlevel native integration',
      'gohighlevel agency visitor tracking',
      'highlevel website visitor identification',
    ],
  },
]

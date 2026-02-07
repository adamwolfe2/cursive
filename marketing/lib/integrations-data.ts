import { integrationsBatch2 } from './integrations-data-2'

export type ConnectionMethod = 'native' | 'webhook' | 'csv' | 'zapier' | 'coming-soon'

export interface Integration {
  slug: string
  name: string
  category: string
  logo: string
  connectionMethod: ConnectionMethod
  description: string
  whyCursive: string
  dataMapping: { cursiveField: string; toolField: string; description: string }[]
  workflows: { title: string; description: string }[]
  setupSteps: string[]
  faqs: { question: string; answer: string }[]
  keywords: string[]
}

export const integrations: Integration[] = [
  // ─── CRMs ──────────────────────────────────────────────────────────────
  {
    slug: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    logo: '☁️',
    connectionMethod: 'webhook',
    description:
      'Salesforce is the world\'s leading CRM platform, used by enterprises and growing businesses to manage sales pipelines, customer relationships, and revenue operations. It offers deep customization through custom objects, flows, and an extensive AppExchange ecosystem.',
    whyCursive:
      'Connecting Cursive\'s visitor identification data to Salesforce lets your reps see exactly which companies and contacts are visiting your site before they ever fill out a form. This bridges the gap between anonymous web traffic and your pipeline, enabling proactive outreach to high-intent prospects.',
    dataMapping: [
      { cursiveField: 'company_name', toolField: 'Lead.Company / Account.Name', description: 'Maps the identified company to a Salesforce Lead or existing Account record' },
      { cursiveField: 'email', toolField: 'Lead.Email / Contact.Email', description: 'Creates or matches a Lead or Contact using the visitor\'s email address' },
      { cursiveField: 'page_views', toolField: 'Activity.Subject', description: 'Logs page views as Activities on the related Lead or Contact for rep visibility' },
      { cursiveField: 'intent_score', toolField: 'Lead.Rating / Custom Field', description: 'Populates lead rating or a custom intent score field to prioritize follow-up' },
      { cursiveField: 'industry', toolField: 'Lead.Industry / Account.Industry', description: 'Sets the industry field for segmentation and territory routing' },
      { cursiveField: 'visit_timestamp', toolField: 'Task.ActivityDate', description: 'Records the visit date on a Task so reps know recency of engagement' },
    ],
    workflows: [
      { title: 'Auto-create Leads from anonymous visitors', description: 'When Cursive identifies a new visitor, automatically create a Salesforce Lead with company details, job title, and the pages they viewed, then assign it via your existing lead assignment rules.' },
      { title: 'Update Contacts with real-time page views', description: 'For visitors who match existing Contacts, log each page view as an Activity so account executives see website engagement directly in the Contact timeline.' },
      { title: 'Trigger Opportunities from pricing page visits', description: 'When a known contact visits your pricing or demo page, automatically create an Opportunity in Salesforce and alert the account owner to strike while intent is high.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Salesforce.',
      'Configure a webhook endpoint pointing to your Salesforce Web-to-Lead URL or a middleware like Zapier.',
      'Map Cursive fields to your Salesforce Lead, Contact, and Activity fields.',
      'Send a test visitor event to confirm the Lead appears in Salesforce.',
      'Activate the integration and set filters (e.g., only send visitors with intent score above 50).',
    ],
    faqs: [
      { question: 'Does Cursive create duplicate Leads in Salesforce?', answer: 'Cursive sends the visitor\'s email and company name with each event. You can configure deduplication rules in Salesforce or your middleware to match on email before creating new records.' },
      { question: 'Can I map Cursive data to custom Salesforce objects?', answer: 'Yes. When using a middleware like Zapier or Make, you can route Cursive webhook data to any standard or custom Salesforce object, including custom fields.' },
      { question: 'Will this work with Salesforce Professional Edition?', answer: 'Salesforce Professional Edition supports Web-to-Lead and API access with add-ons. Webhook-based integration works with all editions that allow inbound data.' },
      { question: 'How quickly does visitor data appear in Salesforce?', answer: 'Webhook delivery is near real-time, typically within 5-10 seconds. Lead creation depends on your Salesforce instance and any automation that runs on record creation.' },
      { question: 'Can I trigger Salesforce Flows from Cursive data?', answer: 'Absolutely. Once a Lead or Activity is created, you can use Salesforce Flow to trigger any downstream automation, such as sending an email, creating a Task, or updating a related Opportunity.' },
    ],
    keywords: ['salesforce visitor identification', 'salesforce lead enrichment', 'cursive salesforce integration', 'salesforce website visitor tracking', 'salesforce intent data', 'deanonymize salesforce leads', 'salesforce web-to-lead enrichment', 'B2B salesforce integration'],
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    logo: '🟠',
    connectionMethod: 'native',
    description:
      'HubSpot is an all-in-one CRM platform with hubs for marketing, sales, service, and operations. Its free CRM tier and intuitive interface make it popular with startups and mid-market teams looking to unify their go-to-market stack.',
    whyCursive:
      'Cursive\'s native HubSpot integration pushes identified visitor data directly into your CRM without any middleware. Your marketing and sales teams get enriched contact records and real-time visibility into which prospects are actively researching your product.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Creates or updates a HubSpot Contact using the identified email address' },
      { cursiveField: 'company_name', toolField: 'Company.name', description: 'Creates or associates a HubSpot Company record with the visitor\'s organization' },
      { cursiveField: 'pages_viewed', toolField: 'Contact.recent_page_views (custom)', description: 'Stores a list of viewed pages on a custom contact property for sales context' },
      { cursiveField: 'intent_score', toolField: 'Contact.lead_score (custom)', description: 'Feeds into HubSpot lead scoring to prioritize high-intent visitors' },
      { cursiveField: 'referral_source', toolField: 'Contact.original_source_drill_down_1', description: 'Captures how the visitor found your site to attribute marketing channels' },
      { cursiveField: 'employee_count', toolField: 'Company.numberofemployees', description: 'Populates company size for segmentation and ideal customer profile filtering' },
    ],
    workflows: [
      { title: 'Enrich existing contacts with visit behavior', description: 'When a known HubSpot contact visits your site, Cursive automatically updates their record with pages viewed, visit duration, and intent score so reps have full context before outreach.' },
      { title: 'Create deals from high-intent visitors', description: 'Automatically create a HubSpot Deal when a visitor with an intent score above your threshold views your pricing or demo page, assigning it to the appropriate sales rep.' },
      { title: 'Trigger HubSpot workflows from visitor events', description: 'Use Cursive visitor events as enrollment triggers for HubSpot Workflows to send targeted emails, create tasks, or update lifecycle stages based on real-time website behavior.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and click Connect HubSpot.',
      'Authorize Cursive via OAuth to grant access to your HubSpot portal.',
      'Choose which Cursive fields to sync and map them to HubSpot Contact and Company properties.',
      'Send a test event to verify the Contact and Company appear correctly in HubSpot.',
      'Enable the integration and configure filters such as minimum intent score or specific page visits.',
    ],
    faqs: [
      { question: 'Does the native HubSpot integration require a paid HubSpot plan?', answer: 'No. The native integration works with HubSpot\'s free CRM. However, features like Workflows and lead scoring require HubSpot Marketing Hub Starter or higher.' },
      { question: 'How does Cursive handle duplicate contacts in HubSpot?', answer: 'Cursive matches on email address. If a contact already exists, it updates the existing record rather than creating a duplicate.' },
      { question: 'Can I use Cursive data in HubSpot lead scoring?', answer: 'Yes. Cursive can write to custom properties that you then reference in HubSpot\'s lead scoring rules, combining visit behavior with your other scoring criteria.' },
      { question: 'Will Cursive overwrite data my reps have manually entered?', answer: 'You control which fields Cursive writes to. You can configure it to only populate empty fields or to always update, depending on your preference.' },
      { question: 'How often does data sync between Cursive and HubSpot?', answer: 'The native integration syncs in near real-time. When a visitor is identified, their data appears in HubSpot within seconds.' },
    ],
    keywords: ['hubspot visitor identification', 'hubspot lead enrichment', 'cursive hubspot integration', 'hubspot website visitors', 'hubspot intent data', 'hubspot contact enrichment', 'identify hubspot website visitors', 'hubspot deanonymization'],
  },
  {
    slug: 'pipedrive',
    name: 'Pipedrive',
    category: 'CRM',
    logo: '🟢',
    connectionMethod: 'webhook',
    description:
      'Pipedrive is a sales-focused CRM built around visual pipeline management. Its activity-based selling methodology helps sales teams stay organized, track deals through stages, and close more effectively with minimal administrative overhead.',
    whyCursive:
      'Feeding Cursive visitor data into Pipedrive gives your sales team a head start on every deal. Instead of waiting for inbound forms, reps see which companies are actively browsing your site and can initiate conversations with prospects who are already showing buying signals.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Person.email', description: 'Creates or matches a Pipedrive Person record using the visitor\'s identified email' },
      { cursiveField: 'company_name', toolField: 'Organization.name', description: 'Creates or links a Pipedrive Organization to the identified visitor' },
      { cursiveField: 'pages_viewed', toolField: 'Activity.note', description: 'Logs visited pages as an Activity note so reps see engagement context' },
      { cursiveField: 'intent_score', toolField: 'Person.custom_field (Intent Score)', description: 'Stores the visitor intent score on a custom Person field for filtering and sorting' },
      { cursiveField: 'job_title', toolField: 'Person.name + Note', description: 'Adds job title context to the Person record or a linked note' },
      { cursiveField: 'visit_count', toolField: 'Organization.custom_field (Visit Count)', description: 'Tracks total visits from an organization to gauge account-level interest' },
    ],
    workflows: [
      { title: 'Create a Person from each identified visitor', description: 'When Cursive identifies a new visitor, automatically create a Pipedrive Person with their email, company, and job title, linked to the appropriate Organization.' },
      { title: 'Add Activity for every significant page view', description: 'Log an Activity on the Person record each time they view a high-value page like pricing, case studies, or product features, giving reps a timeline of engagement.' },
      { title: 'Create a Deal from intent signals', description: 'When a visitor\'s intent score crosses your threshold or they visit your pricing page multiple times, automatically create a Deal in your pipeline and assign it to the appropriate rep.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Pipedrive.',
      'Copy the webhook URL provided and configure it in your Pipedrive automation tool or middleware.',
      'Map Cursive data fields to Pipedrive Person, Organization, and Activity fields.',
      'Trigger a test event from Cursive and confirm the Person and Activity appear in Pipedrive.',
      'Activate the integration and set your intent score threshold for Deal creation.',
    ],
    faqs: [
      { question: 'Can Cursive create Deals automatically in Pipedrive?', answer: 'Yes. By configuring your webhook or middleware to trigger on high-intent events, Cursive data can create Deals in your chosen pipeline stage.' },
      { question: 'Does this integration support Pipedrive custom fields?', answer: 'Yes. You can map Cursive fields like intent score and visit count to any custom field you\'ve created in Pipedrive.' },
      { question: 'Will Activities clutter my Pipedrive timeline?', answer: 'You can filter which page views generate Activities. Most teams only log visits to key pages like pricing, demo, or case study pages.' },
      { question: 'Can I use Cursive data with Pipedrive\'s Smart Contact Data?', answer: 'Cursive data complements Smart Contact Data by adding behavioral signals. You can use both to get a complete picture of who a prospect is and what they care about.' },
      { question: 'What happens if a visitor matches multiple People in Pipedrive?', answer: 'Matching is done by email, which is unique per Person in Pipedrive. If no email match is found, a new Person is created.' },
    ],
    keywords: ['pipedrive visitor identification', 'pipedrive lead enrichment', 'cursive pipedrive integration', 'pipedrive website visitors', 'pipedrive intent data', 'identify pipedrive leads', 'pipedrive sales intelligence'],
  },
  {
    slug: 'zoho-crm',
    name: 'Zoho CRM',
    category: 'CRM',
    logo: '🔴',
    connectionMethod: 'webhook',
    description:
      'Zoho CRM is a comprehensive customer relationship management platform within the larger Zoho ecosystem. It offers territory management, advanced analytics, and AI-powered sales assistant Zia, making it a strong choice for teams already using Zoho\'s suite of business apps.',
    whyCursive:
      'Integrating Cursive with Zoho CRM lets you leverage visitor identification within Zoho\'s territory management and assignment rules. When a visitor is identified, they can be automatically routed to the right sales rep based on geography, industry, or company size.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Lead.Email / Contact.Email', description: 'Creates a Zoho Lead or matches an existing Contact by email address' },
      { cursiveField: 'company_name', toolField: 'Lead.Company / Account.Account_Name', description: 'Populates the company field on a Lead or links to an existing Account' },
      { cursiveField: 'country', toolField: 'Lead.Country', description: 'Sets the country for Zoho territory assignment rules to route to the correct rep' },
      { cursiveField: 'intent_score', toolField: 'Lead.Lead_Score (custom)', description: 'Maps to a custom scoring field that works alongside Zoho\'s native scoring' },
      { cursiveField: 'industry', toolField: 'Lead.Industry', description: 'Sets the industry picklist value for segmentation and reporting' },
      { cursiveField: 'pages_viewed', toolField: 'Note.Note_Content', description: 'Attaches page view details as a Note on the Lead or Contact record' },
    ],
    workflows: [
      { title: 'Auto-assign leads by territory', description: 'When Cursive identifies a visitor, create a Zoho Lead with their country and company data, and let Zoho\'s territory management rules automatically assign it to the right regional sales rep.' },
      { title: 'Enrich existing contacts with visit data', description: 'When a visitor matches an existing Zoho Contact, attach a Note with their recent page views and update their lead score so account managers know about renewed interest.' },
      { title: 'Track visitor-to-deal conversion', description: 'Use Zoho\'s analytics to trace which Cursive-identified visitors eventually converted to Deals, measuring the ROI of your visitor identification investment.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Zoho CRM.',
      'Set up a webhook URL using Zoho Flow or a middleware like Zapier to receive Cursive events.',
      'Map Cursive fields to your Zoho Lead, Contact, and Note fields, including any custom fields.',
      'Send a test event and verify the Lead appears in Zoho CRM with correct territory assignment.',
      'Enable the integration and configure filters for minimum intent score or specific visitor criteria.',
    ],
    faqs: [
      { question: 'Does this work with Zoho CRM Free Edition?', answer: 'Zoho CRM Free Edition has limited API and automation capabilities. For full webhook support and workflow rules, you\'ll need Zoho CRM Standard or higher.' },
      { question: 'Can I use Zoho Flow to process Cursive webhooks?', answer: 'Yes. Zoho Flow can receive Cursive webhooks and route data to Zoho CRM, Zoho Desk, or any other Zoho app in your ecosystem.' },
      { question: 'How does this interact with Zoho\'s Zia AI?', answer: 'Once Cursive data is in Zoho CRM, Zia can analyze visitor patterns alongside your other CRM data to provide predictions and recommendations.' },
      { question: 'Can I map Cursive data to Zoho custom modules?', answer: 'Yes. Using Zoho Flow or a middleware, you can route Cursive data to any standard or custom module in your Zoho CRM instance.' },
      { question: 'Will Cursive data respect my Zoho territory rules?', answer: 'Yes. As long as the Lead includes country or region data, Zoho\'s territory assignment rules will apply just as they would for any other Lead source.' },
    ],
    keywords: ['zoho crm visitor identification', 'zoho crm lead enrichment', 'cursive zoho integration', 'zoho website visitor tracking', 'zoho crm intent data', 'zoho lead routing', 'zoho crm B2B visitors'],
  },
  {
    slug: 'close',
    name: 'Close',
    category: 'CRM',
    logo: '📞',
    connectionMethod: 'webhook',
    description:
      'Close is a CRM built for inside sales teams, with built-in calling, SMS, and email sequences. Its focus on communication velocity and pipeline speed makes it ideal for high-volume outbound teams that need to move fast.',
    whyCursive:
      'Pairing Cursive with Close means your inside sales team gets real-time alerts when target accounts visit your site, and new leads flow directly into sequences. Instead of cold outreach, reps can reference the exact pages a prospect viewed during their call.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Creates or matches a Close Contact by email and links it to the appropriate Lead' },
      { cursiveField: 'company_name', toolField: 'Lead.display_name', description: 'Creates a Close Lead (company-level record) with the identified company name' },
      { cursiveField: 'phone', toolField: 'Contact.phone', description: 'Adds phone number to the Contact so reps can call directly from Close' },
      { cursiveField: 'pages_viewed', toolField: 'Note.note', description: 'Creates a Note on the Lead with the list of pages the visitor viewed' },
      { cursiveField: 'intent_score', toolField: 'Lead.custom_field (Intent Score)', description: 'Stores intent score as a custom field for Smart View filtering' },
      { cursiveField: 'visit_timestamp', toolField: 'Activity.date', description: 'Records the visit timestamp so reps see how recently the prospect was active' },
    ],
    workflows: [
      { title: 'Auto-create Leads from identified visitors', description: 'When Cursive identifies a new company visiting your site, create a Close Lead with an associated Contact, pre-populated with company name, email, and phone number for immediate outreach.' },
      { title: 'Trigger email sequences from intent signals', description: 'When a visitor hits a high-intent page like pricing or a competitor comparison, automatically enroll them in a Close email sequence tailored to their interest.' },
      { title: 'Enrich Leads with firmographic data', description: 'Attach company size, industry, and location data from Cursive to Close Leads, enabling reps to prioritize and personalize their outreach.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Close.',
      'Generate a webhook URL using Close\'s API or a middleware platform.',
      'Map Cursive fields to Close Lead, Contact, and custom fields.',
      'Send a test visitor event and confirm the Lead and Contact appear in Close.',
      'Activate the integration and configure Smart Views to surface high-intent visitors.',
    ],
    faqs: [
      { question: 'Can Cursive auto-enroll visitors in Close sequences?', answer: 'Not directly, but you can use a middleware to receive the Cursive webhook and call Close\'s API to add the Contact to a specific sequence.' },
      { question: 'How does this work with Close\'s Lead model?', answer: 'Close uses a Lead-Contact hierarchy where a Lead is a company and Contacts are people. Cursive creates or updates both levels.' },
      { question: 'Can I filter Cursive visitors in Close Smart Views?', answer: 'Yes. By mapping intent score to a custom field, you can create Smart Views that filter and sort by visitor engagement level.' },
      { question: 'Will this slow down my Close instance?', answer: 'No. Webhook data is processed asynchronously. Even high volumes of visitor data won\'t impact Close\'s performance for your reps.' },
      { question: 'Does Cursive sync call and email activity back?', answer: 'Currently, the integration is one-directional: Cursive sends visitor data to Close. Two-way sync is on the roadmap.' },
    ],
    keywords: ['close crm visitor identification', 'close crm lead enrichment', 'cursive close integration', 'close crm website visitors', 'close crm intent data', 'inside sales visitor tracking', 'close crm lead generation'],
  },
  {
    slug: 'copper',
    name: 'Copper',
    category: 'CRM',
    logo: '🔶',
    connectionMethod: 'webhook',
    description:
      'Copper is a CRM designed to work seamlessly with Google Workspace. It lives inside Gmail and Google Calendar, automatically capturing contacts and activities so teams that run on Google can manage relationships without switching tools.',
    whyCursive:
      'Connecting Cursive to Copper enriches your Google Workspace-native CRM with website visitor intelligence. Your team sees which contacts and companies are actively engaging with your site, right alongside their email conversations and calendar events.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Person.email', description: 'Creates or updates a Copper Person record, matching by email address' },
      { cursiveField: 'company_name', toolField: 'Company.name', description: 'Creates or links a Copper Company record to the identified visitor\'s organization' },
      { cursiveField: 'pages_viewed', toolField: 'Activity.details', description: 'Logs page views as Activity entries on the Person record' },
      { cursiveField: 'job_title', toolField: 'Person.title', description: 'Sets the job title on the Person record for context and filtering' },
      { cursiveField: 'intent_score', toolField: 'Person.custom_field (Intent)', description: 'Stores intent score on a custom field for pipeline prioritization' },
    ],
    workflows: [
      { title: 'Auto-link visitors to existing Copper records', description: 'When Cursive identifies a visitor whose email matches an existing Copper Person, automatically update their record with recent page views and refresh their intent score.' },
      { title: 'Create Opportunities from repeat visitors', description: 'When a known contact visits your site multiple times in a week, automatically create a Copper Opportunity to flag the account as heating up.' },
      { title: 'Track engagement across Google Workspace', description: 'Combine Cursive visit data with Copper\'s automatic email and calendar tracking to build a complete picture of prospect engagement across all touchpoints.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Copper.',
      'Set up a webhook receiver using Copper\'s API or a middleware like Zapier.',
      'Map Cursive visitor fields to Copper Person, Company, and Activity fields.',
      'Trigger a test event and verify the Person record updates in Copper (visible in Gmail sidebar).',
      'Activate the integration and define which visitor events should create Activities.',
    ],
    faqs: [
      { question: 'Will Cursive data show up in the Copper Gmail sidebar?', answer: 'Yes. Once data is written to a Copper Person or Company record, it appears in the Gmail sidebar just like any other Copper data.' },
      { question: 'Does this require a specific Copper plan?', answer: 'Copper\'s API access is available on the Professional and Business plans. The Basic plan has limited API functionality.' },
      { question: 'Can I create Copper Pipelines from Cursive data?', answer: 'Yes. You can configure the integration to create Opportunities in a specific Pipeline when intent criteria are met.' },
      { question: 'How does matching work for Google Workspace contacts?', answer: 'Matching is based on email address. If the visitor\'s email matches a Person auto-captured by Copper from Gmail, the existing record is updated.' },
      { question: 'Can I track which Google Ads campaigns drive identified visitors?', answer: 'Cursive captures referral source data, which can include UTM parameters from Google Ads. This data is stored on the Copper record for attribution.' },
    ],
    keywords: ['copper crm visitor identification', 'copper crm enrichment', 'cursive copper integration', 'copper google workspace visitors', 'copper crm website tracking', 'google crm visitor data'],
  },
  {
    slug: 'freshsales',
    name: 'Freshsales',
    category: 'CRM',
    logo: '🍏',
    connectionMethod: 'webhook',
    description:
      'Freshsales is a CRM from the Freshworks suite that includes built-in phone, email, AI-powered lead scoring with Freddy AI, and sales sequences. It appeals to teams wanting a modern CRM with native communication channels at a competitive price.',
    whyCursive:
      'Integrating Cursive with Freshsales adds a layer of website visitor intelligence to Freddy AI\'s lead scoring. Your sales team benefits from both Cursive\'s real-time identification and Freshsales\' predictive analytics, creating a more complete scoring model.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Creates or updates a Freshsales Contact using the identified visitor email' },
      { cursiveField: 'company_name', toolField: 'Account.name', description: 'Creates or matches a Freshsales Account for the visitor\'s company' },
      { cursiveField: 'intent_score', toolField: 'Contact.lead_score (custom)', description: 'Feeds into a custom lead score that complements Freddy AI\'s native scoring' },
      { cursiveField: 'pages_viewed', toolField: 'Activity.note', description: 'Records visited pages as a Sales Activity for rep visibility' },
      { cursiveField: 'employee_count', toolField: 'Account.number_of_employees', description: 'Populates company size on the Account for territory and segment filtering' },
      { cursiveField: 'referral_source', toolField: 'Contact.lead_source', description: 'Captures the traffic source as the Contact\'s lead source for attribution' },
    ],
    workflows: [
      { title: 'Auto-create Contacts from identified visitors', description: 'When Cursive identifies a new visitor, create a Freshsales Contact and associated Account with full firmographic details, ready for rep engagement.' },
      { title: 'Score leads by visit behavior', description: 'Combine Cursive\'s intent score with Freshsales\' Freddy AI scoring by writing visit data to custom fields, giving reps a composite view of lead quality.' },
      { title: 'Trigger sales sequences from high-intent visits', description: 'When a visitor views pricing or demo pages, automatically enroll their Contact in a Freshsales sales sequence for timely follow-up.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Freshsales.',
      'Create a webhook endpoint using Freshsales\' Workflows or a middleware platform.',
      'Map Cursive fields to Freshsales Contact, Account, and Activity fields.',
      'Send a test event and verify the Contact and Account appear correctly in Freshsales.',
      'Enable the integration and set filters for the visitor criteria you care about.',
    ],
    faqs: [
      { question: 'Does Cursive data work with Freddy AI lead scoring?', answer: 'Cursive data written to Contact fields can be factored into Freddy AI\'s predictions. The more behavioral data Freddy has, the better its scoring becomes.' },
      { question: 'Can I trigger Freshsales Workflows from Cursive events?', answer: 'Yes. Freshsales Workflows can trigger on Contact creation or field updates, so any Cursive-driven change can kick off your automation.' },
      { question: 'Which Freshsales plan supports webhook integration?', answer: 'Freshsales Growth plan and above support Workflows with webhook actions. The Free plan has limited automation capabilities.' },
      { question: 'Will Cursive data appear in the Freshsales mobile app?', answer: 'Yes. Data synced to Contact and Account records is visible across all Freshsales clients, including the mobile app.' },
      { question: 'Can I use Cursive with Freshsales Suite (marketing + sales)?', answer: 'Yes. Cursive data can feed both the CRM and marketing automation sides of Freshsales Suite, enabling unified visitor tracking across sales and marketing.' },
    ],
    keywords: ['freshsales visitor identification', 'freshsales lead enrichment', 'cursive freshsales integration', 'freshsales website visitors', 'freshsales intent data', 'freshworks visitor tracking', 'freshsales lead scoring'],
  },

  // ─── Marketing Automation ──────────────────────────────────────────────
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    category: 'Marketing Automation',
    logo: '📧',
    connectionMethod: 'webhook',
    description:
      'Mailchimp is one of the most widely used email marketing platforms, offering campaign creation, audience management, landing pages, and basic automation. Its generous free tier and ease of use make it a go-to for small businesses and growing teams.',
    whyCursive:
      'Connecting Cursive to Mailchimp lets you turn anonymous website visitors into addressable email subscribers. Instead of relying solely on opt-in forms, you can build targeted audiences from visitors who have shown real interest in your product.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Member.email_address', description: 'Adds the identified visitor as a subscriber to your Mailchimp audience' },
      { cursiveField: 'company_name', toolField: 'Member.merge_fields.COMPANY', description: 'Populates the company merge field for personalization in email campaigns' },
      { cursiveField: 'pages_viewed', toolField: 'Member.tags', description: 'Applies tags based on pages viewed (e.g., "visited-pricing", "viewed-case-study")' },
      { cursiveField: 'intent_score', toolField: 'Member.merge_fields.INTENT', description: 'Stores intent score as a merge field for segmentation and conditional content' },
      { cursiveField: 'industry', toolField: 'Member.merge_fields.INDUSTRY', description: 'Sets the industry for segment-based targeting in campaigns' },
    ],
    workflows: [
      { title: 'Add visitors to nurture email lists', description: 'When Cursive identifies a visitor, add them to a Mailchimp audience with relevant merge fields so they receive your nurture email sequence.' },
      { title: 'Tag subscribers by intent signals', description: 'Apply Mailchimp tags based on which pages visitors viewed, enabling you to send targeted campaigns to subscribers who showed interest in specific topics or products.' },
      { title: 'Trigger abandoned-visit campaigns', description: 'When a visitor views your pricing page but doesn\'t convert, trigger a Mailchimp automation that sends a follow-up email with pricing details or a special offer.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Mailchimp.',
      'Configure a webhook URL using Mailchimp\'s API or a middleware like Zapier.',
      'Map Cursive fields to Mailchimp audience merge fields and tag rules.',
      'Send a test event and verify the subscriber appears in your Mailchimp audience with correct tags.',
      'Activate the integration and connect relevant Mailchimp automations to the new subscriber triggers.',
    ],
    faqs: [
      { question: 'Will adding visitors to Mailchimp violate email compliance laws?', answer: 'You are responsible for compliance with CAN-SPAM, GDPR, and other regulations. Cursive provides the data; you should ensure your email practices include proper opt-out mechanisms and comply with applicable laws.' },
      { question: 'Can I add visitors to a specific Mailchimp audience?', answer: 'Yes. You configure which audience (list) receives the subscriber data when setting up the integration.' },
      { question: 'Does this work with Mailchimp\'s free plan?', answer: 'Yes. The free plan supports audiences, tags, and basic automations. Advanced segmentation and automation features require paid plans.' },
      { question: 'Can I segment by intent score in Mailchimp?', answer: 'Yes. By storing intent score as a merge field, you can create segments like "intent score greater than 70" to target your most engaged visitors.' },
      { question: 'How do tags from Cursive work with Mailchimp automations?', answer: 'Mailchimp automations can trigger when a tag is applied. For example, adding the "visited-pricing" tag can trigger a specific drip sequence.' },
    ],
    keywords: ['mailchimp visitor identification', 'mailchimp lead enrichment', 'cursive mailchimp integration', 'mailchimp website visitors', 'email marketing visitor data', 'mailchimp subscriber enrichment', 'mailchimp automation triggers'],
  },
  {
    slug: 'activecampaign',
    name: 'ActiveCampaign',
    category: 'Marketing Automation',
    logo: '⚡',
    connectionMethod: 'webhook',
    description:
      'ActiveCampaign combines email marketing, marketing automation, and CRM into a single platform known for its powerful automation builder. Its visual workflow editor and conditional logic make it possible to create sophisticated, behavior-driven campaigns.',
    whyCursive:
      'Cursive supercharges ActiveCampaign\'s automation engine by feeding it real-time visitor behavior data. Your automations can now trigger based on actual website visits from identified prospects, not just email opens and clicks.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Creates or updates an ActiveCampaign Contact by email address' },
      { cursiveField: 'company_name', toolField: 'Contact.orgname', description: 'Links the Contact to an ActiveCampaign Organization' },
      { cursiveField: 'pages_viewed', toolField: 'Contact.tag', description: 'Applies behavioral tags like "visited-features" or "viewed-demo-page"' },
      { cursiveField: 'intent_score', toolField: 'Contact.field (Intent Score)', description: 'Maps to a custom field used in ActiveCampaign\'s contact scoring system' },
      { cursiveField: 'job_title', toolField: 'Contact.field (Job Title)', description: 'Sets the job title for personalization and decision-maker targeting' },
      { cursiveField: 'visit_count', toolField: 'Contact.field (Visit Count)', description: 'Tracks total site visits for engagement scoring and automation conditions' },
    ],
    workflows: [
      { title: 'Trigger drip sequences from site visits', description: 'When Cursive identifies a visitor on a specific page, apply a tag in ActiveCampaign that triggers a tailored drip sequence about that topic.' },
      { title: 'Score contacts with behavioral data', description: 'Use Cursive\'s intent score and visit count to add points to ActiveCampaign\'s contact scoring, ensuring your hottest leads float to the top.' },
      { title: 'Segment by visit behavior', description: 'Build ActiveCampaign segments based on Cursive tags and custom fields to separate early-stage researchers from late-stage buyers.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select ActiveCampaign.',
      'Generate a webhook URL using ActiveCampaign\'s incoming webhook feature or a middleware.',
      'Map Cursive fields to ActiveCampaign Contact fields, tags, and custom fields.',
      'Send a test visitor event and verify the Contact appears in ActiveCampaign with the correct tags and fields.',
      'Enable the integration and connect your ActiveCampaign automations to trigger on the new tags.',
    ],
    faqs: [
      { question: 'Can Cursive tags trigger ActiveCampaign automations?', answer: 'Yes. ActiveCampaign automations can use "Tag is added" as a start trigger. Any tag applied by Cursive can kick off a full automation workflow.' },
      { question: 'How does this integrate with ActiveCampaign\'s site tracking?', answer: 'Cursive identifies visitors that ActiveCampaign\'s native site tracking cannot, such as first-time visitors who haven\'t clicked an email link. The two complement each other.' },
      { question: 'Can I use Cursive data in ActiveCampaign deal scoring?', answer: 'Yes. By mapping intent score to a custom field, you can reference it in deal score rules alongside other criteria in ActiveCampaign.' },
      { question: 'Does this work with ActiveCampaign Lite plan?', answer: 'ActiveCampaign Lite supports automations and custom fields. However, CRM features like deal scoring require the Plus plan or higher.' },
      { question: 'Can I send different email sequences based on pages viewed?', answer: 'Absolutely. Cursive applies page-specific tags, and each tag can trigger a different automation in ActiveCampaign.' },
    ],
    keywords: ['activecampaign visitor identification', 'activecampaign lead enrichment', 'cursive activecampaign integration', 'activecampaign website visitors', 'marketing automation visitor data', 'activecampaign intent triggers', 'activecampaign behavioral scoring'],
  },
  {
    slug: 'marketo',
    name: 'Marketo',
    category: 'Marketing Automation',
    logo: '🟣',
    connectionMethod: 'webhook',
    description:
      'Marketo Engage (by Adobe) is an enterprise marketing automation platform known for sophisticated lead management, account-based marketing, and multi-touch attribution. It\'s a cornerstone of enterprise marketing stacks that require scale and compliance.',
    whyCursive:
      'Cursive fills a critical gap in Marketo\'s funnel by identifying anonymous web visitors before they submit a form. This means your Marketo nurture programs can start earlier, and your Smart Lists can include high-intent prospects that would otherwise remain invisible.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Lead.email', description: 'Creates or updates a Marketo Lead record by email for nurture enrollment' },
      { cursiveField: 'company_name', toolField: 'Lead.company', description: 'Sets the company field on the Marketo Lead for ABM programs' },
      { cursiveField: 'pages_viewed', toolField: 'Lead.custom_field (Pages Viewed)', description: 'Stores visited pages in a custom field for Smart List filtering' },
      { cursiveField: 'intent_score', toolField: 'Lead.leadScore (or custom)', description: 'Adds to Marketo\'s native lead score or a custom scoring model' },
      { cursiveField: 'industry', toolField: 'Lead.industry', description: 'Populates the industry field for program segmentation and reporting' },
      { cursiveField: 'employee_count', toolField: 'Lead.numberOfEmployees', description: 'Sets company size for ideal customer profile filtering in Smart Lists' },
    ],
    workflows: [
      { title: 'Enrich Marketo Leads with visit data', description: 'When Cursive identifies a visitor who matches an existing Marketo Lead, update their record with recent page views and refresh their lead score to reflect new engagement.' },
      { title: 'Trigger nurture programs from intent signals', description: 'Automatically enroll new Cursive-identified visitors in a Marketo Engagement Program tailored to their industry or the content they viewed on your site.' },
      { title: 'Build Smart Lists from intent data', description: 'Create Marketo Smart Lists that filter by Cursive intent score and pages viewed, enabling targeted campaigns to your most engaged anonymous-turned-known visitors.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Marketo.',
      'Configure a Marketo webhook or use the REST API endpoint to receive Cursive events.',
      'Map Cursive fields to Marketo Lead fields, including custom fields for pages viewed and intent score.',
      'Trigger a test event and verify the Lead record is created or updated in Marketo.',
      'Activate the integration and set up Smart Campaigns to process incoming visitor data.',
    ],
    faqs: [
      { question: 'Does this count against my Marketo database limits?', answer: 'Yes. Each new Lead created by Cursive counts toward your Marketo database size. You can set intent score filters to only sync high-quality visitors.' },
      { question: 'Can I use Cursive data in Marketo Revenue Cycle Modeler?', answer: 'Yes. Once visitor data is on the Lead record, it flows through your Revenue Cycle stages like any other Lead data.' },
      { question: 'How does Cursive compare to Marketo\'s own web tracking?', answer: 'Marketo\'s Munchkin tracking requires a known cookie (from an email click). Cursive identifies visitors who have never interacted with your Marketo emails.' },
      { question: 'Can I use this for account-based marketing in Marketo?', answer: 'Yes. Cursive\'s company identification feeds directly into Marketo ABM by creating or updating Leads linked to named accounts in your target account list.' },
      { question: 'Will Cursive data trigger Marketo Smart Campaigns?', answer: 'Yes. Any Lead field update from Cursive can serve as a trigger or filter in Smart Campaigns, including changes to lead score, custom fields, or program membership.' },
    ],
    keywords: ['marketo visitor identification', 'marketo lead enrichment', 'cursive marketo integration', 'marketo anonymous visitors', 'marketo intent data', 'adobe marketo visitor tracking', 'marketo ABM enrichment', 'enterprise marketing automation'],
  },
  {
    slug: 'klaviyo',
    name: 'Klaviyo',
    category: 'Marketing Automation',
    logo: '💚',
    connectionMethod: 'webhook',
    description:
      'Klaviyo is a marketing automation platform built for e-commerce and DTC brands. It excels at email and SMS marketing with deep Shopify, WooCommerce, and BigCommerce integrations, powerful segmentation, and predictive analytics for customer lifetime value.',
    whyCursive:
      'For B2B companies using Klaviyo, Cursive adds a visitor identification layer that Klaviyo doesn\'t natively offer. You can identify which businesses are browsing your product catalog and trigger personalized flows based on their browsing behavior.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Profile.email', description: 'Creates or updates a Klaviyo Profile with the identified visitor\'s email' },
      { cursiveField: 'company_name', toolField: 'Profile.properties.company', description: 'Sets a custom property on the Profile for B2B segmentation' },
      { cursiveField: 'pages_viewed', toolField: 'Event (Viewed Page)', description: 'Tracks page views as Klaviyo Events that can trigger Flows' },
      { cursiveField: 'intent_score', toolField: 'Profile.properties.intent_score', description: 'Stores intent score as a custom property for segment building' },
      { cursiveField: 'industry', toolField: 'Profile.properties.industry', description: 'Adds industry context for targeted email content and segmentation' },
    ],
    workflows: [
      { title: 'Add visitors to targeted Flows', description: 'When Cursive identifies a visitor, create a Klaviyo Profile and trigger a Flow based on the pages they viewed, sending personalized follow-up emails about the products or content they browsed.' },
      { title: 'Trigger post-visit email sequences', description: 'After a visitor leaves your site, automatically send a Klaviyo email sequence with related content, case studies, or offers based on their browsing session.' },
      { title: 'Build lookalike segments', description: 'Use Cursive-enriched Profiles to build segments of your best visitors, then use Klaviyo\'s integration with ad platforms to create lookalike audiences for paid campaigns.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Klaviyo.',
      'Set up a webhook URL using Klaviyo\'s API or Track endpoint to receive Cursive events.',
      'Map Cursive fields to Klaviyo Profile properties and configure Event tracking for page views.',
      'Send a test event and verify the Profile and Events appear correctly in Klaviyo.',
      'Activate the integration and build Flows that trigger on Cursive Events.',
    ],
    faqs: [
      { question: 'Is Klaviyo a good fit for B2B visitor identification?', answer: 'Klaviyo is primarily designed for e-commerce, but its flexible Profile properties and Flow builder work well for B2B use cases when enriched with Cursive data.' },
      { question: 'Can I trigger Klaviyo Flows from Cursive page view events?', answer: 'Yes. By sending page views as Klaviyo Events, you can trigger Flows based on specific pages, visit frequency, or combinations of events.' },
      { question: 'Will Cursive Profiles be billable in Klaviyo?', answer: 'Yes. Active Profiles in Klaviyo count toward your billing tier. Use intent score filters to only sync visitors likely to convert.' },
      { question: 'Can I use Cursive data for Klaviyo SMS campaigns?', answer: 'If the visitor\'s phone number is available from Cursive, it can be added to the Profile for SMS consent and campaign targeting.' },
      { question: 'How does this compare to Klaviyo\'s built-in web tracking?', answer: 'Klaviyo\'s onsite tracking works with known contacts who clicked an email. Cursive identifies net-new visitors, expanding your addressable audience.' },
    ],
    keywords: ['klaviyo visitor identification', 'klaviyo B2B integration', 'cursive klaviyo integration', 'klaviyo website visitors', 'klaviyo lead enrichment', 'ecommerce visitor identification', 'klaviyo intent data'],
  },
  {
    slug: 'brevo',
    name: 'Brevo',
    category: 'Marketing Automation',
    logo: '💙',
    connectionMethod: 'webhook',
    description:
      'Brevo (formerly Sendinblue) is a marketing platform offering email, SMS, chat, and CRM tools at accessible price points. Its pay-by-email pricing model and multi-channel approach make it popular with cost-conscious teams that need more than just email.',
    whyCursive:
      'Connecting Cursive to Brevo gives you the ability to build marketing lists from actual website visitors rather than purchased data. Each contact enters Brevo with behavioral context, making your email and SMS campaigns more relevant from the first touch.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Creates or updates a Brevo Contact with the visitor\'s email address' },
      { cursiveField: 'company_name', toolField: 'Contact.attributes.COMPANY', description: 'Sets the company attribute for personalization and segmentation' },
      { cursiveField: 'industry', toolField: 'Contact.attributes.INDUSTRY', description: 'Populates industry for list segmentation and targeted campaigns' },
      { cursiveField: 'pages_viewed', toolField: 'Contact.listIds (conditional)', description: 'Adds the contact to specific lists based on pages they viewed' },
      { cursiveField: 'intent_score', toolField: 'Contact.attributes.INTENT_SCORE', description: 'Stores intent score as a contact attribute for automation conditions' },
    ],
    workflows: [
      { title: 'Add visitors to lists by industry', description: 'When Cursive identifies a visitor, add them to industry-specific Brevo lists so they receive targeted content relevant to their sector.' },
      { title: 'Trigger welcome sequences for new visitors', description: 'Automatically enroll newly identified visitors in a Brevo Automation workflow that introduces your product with a series of welcome emails.' },
      { title: 'Track engagement across email and site visits', description: 'Combine Cursive visit data with Brevo\'s email engagement metrics to identify contacts who are both reading your emails and visiting your site.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Brevo.',
      'Configure a webhook endpoint using Brevo\'s API or a middleware platform.',
      'Map Cursive fields to Brevo Contact attributes and list assignments.',
      'Send a test event and verify the Contact appears in the correct Brevo list.',
      'Activate the integration and connect Brevo Automations to trigger on new contact creation.',
    ],
    faqs: [
      { question: 'How does Brevo\'s pricing work with Cursive data?', answer: 'Brevo charges by email volume, not contact count, on most plans. This means adding visitors to your contact list doesn\'t directly increase costs unless you email them.' },
      { question: 'Can I use Cursive data in Brevo\'s SMS campaigns?', answer: 'If a phone number is available from Cursive, it can be synced as a Contact attribute in Brevo for SMS campaign targeting.' },
      { question: 'Does this work with Brevo\'s free plan?', answer: 'Yes. Brevo\'s free plan includes contact management and basic automation. You can receive Cursive data and send up to 300 emails per day.' },
      { question: 'Can I segment by intent score in Brevo?', answer: 'Yes. Intent score stored as a Contact attribute can be used in Brevo\'s segment builder to target high-intent visitors.' },
      { question: 'Will Cursive data appear in Brevo\'s CRM features?', answer: 'Yes. Brevo includes a basic CRM, and Contact attributes set by Cursive are visible in deal and pipeline views.' },
    ],
    keywords: ['brevo visitor identification', 'brevo lead enrichment', 'cursive brevo integration', 'sendinblue website visitors', 'brevo email marketing visitors', 'brevo intent data', 'brevo contact enrichment'],
  },

  // ─── Sales Engagement ──────────────────────────────────────────────────
  {
    slug: 'outreach',
    name: 'Outreach',
    category: 'Sales Engagement',
    logo: '📤',
    connectionMethod: 'webhook',
    description:
      'Outreach is a leading sales engagement platform that helps revenue teams create and manage multi-step sequences across email, phone, and social. Its AI-powered analytics and A/B testing help sales orgs optimize their outreach at scale.',
    whyCursive:
      'When Cursive identifies visitors who match your ICP, those prospects can flow directly into Outreach sequences. Your SDRs stop guessing who to prospect and start reaching out to contacts who are already showing buying intent on your website.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Prospect.email', description: 'Creates or matches an Outreach Prospect by email address' },
      { cursiveField: 'company_name', toolField: 'Account.name', description: 'Creates or links an Outreach Account record for the visitor\'s company' },
      { cursiveField: 'job_title', toolField: 'Prospect.title', description: 'Sets the Prospect\'s title for personalization tokens in sequence emails' },
      { cursiveField: 'intent_score', toolField: 'Prospect.custom_field (Intent)', description: 'Stores intent score for prioritizing which Prospects to sequence first' },
      { cursiveField: 'pages_viewed', toolField: 'Prospect.custom_field (Pages)', description: 'Gives SDRs context on what the Prospect researched for personalized messaging' },
      { cursiveField: 'phone', toolField: 'Prospect.phone', description: 'Adds phone number for multi-channel sequences that include call steps' },
    ],
    workflows: [
      { title: 'Auto-add high-intent visitors to sequences', description: 'When Cursive identifies a visitor with a high intent score, automatically add them as an Outreach Prospect and enroll them in a relevant sequence based on the pages they viewed.' },
      { title: 'Enrich existing Prospects with visit data', description: 'When a known Prospect visits your site, update their Outreach record with recent page views so SDRs can reference specific interests in their next touchpoint.' },
      { title: 'Prioritize Prospects by intent score', description: 'Use Cursive\'s intent score on a custom field in Outreach to sort and filter your Prospect list, ensuring reps focus on the warmest leads first.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Outreach.',
      'Set up a webhook endpoint using Outreach\'s API or a middleware like Tray.io.',
      'Map Cursive fields to Outreach Prospect and Account fields, including custom fields.',
      'Send a test visitor event and confirm the Prospect appears in Outreach with the correct data.',
      'Activate the integration and configure automatic sequence enrollment rules.',
    ],
    faqs: [
      { question: 'Can Cursive automatically enroll Prospects in Outreach sequences?', answer: 'Direct sequence enrollment requires Outreach API access. Using a middleware, you can receive the Cursive webhook and call Outreach\'s API to add the Prospect to a specific sequence.' },
      { question: 'How does this affect my Outreach sequence metrics?', answer: 'Prospects added from Cursive data tend to have higher reply rates than cold prospects because they\'ve already shown interest by visiting your site.' },
      { question: 'Can I personalize Outreach emails with Cursive data?', answer: 'Yes. Custom fields populated by Cursive (like pages viewed) can be used as personalization tokens in your Outreach email templates.' },
      { question: 'Does this integration support Outreach\'s Accounts feature?', answer: 'Yes. Cursive can create or update Outreach Account records alongside Prospect records, keeping your account-based selling data current.' },
      { question: 'What Outreach plan is required?', answer: 'API access for webhook integration is available on Outreach\'s Professional and Enterprise plans. Check with Outreach for current plan details.' },
    ],
    keywords: ['outreach visitor identification', 'outreach lead enrichment', 'cursive outreach integration', 'outreach sales engagement visitors', 'outreach intent data', 'outreach sequence automation', 'outreach prospect enrichment'],
  },
  {
    slug: 'salesloft',
    name: 'Salesloft',
    category: 'Sales Engagement',
    logo: '🎯',
    connectionMethod: 'webhook',
    description:
      'Salesloft is a sales engagement platform focused on cadence management, call coaching, and deal intelligence. Its Rhythm feature uses AI to recommend the next best action for reps, and its conversation intelligence helps managers coach effectively.',
    whyCursive:
      'Feeding Cursive visitor data into Salesloft means your cadences are fueled by real intent signals. Reps add prospects who are actively researching your product, and Salesloft\'s Rhythm engine can factor in website engagement when recommending next actions.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Person.email_address', description: 'Creates or matches a Salesloft Person by email for cadence enrollment' },
      { cursiveField: 'company_name', toolField: 'Account.name', description: 'Creates or links a Salesloft Account for account-level tracking' },
      { cursiveField: 'job_title', toolField: 'Person.title', description: 'Sets the Person\'s job title for cadence step personalization' },
      { cursiveField: 'intent_score', toolField: 'Person.custom_field (Intent)', description: 'Stores intent score for rep prioritization and reporting' },
      { cursiveField: 'pages_viewed', toolField: 'Person.custom_field (Recent Pages)', description: 'Provides visit context so reps can tailor their cadence messaging' },
      { cursiveField: 'country', toolField: 'Person.country', description: 'Sets location for timezone-aware cadence scheduling' },
    ],
    workflows: [
      { title: 'Add to cadences from visitor data', description: 'When Cursive identifies a visitor matching your ICP, automatically create a Salesloft Person and enroll them in a cadence designed for warm prospects who\'ve shown intent.' },
      { title: 'Enrich People with visit context', description: 'When a Person already in Salesloft visits your site, update their custom fields with page view data so reps can mention specific product interests in their next call or email.' },
      { title: 'Trigger Plays for target accounts', description: 'When a visitor from a named target account is identified, trigger a Salesloft Play that coordinates outreach across the entire account team.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Salesloft.',
      'Create a webhook receiver using Salesloft\'s API or a middleware platform.',
      'Map Cursive visitor fields to Salesloft Person and Account fields.',
      'Send a test event and verify the Person record appears in Salesloft with correct data.',
      'Activate the integration and set up cadence enrollment rules based on intent criteria.',
    ],
    faqs: [
      { question: 'Can Cursive data feed into Salesloft Rhythm recommendations?', answer: 'Once Cursive data is on the Person record, Rhythm can factor in engagement signals when suggesting next best actions to your reps.' },
      { question: 'Does this work with Salesloft\'s Deals feature?', answer: 'Yes. Person records enriched with Cursive data link to Deals, giving deal owners visibility into buyer engagement during the sales cycle.' },
      { question: 'Can I automatically start a cadence from a Cursive event?', answer: 'Direct cadence enrollment requires Salesloft API access. A middleware can process the webhook and call Salesloft\'s API to add the Person to a cadence.' },
      { question: 'How does this compare to Salesloft\'s own website tracking?', answer: 'Salesloft does not natively identify anonymous website visitors. Cursive provides this capability, feeding new Person records into your Salesloft workflow.' },
      { question: 'What Salesloft plan supports this?', answer: 'API access is typically available on Salesloft\'s Advanced and Premier plans. Contact Salesloft for specifics on your plan.' },
    ],
    keywords: ['salesloft visitor identification', 'salesloft lead enrichment', 'cursive salesloft integration', 'salesloft website visitors', 'salesloft cadence automation', 'salesloft intent data', 'salesloft prospect enrichment'],
  },
  {
    slug: 'apollo',
    name: 'Apollo',
    category: 'Sales Engagement',
    logo: '🚀',
    connectionMethod: 'webhook',
    description:
      'Apollo is a sales intelligence and engagement platform with a massive B2B contact database, built-in sequencing, and a Chrome extension for prospecting on LinkedIn. It combines data enrichment with outbound execution in a single platform.',
    whyCursive:
      'Cursive and Apollo are a powerful combination: Cursive identifies who\'s visiting your website, and Apollo\'s database fills in the gaps with verified contact details. Together, they let you build highly targeted outbound lists from your actual website traffic.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Matches or creates an Apollo Contact with the visitor\'s email for enrichment' },
      { cursiveField: 'company_name', toolField: 'Account.name', description: 'Links the visitor to an Apollo Account for account-based prospecting' },
      { cursiveField: 'pages_viewed', toolField: 'Contact.custom_field (Visit Pages)', description: 'Stores page view data for personalizing Apollo sequence emails' },
      { cursiveField: 'intent_score', toolField: 'Contact.custom_field (Cursive Intent)', description: 'Adds intent scoring for filtering and prioritizing contact lists' },
      { cursiveField: 'linkedin_url', toolField: 'Contact.linkedin_url', description: 'Cross-references LinkedIn profiles between Cursive and Apollo\'s database' },
    ],
    workflows: [
      { title: 'Enrich Apollo contacts with visit data', description: 'When Cursive identifies a visitor who exists in Apollo\'s database, update their Contact with page views and intent score so your outbound team has behavioral context.' },
      { title: 'Add visitors to Apollo sequences', description: 'Automatically add high-intent visitors to Apollo email sequences, with personalization based on the specific product pages they viewed on your site.' },
      { title: 'Build targeted lists from visitor data', description: 'Export Cursive visitor companies into Apollo Lists, then use Apollo\'s database to find additional decision-makers at those companies for multi-threaded outreach.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Apollo.',
      'Configure a webhook URL using Apollo\'s API or a middleware to receive Cursive events.',
      'Map Cursive fields to Apollo Contact and Account fields, including custom fields.',
      'Send a test event and verify the Contact is created or enriched in Apollo.',
      'Activate the integration and configure list assignment and sequence enrollment rules.',
    ],
    faqs: [
      { question: 'Can Apollo enrich Cursive visitors with additional data?', answer: 'Yes, but in reverse. Send Cursive visitor data to Apollo, and Apollo can fill in missing fields like phone number, LinkedIn URL, and org chart from its database.' },
      { question: 'Does this count against my Apollo credits?', answer: 'API-based operations in Apollo may consume credits depending on your plan. Check Apollo\'s current pricing for API usage details.' },
      { question: 'Can I find other contacts at visitor companies using Apollo?', answer: 'Yes. Once you know which companies visited via Cursive, you can search Apollo\'s database for other decision-makers at those companies.' },
      { question: 'Does this work with Apollo\'s free plan?', answer: 'Apollo\'s free plan has limited API access. For full webhook integration and sequence enrollment, a paid plan is recommended.' },
      { question: 'Can I use Cursive data in Apollo\'s intent signals?', answer: 'Cursive data stored on custom fields can complement Apollo\'s native intent data, giving you a combined view of third-party and first-party intent.' },
    ],
    keywords: ['apollo visitor identification', 'apollo lead enrichment', 'cursive apollo integration', 'apollo website visitors', 'apollo sales intelligence', 'apollo intent data', 'apollo prospecting enrichment', 'B2B sales intelligence'],
  },
  {
    slug: 'reply-io',
    name: 'Reply.io',
    category: 'Sales Engagement',
    logo: '💬',
    connectionMethod: 'webhook',
    description:
      'Reply.io is a multi-channel sales engagement platform that automates outreach across email, LinkedIn, calls, SMS, and WhatsApp. Its AI-powered email assistant and advanced deliverability tools help sales teams scale personalized outreach.',
    whyCursive:
      'Connecting Cursive to Reply.io means every identified website visitor can enter a multi-channel outreach sequence automatically. Your team reaches prospects on their preferred channel, with messaging informed by what they were actually researching on your site.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Contact.email', description: 'Creates or matches a Reply.io Contact for sequence enrollment' },
      { cursiveField: 'company_name', toolField: 'Contact.company', description: 'Sets the company name for email personalization and reporting' },
      { cursiveField: 'pages_viewed', toolField: 'Contact.custom_field (Pages)', description: 'Stores visited pages for personalizing sequence messaging' },
      { cursiveField: 'phone', toolField: 'Contact.phone', description: 'Adds phone number for call and SMS steps in multi-channel sequences' },
      { cursiveField: 'linkedin_url', toolField: 'Contact.linkedin', description: 'Links LinkedIn profile for social selling steps in sequences' },
    ],
    workflows: [
      { title: 'Add visitors to multi-channel sequences', description: 'When Cursive identifies a high-intent visitor, automatically add them to a Reply.io sequence that combines email, LinkedIn connection requests, and phone calls.' },
      { title: 'Personalize outreach with visit data', description: 'Use Cursive\'s page view data in Reply.io email templates so your first touch references the exact product features or use cases the prospect was researching.' },
      { title: 'Multi-channel follow-up after site visits', description: 'After a visitor browses your site, trigger a Reply.io sequence that starts with a personalized email, follows up on LinkedIn, and includes a call step if they don\'t respond.' },
    ],
    setupSteps: [
      'In Cursive, go to Settings → Integrations and select Reply.io.',
      'Set up a webhook endpoint using Reply.io\'s API to receive Cursive visitor events.',
      'Map Cursive fields to Reply.io Contact fields, including custom fields for page views.',
      'Send a test event and verify the Contact appears in Reply.io with correct data.',
      'Activate the integration and configure sequence enrollment for different intent levels.',
    ],
    faqs: [
      { question: 'Can Reply.io\'s AI assistant use Cursive data?', answer: 'Reply.io\'s AI email assistant can incorporate custom field data in its suggestions. Page view data from Cursive provides useful context for the AI to generate personalized emails.' },
      { question: 'Does this support Reply.io\'s LinkedIn automation?', answer: 'If you provide a LinkedIn URL from Cursive, Reply.io can include LinkedIn connection requests and messages in the outreach sequence.' },
      { question: 'Can I A/B test sequences for Cursive visitors?', answer: 'Yes. Reply.io supports A/B testing across sequences. You can test different messaging approaches for visitors identified by Cursive.' },
      { question: 'How does deliverability work for cold contacts from Cursive?', answer: 'Reply.io includes email warm-up and deliverability tools. Contacts from Cursive should be warmed up using Reply.io\'s best practices for cold outreach.' },
      { question: 'What Reply.io plan supports API integration?', answer: 'Reply.io\'s Professional plan and above support API access for webhook integration.' },
    ],
    keywords: ['reply.io visitor identification', 'reply.io lead enrichment', 'cursive reply.io integration', 'multi-channel sales engagement', 'reply.io website visitors', 'reply.io intent data', 'sales engagement visitor tracking'],
  },
  {
    slug: 'lemlist',
    name: 'Lemlist',
    category: 'Sales Engagement',
    logo: '🍋',
    connectionMethod: 'webhook',
    description:
      'Lemlist is a cold outreach platform known for its personalized image and video features. It lets sales teams create highly customized email campaigns with dynamic images, landing pages, and multi-channel sequences that stand out in crowded inboxes.',
    whyCursive:
      'Cursive makes Lemlist campaigns dramatically more effective by identifying warm prospects instead of cold contacts. When you know someone visited your pricing page yesterday, your personalized Lemlist email with a custom image feels relevant, not random.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Lead.email', description: 'Creates a Lemlist Lead for campaign enrollment' },
      { cursiveField: 'company_name', toolField: 'Lead.companyName', description: 'Sets company name for email personalization and dynamic image text' },
      { cursiveField: 'pages_viewed', toolField: 'Lead.custom_field (Visited Pages)', description: 'Stores visited pages for crafting relevant campaign messaging' },
      { cursiveField: 'job_title', toolField: 'Lead.custom_field (Title)', description: 'Adds job title for personalized images and email content' },
      { cursiveField: 'first_name', toolField: 'Lead.firstName', description: 'Sets first name for email greeting and dynamic image personalization' },
    ],
    workflows: [
      { title: 'Add visitors to personalized campaigns', description: 'When Cursive identifies a visitor, automatically add them to a Lemlist campaign that uses their name, company, and the pages they viewed to create a highly personalized first email.' },
      { title: 'Personalize images with visit context', description: 'Use Cursive data like company name and job title in Lemlist\'s dynamic image feature to create personalized screenshots, LinkedIn mockups, or product demos in your emails.' },
      { title: 'Trigger follow-up sequences after visits', description: 'When a known Lead revisits your site, trigger a new Lemlist campaign step that acknowledges their return visit with a personalized offer or demo invitation.' },
    ],
    setupSteps: [
      'In Cursive, navigate to Settings → Integrations and select Lemlist.',
      'Configure a webhook endpoint using Lemlist\'s API or a middleware like Zapier.',
      'Map Cursive fields to Lemlist Lead fields, including custom fields for page views.',
      'Send a test event and verify the Lead appears in your Lemlist campaign.',
      'Activate the integration and set up campaign enrollment rules by intent score.',
    ],
    faqs: [
      { question: 'Can Cursive data power Lemlist\'s custom image feature?', answer: 'Yes. Fields like company name, first name, and job title from Cursive can be used as dynamic variables in Lemlist\'s personalized images.' },
      { question: 'Will visitors be added to campaigns automatically?', answer: 'Through a middleware, you can automatically add Cursive-identified visitors as Leads in a specific Lemlist campaign.' },
      { question: 'Can I use page view data in Lemlist email templates?', answer: 'Yes. By mapping pages viewed to a custom field, you can reference it in your email template, e.g., "I noticed you were checking out our [Visited Pages] section."' },
      { question: 'Does this work with Lemlist\'s LinkedIn steps?', answer: 'If Cursive provides a LinkedIn URL, you can include LinkedIn profile visits and connection requests in your Lemlist sequence.' },
      { question: 'What Lemlist plan supports API integration?', answer: 'Lemlist\'s Email Pro plan and above support API access. The Starter plan has limited integration capabilities.' },
    ],
    keywords: ['lemlist visitor identification', 'lemlist lead enrichment', 'cursive lemlist integration', 'lemlist personalized outreach', 'lemlist website visitors', 'cold email visitor data', 'lemlist campaign automation'],
  },

  // ─── Communication ─────────────────────────────────────────────────────
  {
    slug: 'slack',
    name: 'Slack',
    category: 'Communication',
    logo: '💬',
    connectionMethod: 'webhook',
    description:
      'Slack is the dominant workplace messaging platform, used by millions of teams to communicate in real-time through channels, threads, and direct messages. Its extensive app ecosystem and incoming webhook support make it a natural hub for business notifications.',
    whyCursive:
      'Piping Cursive visitor alerts into Slack puts real-time buying signals where your sales team already lives. When a target account visits your pricing page, the alert appears in Slack within seconds, enabling immediate action without switching tools.',
    dataMapping: [
      { cursiveField: 'company_name', toolField: 'Message.text (Company)', description: 'Displays the identified company name in the Slack message' },
      { cursiveField: 'pages_viewed', toolField: 'Message.attachment (Pages)', description: 'Lists visited pages in a structured Slack attachment for easy scanning' },
      { cursiveField: 'intent_score', toolField: 'Message.text (Score)', description: 'Shows intent score with visual indicator (color-coded attachment)' },
      { cursiveField: 'visitor_location', toolField: 'Message.field (Location)', description: 'Displays visitor location in the message for territory context' },
    ],
    workflows: [
      { title: 'Alert sales reps on hot visitors in real-time', description: 'Send an instant Slack notification to your sales channel when a visitor with an intent score above your threshold is identified, including company name, pages viewed, and a link to their CRM record.' },
      { title: 'Daily visitor digest', description: 'Post a daily summary to a Slack channel with all identified visitors from the past 24 hours, sorted by intent score, so your team starts each day knowing who to focus on.' },
      { title: 'Notify when target accounts visit', description: 'Maintain a list of target accounts and alert a specific Slack channel or DM the account owner when anyone from those companies visits your site.' },
    ],
    setupSteps: [
      'Create an incoming webhook in Slack by adding the "Incoming Webhooks" app to your workspace.',
      'Copy the webhook URL and paste it into Cursive\'s Settings → Integrations → Slack.',
      'Choose which Slack channel should receive visitor notifications.',
      'Configure notification filters (e.g., minimum intent score, specific pages, or target account lists).',
      'Send a test notification and verify it appears in the selected Slack channel.',
    ],
    faqs: [
      { question: 'Will Slack alerts become noisy with lots of visitors?', answer: 'You can set intent score thresholds, page filters, and target account lists to control volume. Most teams start with a high threshold and adjust down as needed.' },
      { question: 'Can I route alerts to different Slack channels?', answer: 'Yes. You can configure multiple webhooks to send different visitor segments to different channels, e.g., enterprise visitors to #enterprise-alerts and SMB to #smb-alerts.' },
      { question: 'Do Slack notifications include a link to the visitor profile?', answer: 'Yes. Each notification includes a link to the visitor\'s profile in Cursive and, if connected, a link to their CRM record.' },
      { question: 'Can I react to Slack alerts to claim a visitor?', answer: 'While Cursive doesn\'t natively support emoji-based claiming, you can use Slack workflows or bots to build a claim system on top of the notifications.' },
      { question: 'Does this work with Slack Connect channels?', answer: 'Incoming webhooks work with standard Slack channels in your workspace. Slack Connect (shared channels) may have restrictions depending on the host workspace\'s settings.' },
    ],
    keywords: ['slack visitor alerts', 'slack sales notifications', 'cursive slack integration', 'slack website visitor alerts', 'real-time visitor notifications', 'slack sales intelligence', 'slack intent alerts'],
  },
  {
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    logo: '🟦',
    connectionMethod: 'webhook',
    description:
      'Microsoft Teams is the communication and collaboration platform embedded in the Microsoft 365 ecosystem. With channels, chats, video conferencing, and deep Office integration, it\'s the hub for enterprise organizations running on Microsoft\'s stack.',
    whyCursive:
      'For organizations standardized on Microsoft 365, pushing Cursive visitor alerts to Teams ensures sales teams get buying signals in their primary workspace. Adaptive Cards provide rich, interactive notifications that integrate naturally with the Teams experience.',
    dataMapping: [
      { cursiveField: 'company_name', toolField: 'AdaptiveCard.body (Company)', description: 'Displays the company name prominently in the Teams Adaptive Card' },
      { cursiveField: 'pages_viewed', toolField: 'AdaptiveCard.body (Pages List)', description: 'Lists visited pages in a formatted section of the Adaptive Card' },
      { cursiveField: 'intent_score', toolField: 'AdaptiveCard.body (Score Badge)', description: 'Shows intent score with a color-coded badge in the card' },
      { cursiveField: 'employee_count', toolField: 'AdaptiveCard.body (Company Size)', description: 'Displays company size for quick qualification in the notification' },
    ],
    workflows: [
      { title: 'Alert team on enterprise visitors', description: 'Send a Teams Adaptive Card to your enterprise sales channel when a visitor from a company with 500+ employees is identified, giving the team immediate context on company size, pages viewed, and intent level.' },
      { title: 'Share weekly visitor reports', description: 'Post a weekly summary card to a Teams channel with top visitors ranked by intent score, pages most viewed, and industry breakdown for pipeline planning.' },
      { title: 'Notify when competitor companies visit', description: 'Maintain a competitor company list and alert your strategy channel in Teams when someone from a competitor is browsing your site, including which pages they viewed.' },
    ],
    setupSteps: [
      'In Microsoft Teams, create an incoming webhook connector for your target channel.',
      'Copy the webhook URL and paste it into Cursive\'s Settings → Integrations → Microsoft Teams.',
      'Choose the notification format (simple message or Adaptive Card) and configure fields to include.',
      'Set filters for which visitors should trigger Teams notifications.',
      'Send a test notification and verify the card appears correctly in your Teams channel.',
    ],
    faqs: [
      { question: 'Do Teams notifications support Adaptive Cards?', answer: 'Yes. Cursive can send rich Adaptive Cards to Teams channels, displaying visitor data in a structured, interactive format with company info, pages viewed, and action buttons.' },
      { question: 'Can I route alerts to different Teams channels?', answer: 'Yes. You can set up multiple webhook connectors for different channels and configure Cursive to route visitors based on criteria like company size, industry, or territory.' },
      { question: 'Does this work with Microsoft Teams free edition?', answer: 'Incoming webhooks require Microsoft Teams with a Microsoft 365 business subscription. The free edition has limited connector support.' },
      { question: 'Can I take action directly from the Teams notification?', answer: 'Adaptive Cards can include action buttons that link to the visitor profile in Cursive or the contact record in your CRM.' },
      { question: 'Will this work in Teams channels with guest access?', answer: 'Incoming webhooks post to the channel regardless of guest access settings. All channel members, including guests, can see the notifications.' },
    ],
    keywords: ['microsoft teams visitor alerts', 'teams sales notifications', 'cursive teams integration', 'teams website visitor alerts', 'microsoft 365 visitor tracking', 'teams adaptive cards', 'enterprise visitor alerts'],
  },
  {
    slug: 'discord',
    name: 'Discord',
    category: 'Communication',
    logo: '🎮',
    connectionMethod: 'webhook',
    description:
      'Discord is a communication platform originally built for gaming communities, now widely used by developer-focused companies, crypto projects, and startups for team communication. Its webhook support and embed system make it a lightweight alternative to Slack for smaller teams.',
    whyCursive:
      'For startups and developer-focused companies that run on Discord, Cursive visitor notifications land right in the channels where your team is already collaborating. Rich embeds display visitor data cleanly, and the instant delivery keeps response times low.',
    dataMapping: [
      { cursiveField: 'company_name', toolField: 'Embed.title', description: 'Displays the company name as the embed title for quick identification' },
      { cursiveField: 'pages_viewed', toolField: 'Embed.fields (Pages)', description: 'Lists pages viewed as embed fields for structured display' },
      { cursiveField: 'intent_score', toolField: 'Embed.color', description: 'Sets the embed sidebar color based on intent score (green=high, yellow=medium, red=low)' },
      { cursiveField: 'visitor_location', toolField: 'Embed.footer', description: 'Shows visitor location in the embed footer' },
    ],
    workflows: [
      { title: 'Real-time visitor alerts in Discord', description: 'Post a rich embed to your sales channel when a visitor is identified, with color-coded intent scoring so your team can instantly gauge priority at a glance.' },
      { title: 'Daily visitor digest', description: 'Send a daily summary embed to your team channel listing all identified visitors from the past 24 hours, grouped by intent score tier.' },
      { title: 'Intent score notifications', description: 'Configure alerts only for visitors above a certain intent score, keeping your Discord channel focused on high-value prospects that deserve immediate attention.' },
    ],
    setupSteps: [
      'In Discord, go to your channel settings → Integrations → Webhooks and create a new webhook.',
      'Copy the webhook URL and paste it into Cursive\'s Settings → Integrations → Discord.',
      'Configure the embed format and choose which visitor fields to include.',
      'Set intent score thresholds and page filters for which visitors trigger notifications.',
      'Send a test embed and verify it displays correctly in your Discord channel.',
    ],
    faqs: [
      { question: 'Do Discord notifications support rich formatting?', answer: 'Yes. Cursive sends Discord embeds with structured fields, color-coding, and footer text, making visitor data easy to scan quickly.' },
      { question: 'Can I set up alerts in multiple Discord channels?', answer: 'Yes. You can create separate webhooks for different channels and configure different filters for each one.' },
      { question: 'Is Discord webhook integration free?', answer: 'Yes. Discord webhooks are free to use on any Discord server, regardless of whether you have Nitro or server boosts.' },
      { question: 'Can I use Discord bots instead of webhooks?', answer: 'Cursive uses webhooks for simplicity and reliability. If you need interactive features, you could build a custom Discord bot that processes Cursive webhook data.' },
      { question: 'How quickly do notifications arrive?', answer: 'Discord webhook delivery is near-instantaneous, typically under 2 seconds from when Cursive identifies the visitor.' },
    ],
    keywords: ['discord visitor alerts', 'discord sales notifications', 'cursive discord integration', 'discord website visitors', 'discord webhook notifications', 'startup visitor tracking', 'developer sales alerts'],
  },

  // ─── Automation Platforms ──────────────────────────────────────────────
  {
    slug: 'zapier',
    name: 'Zapier',
    category: 'Automation Platform',
    logo: '⚡',
    connectionMethod: 'zapier',
    description:
      'Zapier is the most popular no-code automation platform, connecting over 6,000 apps through simple trigger-action workflows called Zaps. Its intuitive interface makes it possible for anyone to automate data flow between tools without writing code.',
    whyCursive:
      'Zapier turns Cursive into a universal connector. Every visitor Cursive identifies becomes a trigger event that can create records, send notifications, or update data in any of Zapier\'s 6,000+ supported apps, no developer required.',
    dataMapping: [
      { cursiveField: 'All visitor fields', toolField: 'Trigger data', description: 'Every Cursive visitor field is available as trigger data in your Zap for mapping to any action app' },
      { cursiveField: 'email', toolField: 'Action.email_field', description: 'Map to any email field in any Zapier-supported app' },
      { cursiveField: 'company_name', toolField: 'Action.company_field', description: 'Map to any company/organization field in any downstream app' },
      { cursiveField: 'intent_score', toolField: 'Filter/Path condition', description: 'Use intent score in Zapier Filters or Paths to route visitors to different actions' },
    ],
    workflows: [
      { title: 'Visitor to CRM', description: 'Create a Zap that triggers when Cursive identifies a visitor and creates a record in your CRM (any of 40+ supported CRMs in Zapier) with full visitor details.' },
      { title: 'Visitor to email sequence', description: 'When a high-intent visitor is identified, automatically add them to your email marketing platform (Mailchimp, ConvertKit, Drip, etc.) and start a targeted sequence.' },
      { title: 'Visitor to Slack alert', description: 'Send instant Slack or Teams notifications when a visitor matches your ICP criteria, using Zapier\'s filter steps to control which visitors trigger alerts.' },
    ],
    setupSteps: [
      'Sign in to Zapier and create a new Zap with Cursive as the trigger app.',
      'Select "New Visitor Identified" as the trigger event and connect your Cursive account.',
      'Choose your action app (CRM, email tool, Slack, etc.) and map Cursive fields to the action fields.',
      'Add optional filter or path steps to route visitors based on intent score, industry, or pages viewed.',
      'Test the Zap with a sample visitor event, then turn it on.',
    ],
    faqs: [
      { question: 'Do I need a paid Zapier plan for Cursive?', answer: 'Cursive triggers work on all Zapier plans, including Free. However, multi-step Zaps, filters, and paths require Zapier Starter or higher.' },
      { question: 'Can I use Zapier Paths to route different visitors differently?', answer: 'Yes. Zapier Paths let you create conditional branches based on Cursive data like intent score, industry, or company size, sending each segment to different actions.' },
      { question: 'How fast do Zaps trigger from Cursive events?', answer: 'Zapier polls for new triggers every 1-15 minutes depending on your plan. For faster delivery, consider using Cursive\'s direct webhook integrations.' },
      { question: 'Can I create multi-step automations with Cursive data?', answer: 'Yes. Zapier supports multi-step Zaps where a single Cursive trigger can create a CRM record, send a Slack alert, and add to an email list in sequence.' },
      { question: 'Is there a Cursive app in the Zapier marketplace?', answer: 'Check Cursive\'s integration page for the latest availability. Webhook-based triggers work as an alternative using Zapier\'s "Webhooks by Zapier" trigger.' },
    ],
    keywords: ['zapier visitor identification', 'cursive zapier integration', 'zapier automation visitors', 'no-code visitor tracking', 'zapier lead automation', 'cursive automation', 'zapier website visitor data', 'zapier B2B automation'],
  },
  {
    slug: 'make',
    name: 'Make',
    category: 'Automation Platform',
    logo: '🔧',
    connectionMethod: 'webhook',
    description:
      'Make (formerly Integromat) is a visual automation platform that enables complex, multi-step workflows called Scenarios. Its drag-and-drop interface, data transformation tools, and error handling make it a powerful alternative to Zapier for teams needing advanced logic.',
    whyCursive:
      'Make\'s visual Scenario builder is ideal for complex visitor processing workflows. You can create branching logic that routes Cursive visitors through multiple enrichment steps, CRM updates, and notifications in a single automated flow.',
    dataMapping: [
      { cursiveField: 'webhook payload', toolField: 'Webhook module output', description: 'Make\'s webhook module receives the full Cursive visitor payload for processing' },
      { cursiveField: 'email', toolField: 'Module input (any app)', description: 'Route the visitor email to any of Make\'s 1,500+ app modules' },
      { cursiveField: 'company_name', toolField: 'Module input (any app)', description: 'Pass company name through multiple modules for enrichment and record creation' },
      { cursiveField: 'intent_score', toolField: 'Router filter condition', description: 'Use intent score in Make\'s Router module to branch visitors to different processing paths' },
    ],
    workflows: [
      { title: 'Multi-step visitor processing', description: 'Build a Make Scenario that receives a Cursive visitor, enriches them with a data provider, creates a CRM record, sends a Slack alert, and adds them to an email list, all in one visual flow.' },
      { title: 'CRM enrichment chains', description: 'Chain multiple enrichment modules together: Cursive identifies the visitor, then Make calls Clearbit for firmographics, updates your CRM, and scores the lead, all automatically.' },
      { title: 'Cross-platform data sync', description: 'Keep visitor data synchronized across your CRM, marketing platform, and sales engagement tool by processing each Cursive event through a Make Scenario that updates all three.' },
    ],
    setupSteps: [
      'In Make, create a new Scenario and add a Webhook trigger module.',
      'Copy the webhook URL from Make and paste it into Cursive\'s Settings → Integrations → Make.',
      'Add processing modules (CRM, email, chat) to your Scenario and map Cursive fields to each.',
      'Use Make\'s Router module to branch visitors based on intent score, industry, or other criteria.',
      'Run the Scenario with a test event, verify data flows correctly, then activate scheduling.',
    ],
    faqs: [
      { question: 'How does Make compare to Zapier for Cursive integration?', answer: 'Make excels at complex, multi-step workflows with branching logic. If you need simple one-trigger-one-action automations, Zapier may be easier. For advanced processing, Make is more powerful.' },
      { question: 'Can Make handle high volumes of Cursive visitor data?', answer: 'Yes. Make\'s Scenario scheduling and queue system can process high volumes. You may need a higher-tier plan for more operations per month.' },
      { question: 'Does Make support error handling for failed CRM updates?', answer: 'Yes. Make has built-in error handling with retry, ignore, and rollback options for each module, so failed CRM updates don\'t break the entire flow.' },
      { question: 'Can I use Make\'s data transformation tools on Cursive data?', answer: 'Yes. Make includes powerful text, array, and data transformation functions that you can apply to Cursive data before sending it to downstream apps.' },
      { question: 'Does Make support real-time webhook processing?', answer: 'Yes. Make processes incoming webhooks immediately when they arrive, with no polling delay like some competitors.' },
    ],
    keywords: ['make integromat visitor identification', 'make automation visitors', 'cursive make integration', 'make webhook automation', 'integromat website visitors', 'visual automation visitor data', 'make scenario B2B'],
  },
  {
    slug: 'n8n',
    name: 'n8n',
    category: 'Automation Platform',
    logo: '🔗',
    connectionMethod: 'webhook',
    description:
      'n8n is an open-source, self-hostable workflow automation platform. It offers a visual editor similar to Make but can run entirely on your own infrastructure, making it ideal for teams with strict data privacy requirements or those who want full control over their automation stack.',
    whyCursive:
      'For privacy-conscious organizations, n8n\'s self-hosted option means Cursive visitor data never leaves your infrastructure during processing. You get the power of automated workflows with complete control over where your data flows and is stored.',
    dataMapping: [
      { cursiveField: 'webhook payload', toolField: 'Webhook node output', description: 'n8n\'s Webhook node receives the full Cursive visitor payload for workflow processing' },
      { cursiveField: 'email', toolField: 'Node input (any integration)', description: 'Route visitor email through n8n\'s 400+ integration nodes' },
      { cursiveField: 'company_name', toolField: 'Node input (any integration)', description: 'Pass company data through Function nodes for custom transformation before sending to downstream tools' },
      { cursiveField: 'All fields', toolField: 'Function node', description: 'Write custom JavaScript in Function nodes to transform Cursive data in any way needed' },
    ],
    workflows: [
      { title: 'Self-hosted visitor processing', description: 'Run your entire visitor processing pipeline on your own servers: receive Cursive data via webhook, enrich it, update your CRM, and send notifications, all within your infrastructure.' },
      { title: 'Complex data transformations', description: 'Use n8n\'s Function nodes to write custom JavaScript that transforms Cursive visitor data, applies scoring logic, and formats records for your specific CRM schema.' },
      { title: 'Privacy-compliant processing', description: 'For GDPR-sensitive workflows, process Cursive data on your EU-hosted n8n instance, apply data minimization rules, and only forward necessary fields to downstream systems.' },
    ],
    setupSteps: [
      'In your n8n instance, create a new workflow and add a Webhook node as the trigger.',
      'Copy the webhook URL from n8n and paste it into Cursive\'s Settings → Integrations → n8n.',
      'Add processing nodes (HTTP Request, CRM nodes, Slack, etc.) and map Cursive fields.',
      'Use Switch or IF nodes to route visitors based on intent score or other criteria.',
      'Test the workflow with a sample Cursive event, then activate it.',
    ],
    faqs: [
      { question: 'Can I self-host n8n to keep Cursive data on my servers?', answer: 'Yes. n8n can be self-hosted on any server, Docker container, or Kubernetes cluster. Cursive webhook data is sent directly to your n8n instance and never passes through third-party infrastructure.' },
      { question: 'Does n8n have a cloud option?', answer: 'Yes. n8n Cloud is a managed hosting option if you don\'t want to maintain your own infrastructure. It provides the same workflow capabilities without the ops overhead.' },
      { question: 'Can I write custom code in n8n workflows?', answer: 'Yes. n8n\'s Function node lets you write JavaScript (or Python in newer versions) to process Cursive data with custom logic that goes beyond what visual nodes offer.' },
      { question: 'How does n8n handle webhook reliability?', answer: 'n8n queues incoming webhooks and processes them sequentially. For high availability, you can run n8n in a clustered configuration with a persistent database backend.' },
      { question: 'Is n8n truly free?', answer: 'n8n\'s community edition is free and open-source under a fair-code license. The cloud and enterprise editions have paid tiers with additional features like SSO and role-based access.' },
    ],
    keywords: ['n8n visitor identification', 'n8n automation visitors', 'cursive n8n integration', 'self-hosted automation visitors', 'open source visitor tracking', 'n8n webhook automation', 'privacy-compliant visitor processing'],
  },
  {
    slug: 'tray-io',
    name: 'Tray.io',
    category: 'Automation Platform',
    logo: '🏗️',
    connectionMethod: 'webhook',
    description:
      'Tray.io is an enterprise automation platform designed for complex, mission-critical workflows. It offers a visual builder, universal API connector, and enterprise features like SSO, audit logs, and dedicated infrastructure for organizations that need automation at scale.',
    whyCursive:
      'For enterprise teams with complex tech stacks, Tray.io provides the reliability and governance needed to process Cursive visitor data at scale. Its universal connector can integrate with any API, and built-in compliance features satisfy enterprise security requirements.',
    dataMapping: [
      { cursiveField: 'webhook payload', toolField: 'Webhook connector output', description: 'Tray.io\'s webhook connector receives the full Cursive event payload' },
      { cursiveField: 'email', toolField: 'Connector input (any platform)', description: 'Route visitor email through Tray.io\'s universal connectors to any enterprise platform' },
      { cursiveField: 'company_name', toolField: 'Connector input (any platform)', description: 'Pass company data through enrichment connectors before writing to CRM' },
      { cursiveField: 'intent_score', toolField: 'Boolean condition', description: 'Use intent score in Tray.io\'s conditional logic to route visitors through different workflow branches' },
    ],
    workflows: [
      { title: 'Enterprise automation with governance', description: 'Build enterprise-grade workflows that process Cursive visitors through approval chains, compliance checks, and multi-system updates with full audit logging.' },
      { title: 'Bi-directional CRM sync', description: 'Create Tray.io workflows that both push Cursive visitor data to your CRM and pull CRM data back to enrich the visitor profile, keeping both systems in sync.' },
      { title: 'Complex routing logic', description: 'Route Cursive visitors through multi-level decision trees based on company size, industry, territory, and intent score, with different processing paths for each segment.' },
    ],
    setupSteps: [
      'In Tray.io, create a new workflow and add a Webhook connector as the trigger.',
      'Copy the webhook URL from Tray.io and configure it in Cursive\'s Settings → Integrations.',
      'Add processing connectors (Salesforce, Marketo, Slack, etc.) and map Cursive fields.',
      'Configure conditional logic and error handling for enterprise reliability.',
      'Test the workflow with sample data, review audit logs, then activate.',
    ],
    faqs: [
      { question: 'Is Tray.io suitable for high-volume Cursive data?', answer: 'Yes. Tray.io is built for enterprise scale and can handle thousands of webhook events per minute with guaranteed processing and retry logic.' },
      { question: 'Does Tray.io offer compliance features?', answer: 'Yes. Tray.io includes SOC 2 compliance, audit logs, SSO, and role-based access control, making it suitable for regulated industries processing visitor data.' },
      { question: 'How does Tray.io pricing work?', answer: 'Tray.io uses task-based pricing. Each step in a workflow that processes Cursive data counts as a task. Contact Tray.io for enterprise pricing details.' },
      { question: 'Can Tray.io connect to custom APIs not in its connector library?', answer: 'Yes. Tray.io\'s Universal Connector can connect to any REST or GraphQL API, so you can integrate Cursive data with proprietary internal systems.' },
      { question: 'Does Tray.io support bi-directional data flow?', answer: 'Yes. Unlike simpler automation tools, Tray.io can build workflows that read from and write to multiple systems, enabling true bi-directional sync between Cursive and your tech stack.' },
    ],
    keywords: ['tray.io visitor identification', 'enterprise automation visitors', 'cursive tray.io integration', 'tray.io webhook automation', 'enterprise visitor processing', 'tray.io B2B integration', 'iPaaS visitor data'],
  },

  // ─── Data/Enrichment ───────────────────────────────────────────────────
  {
    slug: 'clay',
    name: 'Clay',
    category: 'Data & Enrichment',
    logo: '🧱',
    connectionMethod: 'webhook',
    description:
      'Clay is a data enrichment and prospecting platform that lets you build tables of leads and enrich them with 75+ data providers through a waterfall approach. It combines spreadsheet-like flexibility with powerful API integrations for creative go-to-market workflows.',
    whyCursive:
      'Clay and Cursive together create a prospecting engine fueled by real intent. Cursive identifies who\'s visiting your site, and Clay enriches those visitors with data from dozens of providers, building complete prospect profiles that would take hours to research manually.',
    dataMapping: [
      { cursiveField: 'email', toolField: 'Table.column (Email)', description: 'Adds the visitor\'s email to a Clay table row for waterfall enrichment' },
      { cursiveField: 'company_name', toolField: 'Table.column (Company)', description: 'Sets the company name, which Clay can use to pull firmographic data from 75+ providers' },
      { cursiveField: 'company_domain', toolField: 'Table.column (Domain)', description: 'Provides the company domain for Clay\'s domain-based enrichment sources' },
      { cursiveField: 'pages_viewed', toolField: 'Table.column (Pages Viewed)', description: 'Records page views so outbound messaging can reference specific interests' },
      { cursiveField: 'intent_score', toolField: 'Table.column (Intent Score)', description: 'Adds Cursive\'s intent score as a column for filtering and prioritizing rows' },
      { cursiveField: 'job_title', toolField: 'Table.column (Title)', description: 'Seeds the job title for Clay to verify and enrich with additional role data' },
    ],
    workflows: [
      { title: 'Feed visitor data to Clay tables', description: 'Automatically add each Cursive-identified visitor as a new row in a Clay table, where it\'s immediately enriched with firmographic data, technographics, and social profiles from Clay\'s data providers.' },
      { title: 'Waterfall enrichment for visitors', description: 'Use Clay\'s waterfall feature to run each Cursive visitor through multiple data providers in sequence, filling in phone numbers, LinkedIn URLs, company revenue, tech stack, and more.' },
      { title: 'Build prospecting lists from visitors', description: 'Use Cursive visitor companies in Clay to find additional decision-makers at those organizations, building multi-threaded outbound lists of people at companies already showing interest.' },
    ],
    setupSteps: [
      'In Clay, create a new table with columns for Cursive visitor fields (email, company, pages viewed, intent score).',
      'Set up a Clay webhook or HTTP endpoint to receive incoming Cursive data.',
      'In Cursive, go to Settings → Integrations and configure the webhook URL pointing to your Clay table.',
      'Configure Clay enrichment columns to automatically run when new rows are added.',
      'Send a test visitor event and verify the row is created and enrichment columns populate.',
    ],
    faqs: [
      { question: 'How many data providers can Clay use to enrich Cursive visitors?', answer: 'Clay integrates with 75+ data providers. You can configure waterfall enrichment to try multiple providers in sequence until each field is populated.' },
      { question: 'Does Clay enrichment use credits?', answer: 'Yes. Each enrichment lookup in Clay consumes credits based on the data provider used. You can set intent score minimums in Cursive to only send high-value visitors to Clay.' },
      { question: 'Can I use Clay to find other people at visitor companies?', answer: 'Yes. Once Clay has the company domain from Cursive, you can use "Find People" enrichments to discover additional contacts at the same organization.' },
      { question: 'Can Clay push enriched data back to my CRM?', answer: 'Yes. Clay can push enriched rows to Salesforce, HubSpot, Outreach, and other tools. The full workflow is: Cursive → Clay (enrich) → CRM (create/update).' },
      { question: 'How does Clay handle visitors that can\'t be enriched?', answer: 'Clay\'s waterfall approach tries multiple providers. If no provider returns data for a field, it remains empty. You can use Clay\'s formulas to flag incomplete rows for manual research.' },
    ],
    keywords: ['clay visitor identification', 'clay data enrichment', 'cursive clay integration', 'clay prospecting visitors', 'waterfall enrichment website visitors', 'clay B2B enrichment', 'clay lead building', 'go-to-market enrichment'],
  },
  ...integrationsBatch2,
]

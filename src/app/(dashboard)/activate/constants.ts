// ─── Constants for Activate Wizard ─────────────────────────

export const INDUSTRIES = [
  'SaaS / Software', 'Financial Services', 'Healthcare', 'Real Estate',
  'E-commerce / Retail', 'Marketing / Agencies', 'Legal', 'Insurance',
  'Manufacturing', 'Construction / Trades', 'Consulting', 'Education',
  'Logistics / Supply Chain', 'HR / Recruiting', 'Other',
]

export const JOB_TITLES = [
  'CEO / Founder', 'CTO', 'CFO', 'CMO', 'COO',
  'VP of Sales', 'VP of Marketing', 'Director of Operations',
  'Sales Manager', 'Marketing Manager', 'Business Owner',
  'Head of Growth', 'IT Manager', 'HR Director', 'Other',
]

export const GEOGRAPHIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia',
  'Western Europe', 'DACH (Germany/Austria/Switzerland)',
  'Nordics', 'APAC', 'Latin America', 'Global',
]

export const COMPANY_SIZES = [
  { value: '1-10', label: '1\u201310 (Solo/Startup)' },
  { value: '11-50', label: '11\u201350 (Small)' },
  { value: '51-200', label: '51\u2013200 (Mid-Market)' },
  { value: '201-1000', label: '201\u20131,000 (Growth)' },
  { value: '1001+', label: '1,001+ (Enterprise)' },
]

export const BUDGET_RANGES = [
  '$500\u2013$1,000 / mo', '$1,000\u2013$2,500 / mo',
  '$2,500\u2013$5,000 / mo', '$5,000+ / mo', 'One-time project',
]

export const CAMPAIGN_GOALS = [
  { value: 'book_demos', label: 'Book Demo Calls', icon: 'calendar', desc: 'Fill your calendar with qualified sales conversations' },
  { value: 'close_sales', label: 'Close Sales Directly', icon: 'dollar', desc: 'Drive revenue from cold outreach' },
  { value: 'grow_list', label: 'Grow Email List', icon: 'clipboard', desc: 'Build a warm, opt-in audience for long-term nurture' },
  { value: 'nurture', label: 'Nurture Pipeline', icon: 'sprout', desc: 'Stay top-of-mind until prospects are ready to buy' },
  { value: 'other', label: 'Something else', icon: 'sparkles', desc: "Tell us \u2014 we'll figure it out together" },
]

export const AUDIENCE_SOURCES = [
  { value: 'website_visitors', label: 'My Website Visitors', icon: 'eye', desc: 'People your pixel already identified on your site' },
  { value: 'custom_audience', label: 'Build a Custom List', icon: 'target', desc: 'We build a fresh, targeted list from our database' },
  { value: 'both', label: 'Both', icon: 'zap', desc: 'Website visitors + custom prospecting list' },
]

export const MESSAGE_TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal, authoritative, trust-building' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, conversational' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed, peer-to-peer, no fluff' },
  { value: 'bold', label: 'Bold', desc: 'Direct, confident, pattern-interrupting' },
]

export const AUDIENCE_STEPS = ['Audience Type', 'ICP', 'Volume & Budget', 'Contact']

export const CAMPAIGN_STEPS = ['Campaign Goal', 'Targeting', 'Message & Copy', 'Contact']

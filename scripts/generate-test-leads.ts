/**
 * Generate Realistic Test Leads
 *
 * Creates 500+ realistic leads with:
 * - Mix of industries (Healthcare, HVAC, Solar, etc.)
 * - Geographic distribution across US states
 * - Varied enrichment scores (phone, email, LinkedIn)
 * - Different freshness levels (0-30 days old)
 * - Realistic company names and contact details
 */

// ============================================================================
// INDUSTRY DATA
// ============================================================================

const INDUSTRIES = {
  HEALTHCARE: {
    name: 'Healthcare',
    companies: [
      'Advanced Medical Group', 'Premium Health Clinic', 'Elite Wellness Center',
      'Optimal Care Medical', 'Summit Healthcare Partners', 'Apex Medical Services',
      'Pinnacle Health Solutions', 'Evergreen Medical Center', 'Bright Path Clinics',
      'Harbor Medical Associates', 'Cascade Health Partners', 'Monarch Healthcare'
    ],
    titles: [
      'Practice Manager', 'Chief Medical Officer', 'Healthcare Administrator',
      'Clinical Director', 'Office Manager', 'Operations Director'
    ]
  },
  MED_SPA: {
    name: 'Medical Spa',
    companies: [
      'Radiance Med Spa', 'Glow Aesthetics Center', 'Serenity Spa & Wellness',
      'Rejuvenation Medical Spa', 'Belle Vie Aesthetics', 'Luxury Laser Spa',
      'Elite Beauty Med Spa', 'Vitality Wellness Spa', 'Allure Medical Spa',
      'Refresh Med Spa', 'Pure Aesthetics', 'Revive Beauty Center'
    ],
    titles: [
      'Spa Director', 'Medical Director', 'Operations Manager',
      'Business Owner', 'Practice Manager', 'Spa Manager'
    ]
  },
  DENTAL: {
    name: 'Dental',
    companies: [
      'Bright Smile Dental', 'Perfect Teeth Dentistry', 'Premier Dental Care',
      'Advanced Dental Partners', 'Family First Dentistry', 'Gentle Care Dental',
      'Elite Dental Group', 'Oakwood Dental Associates', 'Riverside Dentistry',
      'Sunshine Dental Clinic', 'Comfort Dental Center', 'Modern Dental Studio'
    ],
    titles: [
      'Practice Owner', 'Office Manager', 'Dental Practice Administrator',
      'Operations Director', 'Business Manager', 'Practice Coordinator'
    ]
  },
  HVAC: {
    name: 'HVAC',
    companies: [
      'Climate Control Experts', 'Superior HVAC Solutions', 'All Season Heating & Cooling',
      'Precision Air Systems', 'Comfort Zone HVAC', 'Elite Climate Control',
      'Reliable HVAC Services', 'Peak Performance Heating', 'Arctic Air Solutions',
      'Temperature Masters', 'Advanced Air Systems', 'ProClimate Services'
    ],
    titles: [
      'Owner', 'General Manager', 'Operations Manager',
      'Business Development Director', 'Service Manager', 'VP Operations'
    ]
  },
  PLUMBING: {
    name: 'Plumbing',
    companies: [
      'Master Plumbing Services', 'Rapid Response Plumbing', 'Premier Plumbing Solutions',
      'All-Pro Plumbing', 'Elite Drain Services', 'Superior Plumbing Co',
      'Quick Fix Plumbers', 'Reliable Plumbing Experts', 'Peak Plumbing Pros',
      'Precision Pipe Services', 'American Plumbing Partners', 'ProFlow Plumbing'
    ],
    titles: [
      'Owner', 'General Manager', 'Operations Director',
      'Service Manager', 'Business Owner', 'GM Operations'
    ]
  },
  SOLAR: {
    name: 'Solar',
    companies: [
      'Sunpower Solutions', 'Bright Energy Solar', 'EcoSolar Systems',
      'Peak Solar Energy', 'Green Horizon Solar', 'Renewable Energy Partners',
      'Solar Innovations Inc', 'Blue Sky Solar', 'Clean Energy Solutions',
      'SolarTech Installers', 'Bright Future Energy', 'SunVolt Systems'
    ],
    titles: [
      'Sales Director', 'Regional Manager', 'Business Owner',
      'VP Sales', 'Operations Manager', 'General Manager'
    ]
  },
  ROOFING: {
    name: 'Roofing',
    companies: [
      'Premier Roofing Co', 'Elite Roof Systems', 'All Weather Roofing',
      'Superior Roofing Solutions', 'Peak Roofing Contractors', 'ProRoof Services',
      'Reliable Roofing Experts', 'Apex Roofing Group', 'Pinnacle Roof Solutions',
      'Master Roofers Inc', 'Guardian Roofing', 'Summit Roofing Pros'
    ],
    titles: [
      'Owner', 'General Manager', 'VP Operations',
      'Business Development Manager', 'Regional Manager', 'Operations Director'
    ]
  },
  SECURITY: {
    name: 'Security Systems',
    companies: [
      'SecureHome Systems', 'Guardian Security Solutions', 'Safe & Sound Security',
      'Elite Protection Services', 'SmartGuard Systems', 'ProTech Security',
      'Advanced Security Systems', 'Home Shield Security', 'Fortress Security Co',
      'TotalGuard Systems', 'Vigilant Security', 'SecureNow Solutions'
    ],
    titles: [
      'Sales Manager', 'Regional Director', 'Business Owner',
      'VP Sales', 'General Manager', 'Operations Manager'
    ]
  }
}

// ============================================================================
// US STATES DATA (with regions)
// ============================================================================

const US_STATES = {
  // High-demand states (Healthcare focus)
  CA: { name: 'California', region: 'West', highDemand: true },
  TX: { name: 'Texas', region: 'South', highDemand: true },
  FL: { name: 'Florida', region: 'South', highDemand: true },

  // Pacific Northwest (Door-to-Door focus)
  WA: { name: 'Washington', region: 'West', pnw: true },
  OR: { name: 'Oregon', region: 'West', pnw: true },

  // Midwest (HVAC focus)
  IL: { name: 'Illinois', region: 'Midwest' },
  OH: { name: 'Ohio', region: 'Midwest' },
  MI: { name: 'Michigan', region: 'Midwest' },
  IN: { name: 'Indiana', region: 'Midwest' },
  WI: { name: 'Wisconsin', region: 'Midwest' },
  MN: { name: 'Minnesota', region: 'Midwest' },
  MO: { name: 'Missouri', region: 'Midwest' },

  // South (HVAC focus)
  GA: { name: 'Georgia', region: 'South' },
  NC: { name: 'North Carolina', region: 'South' },
  VA: { name: 'Virginia', region: 'South' },
  TN: { name: 'Tennessee', region: 'South' },
  AL: { name: 'Alabama', region: 'South' },
  LA: { name: 'Louisiana', region: 'South' },
  SC: { name: 'South Carolina', region: 'South' },
  KY: { name: 'Kentucky', region: 'South' },

  // West (Door-to-Door focus)
  AZ: { name: 'Arizona', region: 'West' },
  NV: { name: 'Nevada', region: 'West' },
  CO: { name: 'Colorado', region: 'West' },
  UT: { name: 'Utah', region: 'West' },
  NM: { name: 'New Mexico', region: 'West' },
  ID: { name: 'Idaho', region: 'West' },

  // Northeast
  NY: { name: 'New York', region: 'Northeast' },
  PA: { name: 'Pennsylvania', region: 'Northeast' },
  NJ: { name: 'New Jersey', region: 'Northeast' },
  MA: { name: 'Massachusetts', region: 'Northeast' },
  CT: { name: 'Connecticut', region: 'Northeast' },
  MD: { name: 'Maryland', region: 'Northeast' },
}

// ============================================================================
// CITIES BY STATE
// ============================================================================

const CITIES_BY_STATE: Record<string, string[]> = {
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
  OR: ['Portland', 'Eugene', 'Salem', 'Bend', 'Medford'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Rockford', 'Joliet'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
  GA: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Ann Arbor', 'Lansing'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
}

// ============================================================================
// NAME DATA
// ============================================================================

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley',
  'Brian', 'Kevin', 'Jason', 'Ryan', 'Jacob', 'Nicholas', 'Eric', 'Jonathan',
  'Emily', 'Michelle', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright',
  'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell'
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysAgo: number): Date {
  const now = new Date()
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
}

function generateEmail(firstName: string, lastName: string, domain: string): string {
  const formats = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
  ]
  return randomElement(formats)
}

function generatePhone(): string {
  const areaCode = randomInt(200, 999)
  const prefix = randomInt(200, 999)
  const lineNumber = randomInt(1000, 9999)
  return `+1${areaCode}${prefix}${lineNumber}`
}

function generateLinkedInUrl(firstName: string, lastName: string): string {
  return `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${randomInt(1000, 9999)}`
}

function generateCompanyDomain(companyName: string): string {
  const name = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20)
  return `${name}.com`
}

function calculateEnrichmentScore(hasEmail: boolean, hasPhone: boolean, hasLinkedIn: boolean): number {
  let score = 60 // Base score
  if (hasEmail) score += 15
  if (hasPhone) score += 15
  if (hasLinkedIn) score += 10
  return score
}

function calculateIntentScore(): number {
  // Random intent score between 1-100
  // Weighted towards higher scores (40-90 range)
  return randomInt(40, 95)
}

// ============================================================================
// LEAD GENERATOR
// ============================================================================

export interface GeneratedLead {
  // Required fields
  company_name: string
  company_industry: string
  source: string
  enrichment_status: string
  delivery_status: string
  status: string

  // Contact info (may be null based on enrichment)
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  job_title: string | null
  phone: string | null
  linkedin_url: string | null

  // Company details
  company_domain: string | null
  company_size: string | null
  company_employee_count: number | null
  company_website: string | null
  company_description: string | null

  // Location
  city: string | null
  state: string | null
  state_code: string | null
  country: string
  country_code: string

  // Intent & Enrichment
  intent_score: string | null
  intent_signals: Record<string, any>
  enrichment_score: number

  // Freshness (for created_at calculation)
  days_old: number
}

export function generateLead(industryKey: string, stateCode: string): GeneratedLead {
  const industry = INDUSTRIES[industryKey as keyof typeof INDUSTRIES]
  const state = US_STATES[stateCode as keyof typeof US_STATES]
  const city = randomElement(CITIES_BY_STATE[stateCode] || ['Springfield'])

  // Pick random company and title
  const companyName = randomElement(industry.companies)
  const jobTitle = randomElement(industry.titles)

  // Generate contact
  const firstName = randomElement(FIRST_NAMES)
  const lastName = randomElement(LAST_NAMES)
  const fullName = `${firstName} ${lastName}`

  // Determine enrichment level (some leads better enriched than others)
  const enrichmentLevel = Math.random()
  const hasEmail = enrichmentLevel > 0.1 // 90% have email
  const hasPhone = enrichmentLevel > 0.3 // 70% have phone
  const hasLinkedIn = enrichmentLevel > 0.5 // 50% have LinkedIn

  const domain = generateCompanyDomain(companyName)
  const email = hasEmail ? generateEmail(firstName, lastName, domain) : null
  const phone = hasPhone ? generatePhone() : null
  const linkedinUrl = hasLinkedIn ? generateLinkedInUrl(firstName, lastName) : null

  // Company details
  const companySize = randomElement(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
  const employeeCount = parseInt(companySize.split('-')[0])

  // Intent signals
  const intentScore = calculateIntentScore()
  const intentSignals = {
    website_visits: randomInt(0, 50),
    content_downloads: randomInt(0, 10),
    social_engagement: randomInt(0, 20),
    search_activity: randomInt(0, 30),
  }

  // Freshness (0-30 days old)
  const daysOld = randomInt(0, 30)

  // Enrichment score
  const enrichmentScore = calculateEnrichmentScore(hasEmail, hasPhone, hasLinkedIn)

  return {
    company_name: companyName,
    company_industry: industry.name,
    source: 'test-seed',
    enrichment_status: 'enriched',
    delivery_status: 'pending',
    status: 'new',

    email,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    job_title: jobTitle,
    phone,
    linkedin_url: linkedinUrl,

    company_domain: domain,
    company_size: companySize,
    company_employee_count: employeeCount,
    company_website: `https://${domain}`,
    company_description: `${companyName} is a leading ${industry.name.toLowerCase()} company serving the ${city} area.`,

    city,
    state: state.name,
    state_code: stateCode,
    country: 'United States',
    country_code: 'US',

    intent_score: intentScore.toString(),
    intent_signals: intentSignals,
    enrichment_score: enrichmentScore,

    days_old: daysOld,
  }
}

// ============================================================================
// GENERATE 500+ LEADS BY VERTICAL
// ============================================================================

export function generateLeadsForVertical(vertical: 'healthcare' | 'hvac' | 'solar', count: number): GeneratedLead[] {
  const leads: GeneratedLead[] = []

  if (vertical === 'healthcare') {
    // Healthcare: Mix of Healthcare, Med Spa, Dental
    // Focus on CA, TX, FL (high-demand) + other states
    const industries = ['HEALTHCARE', 'MED_SPA', 'DENTAL']
    const highDemandStates = ['CA', 'TX', 'FL']
    const otherStates = ['NY', 'PA', 'NC', 'GA', 'VA']

    for (let i = 0; i < count; i++) {
      const industry = randomElement(industries)
      // 60% in high-demand states, 40% in other states
      const state = Math.random() < 0.6
        ? randomElement(highDemandStates)
        : randomElement(otherStates)
      leads.push(generateLead(industry, state))
    }
  } else if (vertical === 'hvac') {
    // HVAC/Plumbing: Focus on Midwest + South
    const industries = ['HVAC', 'PLUMBING']
    const midwestStates = ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'MO']
    const southStates = ['GA', 'NC', 'VA', 'TN', 'AL', 'LA', 'SC', 'KY']

    for (let i = 0; i < count; i++) {
      const industry = randomElement(industries)
      // 50% Midwest, 50% South
      const state = Math.random() < 0.5
        ? randomElement(midwestStates)
        : randomElement(southStates)
      leads.push(generateLead(industry, state))
    }
  } else if (vertical === 'solar') {
    // Solar/Roofing/Security: Focus on West + Pacific Northwest
    const industries = ['SOLAR', 'ROOFING', 'SECURITY']
    const pnwStates = ['WA', 'OR']
    const westStates = ['CA', 'AZ', 'NV', 'CO', 'UT', 'NM', 'ID']

    for (let i = 0; i < count; i++) {
      const industry = randomElement(industries)
      // 30% PNW, 70% West
      const state = Math.random() < 0.3
        ? randomElement(pnwStates)
        : randomElement(westStates)
      leads.push(generateLead(industry, state))
    }
  }

  return leads
}

export function generateAllTestLeads(): GeneratedLead[] {
  console.log('🎲 Generating test leads...')

  const leads: GeneratedLead[] = []

  // Generate 170 healthcare leads (34%)
  leads.push(...generateLeadsForVertical('healthcare', 170))
  console.log(`   ✓ Generated ${170} healthcare leads`)

  // Generate 170 HVAC leads (34%)
  leads.push(...generateLeadsForVertical('hvac', 170))
  console.log(`   ✓ Generated ${170} HVAC leads`)

  // Generate 160 solar/door-to-door leads (32%)
  leads.push(...generateLeadsForVertical('solar', 160))
  console.log(`   ✓ Generated ${160} solar/door-to-door leads`)

  console.log(`\n✅ Generated ${leads.length} total leads\n`)

  return leads
}

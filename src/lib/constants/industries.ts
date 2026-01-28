// Industry Taxonomy - 50+ industries for lead categorization
// Used throughout the marketplace for filtering and matching

export interface Industry {
  id: string
  name: string
  category: string
  sicCodes?: string[]
  naicsCodes?: string[]
}

// Main industry list (50+ industries per spec)
export const INDUSTRIES: Industry[] = [
  // Technology & Software
  { id: 'technology', name: 'Technology', category: 'Technology', sicCodes: ['7370', '7371', '7372'] },
  { id: 'saas', name: 'SaaS / Software', category: 'Technology', sicCodes: ['7372'] },
  { id: 'it_services', name: 'IT Services', category: 'Technology', sicCodes: ['7371'] },
  { id: 'cybersecurity', name: 'Cybersecurity', category: 'Technology', sicCodes: ['7382'] },
  { id: 'ai_ml', name: 'AI / Machine Learning', category: 'Technology', sicCodes: ['7372'] },
  { id: 'cloud_services', name: 'Cloud Services', category: 'Technology', sicCodes: ['7374'] },
  { id: 'ecommerce', name: 'E-Commerce', category: 'Technology', sicCodes: ['5961'] },

  // Financial Services
  { id: 'financial_services', name: 'Financial Services', category: 'Finance', sicCodes: ['6000'] },
  { id: 'banking', name: 'Banking', category: 'Finance', sicCodes: ['6020'] },
  { id: 'insurance', name: 'Insurance', category: 'Finance', sicCodes: ['6300'] },
  { id: 'investment', name: 'Investment / Wealth Management', category: 'Finance', sicCodes: ['6200'] },
  { id: 'accounting', name: 'Accounting', category: 'Finance', sicCodes: ['8721'] },
  { id: 'fintech', name: 'FinTech', category: 'Finance', sicCodes: ['6199'] },

  // Healthcare & Life Sciences
  { id: 'healthcare', name: 'Healthcare', category: 'Healthcare', sicCodes: ['8000'] },
  { id: 'medical_devices', name: 'Medical Devices', category: 'Healthcare', sicCodes: ['3841'] },
  { id: 'pharmaceuticals', name: 'Pharmaceuticals', category: 'Healthcare', sicCodes: ['2834'] },
  { id: 'biotechnology', name: 'Biotechnology', category: 'Healthcare', sicCodes: ['2836'] },
  { id: 'dental', name: 'Dental', category: 'Healthcare', sicCodes: ['8021'] },
  { id: 'mental_health', name: 'Mental Health', category: 'Healthcare', sicCodes: ['8063'] },
  { id: 'home_health', name: 'Home Health Care', category: 'Healthcare', sicCodes: ['8082'] },

  // Manufacturing & Industrial
  { id: 'manufacturing', name: 'Manufacturing', category: 'Manufacturing', sicCodes: ['2000'] },
  { id: 'automotive', name: 'Automotive', category: 'Manufacturing', sicCodes: ['3711'] },
  { id: 'aerospace', name: 'Aerospace & Defense', category: 'Manufacturing', sicCodes: ['3721'] },
  { id: 'chemicals', name: 'Chemicals', category: 'Manufacturing', sicCodes: ['2800'] },
  { id: 'industrial_equipment', name: 'Industrial Equipment', category: 'Manufacturing', sicCodes: ['3500'] },

  // Construction & Real Estate
  { id: 'construction', name: 'Construction', category: 'Construction', sicCodes: ['1500'] },
  { id: 'real_estate', name: 'Real Estate', category: 'Real Estate', sicCodes: ['6500'] },
  { id: 'property_management', name: 'Property Management', category: 'Real Estate', sicCodes: ['6531'] },
  { id: 'architecture', name: 'Architecture', category: 'Construction', sicCodes: ['8712'] },
  { id: 'engineering', name: 'Engineering', category: 'Construction', sicCodes: ['8711'] },

  // Home Services
  { id: 'hvac', name: 'HVAC', category: 'Home Services', sicCodes: ['1711'] },
  { id: 'plumbing', name: 'Plumbing', category: 'Home Services', sicCodes: ['1711'] },
  { id: 'electrical', name: 'Electrical', category: 'Home Services', sicCodes: ['1731'] },
  { id: 'roofing', name: 'Roofing', category: 'Home Services', sicCodes: ['1761'] },
  { id: 'landscaping', name: 'Landscaping', category: 'Home Services', sicCodes: ['0781'] },
  { id: 'pest_control', name: 'Pest Control', category: 'Home Services', sicCodes: ['7342'] },
  { id: 'cleaning', name: 'Cleaning Services', category: 'Home Services', sicCodes: ['7349'] },
  { id: 'solar', name: 'Solar', category: 'Home Services', sicCodes: ['1731'] },
  { id: 'home_security', name: 'Home Security', category: 'Home Services', sicCodes: ['7382'] },
  { id: 'moving', name: 'Moving Services', category: 'Home Services', sicCodes: ['4212'] },

  // Professional Services
  { id: 'legal', name: 'Legal Services', category: 'Professional Services', sicCodes: ['8111'] },
  { id: 'consulting', name: 'Consulting', category: 'Professional Services', sicCodes: ['8742'] },
  { id: 'marketing', name: 'Marketing & Advertising', category: 'Professional Services', sicCodes: ['7311'] },
  { id: 'hr_services', name: 'HR / Staffing', category: 'Professional Services', sicCodes: ['7361'] },
  { id: 'recruiting', name: 'Recruiting', category: 'Professional Services', sicCodes: ['7361'] },
  { id: 'pr', name: 'Public Relations', category: 'Professional Services', sicCodes: ['8743'] },

  // Retail & Consumer
  { id: 'retail', name: 'Retail', category: 'Retail', sicCodes: ['5200'] },
  { id: 'restaurants', name: 'Restaurants', category: 'Retail', sicCodes: ['5812'] },
  { id: 'hospitality', name: 'Hospitality / Hotels', category: 'Retail', sicCodes: ['7011'] },
  { id: 'fitness', name: 'Fitness / Gyms', category: 'Retail', sicCodes: ['7991'] },
  { id: 'beauty', name: 'Beauty / Salons', category: 'Retail', sicCodes: ['7231'] },
  { id: 'auto_services', name: 'Auto Services', category: 'Retail', sicCodes: ['7538'] },

  // Education
  { id: 'education', name: 'Education', category: 'Education', sicCodes: ['8200'] },
  { id: 'higher_ed', name: 'Higher Education', category: 'Education', sicCodes: ['8221'] },
  { id: 'k12', name: 'K-12 Education', category: 'Education', sicCodes: ['8211'] },
  { id: 'edtech', name: 'EdTech', category: 'Education', sicCodes: ['8299'] },
  { id: 'training', name: 'Corporate Training', category: 'Education', sicCodes: ['8299'] },

  // Media & Entertainment
  { id: 'media', name: 'Media & Entertainment', category: 'Media', sicCodes: ['7800'] },
  { id: 'publishing', name: 'Publishing', category: 'Media', sicCodes: ['2700'] },
  { id: 'gaming', name: 'Gaming', category: 'Media', sicCodes: ['7993'] },
  { id: 'sports', name: 'Sports', category: 'Media', sicCodes: ['7941'] },

  // Transportation & Logistics
  { id: 'transportation', name: 'Transportation', category: 'Transportation', sicCodes: ['4000'] },
  { id: 'logistics', name: 'Logistics & Supply Chain', category: 'Transportation', sicCodes: ['4731'] },
  { id: 'trucking', name: 'Trucking', category: 'Transportation', sicCodes: ['4213'] },
  { id: 'shipping', name: 'Shipping', category: 'Transportation', sicCodes: ['4400'] },

  // Energy & Utilities
  { id: 'energy', name: 'Energy', category: 'Energy', sicCodes: ['4900'] },
  { id: 'oil_gas', name: 'Oil & Gas', category: 'Energy', sicCodes: ['1311'] },
  { id: 'utilities', name: 'Utilities', category: 'Energy', sicCodes: ['4911'] },
  { id: 'renewable_energy', name: 'Renewable Energy', category: 'Energy', sicCodes: ['4911'] },

  // Government & Non-Profit
  { id: 'government', name: 'Government', category: 'Government', sicCodes: ['9000'] },
  { id: 'nonprofit', name: 'Non-Profit', category: 'Non-Profit', sicCodes: ['8399'] },
  { id: 'associations', name: 'Associations', category: 'Non-Profit', sicCodes: ['8611'] },

  // Agriculture
  { id: 'agriculture', name: 'Agriculture', category: 'Agriculture', sicCodes: ['0100'] },
  { id: 'food_beverage', name: 'Food & Beverage', category: 'Agriculture', sicCodes: ['2000'] },

  // Telecommunications
  { id: 'telecommunications', name: 'Telecommunications', category: 'Telecommunications', sicCodes: ['4800'] },
  { id: 'wireless', name: 'Wireless', category: 'Telecommunications', sicCodes: ['4812'] },
]

// Category list for grouping
export const INDUSTRY_CATEGORIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Construction',
  'Real Estate',
  'Home Services',
  'Professional Services',
  'Retail',
  'Education',
  'Media',
  'Transportation',
  'Energy',
  'Government',
  'Non-Profit',
  'Agriculture',
  'Telecommunications',
]

// Map for quick lookup by ID
export const INDUSTRY_MAP = INDUSTRIES.reduce<Record<string, Industry>>((acc, ind) => {
  acc[ind.id] = ind
  return acc
}, {})

// Map for quick lookup by name (case-insensitive)
export const INDUSTRY_NAME_MAP = INDUSTRIES.reduce<Record<string, Industry>>((acc, ind) => {
  acc[ind.name.toLowerCase()] = ind
  return acc
}, {})

/**
 * Get industry by ID or name
 */
export function getIndustry(idOrName: string): Industry | undefined {
  const normalized = idOrName.toLowerCase().trim()
  return INDUSTRY_MAP[normalized] || INDUSTRY_NAME_MAP[normalized]
}

/**
 * Get industries by category
 */
export function getIndustriesByCategory(category: string): Industry[] {
  return INDUSTRIES.filter(i => i.category.toLowerCase() === category.toLowerCase())
}

/**
 * Search industries by name
 */
export function searchIndustries(query: string): Industry[] {
  const normalized = query.toLowerCase().trim()
  return INDUSTRIES.filter(i =>
    i.name.toLowerCase().includes(normalized) ||
    i.category.toLowerCase().includes(normalized)
  )
}

/**
 * Get all industry options for select dropdowns
 */
export function getIndustryOptions(): Array<{ value: string; label: string; category: string }> {
  return INDUSTRIES.map(i => ({
    value: i.id,
    label: i.name,
    category: i.category,
  }))
}

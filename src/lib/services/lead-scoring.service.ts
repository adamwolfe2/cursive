// Lead Scoring Service
// Calculates intent scores, freshness scores, and marketplace prices

import type { SeniorityLevel, VerificationStatus } from '@/types/database.types'

// Seniority levels and their scores
const SENIORITY_SCORES: Record<SeniorityLevel | string, number> = {
  c_suite: 25,
  vp: 20,
  director: 15,
  manager: 10,
  ic: 5,
  unknown: 5,
}

// Company size ranges and their scores
const COMPANY_SIZE_SCORES: Record<string, number> = {
  '1-10': 5,
  '11-50': 10,
  '51-200': 15,
  '201-500': 20,
  '500+': 25,
}

// Generic email patterns
const GENERIC_EMAIL_PATTERNS = [
  /^info@/i,
  /^contact@/i,
  /^hello@/i,
  /^admin@/i,
  /^support@/i,
  /^sales@/i,
  /^office@/i,
  /^mail@/i,
  /^inquir/i,
  /^general@/i,
]

// Personal email domains (not work emails)
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'protonmail.com',
]

export interface LeadData {
  email?: string | null
  phone?: string | null
  company_domain?: string | null
  company_employee_count?: number | null
  company_size?: string | null
  seniority_level?: SeniorityLevel | string | null
  job_title?: string | null
  first_name?: string | null
  last_name?: string | null
  city?: string | null
  state?: string | null
  linkedin_url?: string | null
}

export interface IntentScoreResult {
  score: number
  factors: {
    name: string
    score: number
    maxScore: number
    description: string
  }[]
}

/**
 * Calculate intent score for a lead
 * Score range: 1-100
 */
export function calculateIntentScore(lead: LeadData): IntentScoreResult {
  const factors: IntentScoreResult['factors'] = []
  let totalScore = 0

  // 1. Job title seniority (max 25 points)
  const seniorityLevel = lead.seniority_level || inferSeniorityFromTitle(lead.job_title)
  const seniorityScore = SENIORITY_SCORES[seniorityLevel] || SENIORITY_SCORES.unknown
  factors.push({
    name: 'Seniority Level',
    score: seniorityScore,
    maxScore: 25,
    description: `${seniorityLevel} role`,
  })
  totalScore += seniorityScore

  // 2. Company size (max 25 points)
  const companySizeScore = calculateCompanySizeScore(
    lead.company_employee_count,
    lead.company_size
  )
  factors.push({
    name: 'Company Size',
    score: companySizeScore,
    maxScore: 25,
    description: lead.company_size || `${lead.company_employee_count || 0} employees`,
  })
  totalScore += companySizeScore

  // 3. Email quality (max 15 points)
  const emailScore = calculateEmailScore(lead.email, lead.company_domain)
  factors.push({
    name: 'Email Quality',
    score: emailScore.score,
    maxScore: 15,
    description: emailScore.description,
  })
  totalScore += emailScore.score

  // 4. Has verified phone (20 points)
  const phoneScore = lead.phone ? 20 : 0
  factors.push({
    name: 'Phone Number',
    score: phoneScore,
    maxScore: 20,
    description: lead.phone ? 'Has phone number' : 'No phone number',
  })
  totalScore += phoneScore

  // 5. Data completeness (max 15 points)
  const completenessScore = calculateCompletenessScore(lead)
  factors.push({
    name: 'Data Completeness',
    score: completenessScore.score,
    maxScore: 15,
    description: `${completenessScore.fieldsPresent}/${completenessScore.totalFields} fields`,
  })
  totalScore += completenessScore.score

  // Ensure score is within bounds
  const finalScore = Math.min(100, Math.max(1, totalScore))

  return {
    score: finalScore,
    factors,
  }
}

/**
 * Infer seniority level from job title
 */
function inferSeniorityFromTitle(title?: string | null): SeniorityLevel {
  if (!title) return 'unknown'

  const normalized = title.toLowerCase()

  // C-Suite patterns
  if (
    /\b(ceo|cto|cfo|coo|cmo|cio|chief|president|founder|owner)\b/.test(normalized)
  ) {
    return 'c_suite'
  }

  // VP patterns
  if (/\b(vp|vice president|evp|svp)\b/.test(normalized)) {
    return 'vp'
  }

  // Director patterns
  if (/\b(director|head of)\b/.test(normalized)) {
    return 'director'
  }

  // Manager patterns
  if (/\b(manager|lead|supervisor|team lead)\b/.test(normalized)) {
    return 'manager'
  }

  // Individual contributor
  return 'ic'
}

/**
 * Calculate company size score
 */
function calculateCompanySizeScore(
  employeeCount?: number | null,
  sizeRange?: string | null
): number {
  // Use size range if provided
  if (sizeRange && COMPANY_SIZE_SCORES[sizeRange]) {
    return COMPANY_SIZE_SCORES[sizeRange]
  }

  // Calculate from employee count
  if (employeeCount) {
    if (employeeCount > 500) return 25
    if (employeeCount > 200) return 20
    if (employeeCount > 50) return 15
    if (employeeCount > 10) return 10
    return 5
  }

  // Default to middle score if unknown
  return 10
}

/**
 * Calculate email quality score
 */
function calculateEmailScore(
  email?: string | null,
  companyDomain?: string | null
): { score: number; description: string } {
  if (!email) {
    return { score: -10, description: 'No email' }
  }

  // Check for generic email patterns
  const isGeneric = GENERIC_EMAIL_PATTERNS.some((pattern) => pattern.test(email))
  if (isGeneric) {
    return { score: -5, description: 'Generic inbox email' }
  }

  // Check for personal email domains
  const emailDomain = email.split('@')[1]?.toLowerCase()
  const isPersonal = PERSONAL_EMAIL_DOMAINS.includes(emailDomain)
  if (isPersonal) {
    return { score: 0, description: 'Personal email' }
  }

  // Check if email domain matches company domain
  if (companyDomain) {
    const normalizedCompanyDomain = companyDomain
      .toLowerCase()
      .replace(/^(www\.|https?:\/\/)/, '')
    if (emailDomain === normalizedCompanyDomain) {
      return { score: 15, description: 'Verified work email' }
    }
  }

  // Work email but domain not verified
  return { score: 10, description: 'Work email' }
}

/**
 * Calculate data completeness score
 */
function calculateCompletenessScore(lead: LeadData): {
  score: number
  fieldsPresent: number
  totalFields: number
} {
  const optionalFields = [
    'job_title',
    'city',
    'state',
    'company_domain',
    'linkedin_url',
  ]

  const presentFields = optionalFields.filter((field) => {
    const value = lead[field as keyof LeadData]
    return value !== null && value !== undefined && value !== ''
  })

  const totalFields = optionalFields.length
  const fieldsPresent = presentFields.length
  const score = Math.round((fieldsPresent / totalFields) * 15)

  return { score, fieldsPresent, totalFields }
}

/**
 * Calculate freshness score using sigmoid decay
 * Score range: 5-100
 */
export function calculateFreshnessScore(
  createdAt: Date,
  options: {
    maxScore?: number
    midpointDays?: number
    steepness?: number
    floor?: number
  } = {}
): number {
  const { maxScore = 100, midpointDays = 30, steepness = 0.15, floor = 5 } = options

  const now = new Date()
  const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

  // Sigmoid decay: score = max / (1 + e^(k * (days - midpoint)))
  const score = maxScore / (1 + Math.exp(steepness * (daysOld - midpointDays)))

  // Apply floor
  return Math.max(Math.round(score), floor)
}

/**
 * Calculate marketplace price for a lead
 */
export function calculateMarketplacePrice(params: {
  intentScore: number
  freshnessScore: number
  hasPhone: boolean
  verificationStatus: VerificationStatus
  basePrice?: number
}): number {
  const { intentScore, freshnessScore, hasPhone, verificationStatus, basePrice = 0.05 } = params

  // Intent multiplier
  let intentMultiplier = 1
  if (intentScore >= 67) {
    intentMultiplier = 2.5
  } else if (intentScore >= 34) {
    intentMultiplier = 1.5
  }

  // Freshness multiplier
  let freshnessMultiplier = 1
  if (freshnessScore >= 80) {
    freshnessMultiplier = 1.5
  } else if (freshnessScore < 30) {
    freshnessMultiplier = 0.5
  }

  // Calculate base price
  let price = basePrice * intentMultiplier * freshnessMultiplier

  // Add-ons
  if (hasPhone) {
    price += 0.03
  }

  if (verificationStatus === 'valid') {
    price += 0.02
  } else if (verificationStatus === 'catch_all') {
    price -= 0.01
  }

  // Round to 4 decimal places
  return Math.round(price * 10000) / 10000
}

/**
 * Get intent score tier label
 */
export function getIntentTier(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 67) return 'hot'
  if (score >= 34) return 'warm'
  return 'cold'
}

/**
 * Get freshness label
 */
export function getFreshnessLabel(score: number): 'fresh' | 'recent' | 'stale' {
  if (score >= 70) return 'fresh'
  if (score >= 30) return 'recent'
  return 'stale'
}

/**
 * Calculate all scores for a lead and return updated lead data
 */
export function scoreLead(
  lead: LeadData & { created_at: string; verification_status?: VerificationStatus }
): {
  intentScore: number
  freshnessScore: number
  marketplacePrice: number
  intentFactors: IntentScoreResult['factors']
} {
  const createdAt = new Date(lead.created_at)
  const intentResult = calculateIntentScore(lead)
  const freshnessScore = calculateFreshnessScore(createdAt)
  const marketplacePrice = calculateMarketplacePrice({
    intentScore: intentResult.score,
    freshnessScore,
    hasPhone: !!lead.phone,
    verificationStatus: lead.verification_status || 'pending',
  })

  return {
    intentScore: intentResult.score,
    freshnessScore,
    marketplacePrice,
    intentFactors: intentResult.factors,
  }
}

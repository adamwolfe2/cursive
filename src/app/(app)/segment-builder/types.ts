export interface FilterRule {
  id: string
  field: 'industry' | 'state' | 'company_size' | 'job_title' | 'seniority'
  operator: 'equals' | 'contains' | 'in'
  value: string | string[]
}

export interface Segment {
  id: string
  name: string
  description: string | null
  filters: Record<string, any>
  last_count: number | null
  last_run_at: string | null
  status: 'active' | 'paused' | 'archived'
  created_at: string
  workspace_id: string
  user_id: string
}

export interface CatalogSegment {
  segment_id: string
  name: string
  category: string
  sub_category: string | null
  description: string | null
  type: 'B2B' | 'B2C'
}

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Professional Services',
  'Construction',
  'Education',
  'Hospitality',
]

export const US_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  { code: 'IL', name: 'Illinois' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'OH', name: 'Ohio' },
  { code: 'GA', name: 'Georgia' },
]

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001+',
]

export const JOB_TITLES = [
  'CEO',
  'CTO',
  'CFO',
  'VP',
  'Director',
  'Manager',
  'Engineer',
  'Designer',
  'Sales',
  'Marketing',
]

export const SENIORITY_LEVELS = [
  'C-Level',
  'VP',
  'Director',
  'Manager',
  'Individual Contributor',
]

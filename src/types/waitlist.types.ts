/**
 * Waitlist Flow Types
 * TypeScript interfaces for the multi-step VSL waitlist experience
 */

export type UserType = 'business' | 'partner'

export interface VSLAnswers {
  q1: string
  q2: string
  q3: string
}

export interface BusinessFormData {
  firstName: string
  lastName: string
  email: string
  companyName: string
  industry: string
  targetLocations?: string
  monthlyLeadNeed: string
}

export interface PartnerFormData {
  firstName: string
  lastName: string
  email: string
  companyName: string
  partnerType: string
  primaryVerticals: string
  databaseSize: string
  enrichmentMethods?: string
  linkedin: string
  website?: string
}

export interface WaitlistData {
  userType: UserType
  vslAnswers: VSLAnswers
  formData: BusinessFormData | PartnerFormData
  timestamp: Date
}

export interface ScreenProps {
  onNext: () => void
  onBack?: () => void
  onAnswer?: (answer: string) => void
  answer?: string
  userType?: UserType
  vslAnswers?: VSLAnswers
}

export type Screen =
  | 'title'
  | 'business-intro'
  | 'business-q1'
  | 'business-q2'
  | 'business-q3'
  | 'business-transition'
  | 'business-form'
  | 'business-success'
  | 'partner-intro'
  | 'partner-q1'
  | 'partner-q2'
  | 'partner-q3'
  | 'partner-transition'
  | 'partner-form'
  | 'partner-success'

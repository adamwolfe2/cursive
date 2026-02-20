/**
 * Timezone-Aware Scheduling Service
 * Handles optimal send time calculation based on recipient timezones
 */

import { createClient } from '@/lib/supabase/server'

// IANA timezone list for common business regions
export const COMMON_TIMEZONES = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (US)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (US)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (US)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)', offset: -8 },
  { value: 'America/Toronto', label: 'Eastern Time (Canada)', offset: -5 },
  { value: 'America/Vancouver', label: 'Pacific Time (Canada)', offset: -8 },
  // Europe
  { value: 'Europe/London', label: 'London (GMT)', offset: 0 },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 1 },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 1 },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', offset: 1 },
  // Asia Pacific
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9 },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 8 },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: 8 },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 8 },
  { value: 'Asia/Mumbai', label: 'Mumbai (IST)', offset: 5.5 },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 4 },
  // Australia
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: 10 },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)', offset: 10 },
] as const

export type TimezoneValue = typeof COMMON_TIMEZONES[number]['value']

// Day names for scheduling
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type WeekDay = typeof WEEKDAYS[number]

export interface SendWindow {
  start: string // "09:00"
  end: string // "17:00"
  timezone: string
  days: WeekDay[]
}

export interface OptimalSendTimeResult {
  canSendNow: boolean
  optimalTime: Date
  recipientTimezone: string
  localTime: string
  isWithinWindow: boolean
  nextWindowOpens?: Date
  reasoning: string
}

export interface SchedulingConfig {
  sendWindow: SendWindow
  respectRecipientTimezone: boolean
  optimizeForEngagement: boolean
  minDelayMinutes?: number
  maxDelayMinutes?: number
}

/**
 * Calculate optimal send time for a recipient
 */
export async function calculateOptimalSendTime(
  recipientTimezone: string | null,
  campaignId: string,
  fromTime: Date = new Date()
): Promise<OptimalSendTimeResult> {
  const supabase = await createClient()

  // Try database function first for complex calculations
  const { data, error } = await supabase.rpc('calculate_optimal_send_time', {
    p_campaign_id: campaignId,
    p_lead_timezone: recipientTimezone || 'America/New_York',
    p_from_time: fromTime.toISOString(),
  })

  if (!error && data) {
    const optimalTime = new Date(data)
    const effectiveTimezone = recipientTimezone || 'America/New_York'

    return {
      canSendNow: optimalTime <= new Date(),
      optimalTime,
      recipientTimezone: effectiveTimezone,
      localTime: formatInTimezone(optimalTime, effectiveTimezone),
      isWithinWindow: optimalTime <= new Date(),
      reasoning: 'Calculated by database function',
    }
  }

  // Fallback to JavaScript calculation
  return calculateOptimalSendTimeJS(recipientTimezone, campaignId, fromTime)
}

/**
 * JavaScript fallback for optimal send time calculation
 */
async function calculateOptimalSendTimeJS(
  recipientTimezone: string | null,
  campaignId: string,
  fromTime: Date
): Promise<OptimalSendTimeResult> {
  const supabase = await createClient()

  // Get campaign settings
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('send_window_start, send_window_end, send_timezone, send_days, send_window_enabled')
    .eq('id', campaignId)
    .maybeSingle()

  const timezone = recipientTimezone || campaign?.send_timezone || 'America/New_York'
  const startTime = campaign?.send_window_start || '09:00'
  const endTime = campaign?.send_window_end || '17:00'
  const sendDays = (campaign?.send_days || ['mon', 'tue', 'wed', 'thu', 'fri']) as WeekDay[]
  const windowEnabled = campaign?.send_window_enabled !== false

  // If window not enabled, send immediately
  if (!windowEnabled) {
    return {
      canSendNow: true,
      optimalTime: fromTime,
      recipientTimezone: timezone,
      localTime: formatInTimezone(fromTime, timezone),
      isWithinWindow: true,
      reasoning: 'Send window disabled, sending immediately',
    }
  }

  // Get current time in recipient timezone
  const localNow = getTimeInTimezone(fromTime, timezone)
  const dayOfWeek = getDayName(localNow)
  const currentTime = getTimeString(localNow)

  // Check if we're in a valid send day and time
  const isValidDay = sendDays.includes(dayOfWeek)
  const isWithinTime = currentTime >= startTime && currentTime < endTime

  if (isValidDay && isWithinTime) {
    return {
      canSendNow: true,
      optimalTime: fromTime,
      recipientTimezone: timezone,
      localTime: formatInTimezone(fromTime, timezone),
      isWithinWindow: true,
      reasoning: `Within send window (${startTime}-${endTime} ${timezone})`,
    }
  }

  // Find next valid send time
  const nextSendTime = findNextValidSendTime(fromTime, timezone, startTime, endTime, sendDays)

  return {
    canSendNow: false,
    optimalTime: nextSendTime,
    recipientTimezone: timezone,
    localTime: formatInTimezone(nextSendTime, timezone),
    isWithinWindow: false,
    nextWindowOpens: nextSendTime,
    reasoning: `Scheduled for next send window: ${formatInTimezone(nextSendTime, timezone)}`,
  }
}

/**
 * Find the next valid send time based on window constraints
 */
function findNextValidSendTime(
  fromTime: Date,
  timezone: string,
  startTime: string,
  endTime: string,
  sendDays: WeekDay[]
): Date {
  // Start from fromTime and look for next valid slot
  const [startHour, startMin] = startTime.split(':').map(Number)
  const localNow = getTimeInTimezone(fromTime, timezone)

  // Check up to 7 days ahead
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const checkDate = new Date(localNow)
    checkDate.setDate(checkDate.getDate() + dayOffset)
    const dayName = getDayName(checkDate)

    if (!sendDays.includes(dayName)) {
      continue
    }

    // Set to start of window
    const windowStart = new Date(checkDate)
    windowStart.setHours(startHour, startMin || 0, 0, 0)

    // If today and we're past the window start but before end, use now
    if (dayOffset === 0) {
      const currentTime = getTimeString(localNow)
      if (currentTime >= startTime && currentTime < endTime) {
        // Convert back to UTC
        return convertFromTimezone(localNow, timezone)
      }
      if (currentTime >= endTime) {
        // Past window today, try next day
        continue
      }
    }

    // Return the window start time converted to UTC
    return convertFromTimezone(windowStart, timezone)
  }

  // Fallback: tomorrow same time
  const tomorrow = new Date(fromTime)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

/**
 * Batch update optimal send times for campaign leads
 */
export async function updateCampaignLeadOptimalTimes(
  campaignId: string
): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createClient()

  // Use database function for bulk update
  const { data, error } = await supabase.rpc('update_campaign_lead_optimal_times', {
    p_campaign_id: campaignId,
  })

  if (error) {
    // Fallback to individual updates
    return await updateOptimalTimesManually(campaignId)
  }

  return { updated: data || 0, errors: [] }
}

/**
 * Manual fallback for updating optimal times
 */
async function updateOptimalTimesManually(
  campaignId: string
): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createClient()
  let updated = 0
  const errors: string[] = []

  // Get campaign leads that need updating
  const { data: leads, error: fetchError } = await supabase
    .from('campaign_leads')
    .select('id, lead_id, recipient_timezone, leads!inner(timezone)')
    .eq('campaign_id', campaignId)
    .in('status', ['pending', 'ready', 'in_sequence'])
    .limit(500)

  if (fetchError || !leads) {
    return { updated: 0, errors: [fetchError?.message || 'Failed to fetch leads'] }
  }

  // Update each lead
  for (const lead of leads) {
    const timezone = lead.recipient_timezone || (lead.leads as any)?.timezone || null

    try {
      const optimalTime = await calculateOptimalSendTime(timezone, campaignId)

      const { error: updateError } = await supabase
        .from('campaign_leads')
        .update({
          optimal_send_time: optimalTime.optimalTime.toISOString(),
          recipient_timezone: optimalTime.recipientTimezone,
          scheduling_metadata: {
            calculated_at: new Date().toISOString(),
            reasoning: optimalTime.reasoning,
            timezone_source: timezone ? 'lead' : 'default',
          },
        })
        .eq('id', lead.id)

      if (updateError) {
        errors.push(`Lead ${lead.id}: ${updateError.message}`)
      } else {
        updated++
      }
    } catch (e: any) {
      errors.push(`Lead ${lead.id}: ${e.message}`)
    }
  }

  return { updated, errors }
}

/**
 * Get leads ready for send based on optimal times
 */
export async function getLeadsReadyForSend(
  campaignId: string,
  limit: number = 50
): Promise<
  Array<{
    campaignLeadId: string
    leadId: string
    recipientTimezone: string
    optimalSendTime: Date | null
  }>
> {
  const supabase = await createClient()

  // Try database function first
  const { data, error } = await supabase.rpc('get_leads_ready_for_send', {
    p_campaign_id: campaignId,
    p_limit: limit,
  })

  if (!error && data) {
    return data.map((row: any) => ({
      campaignLeadId: row.campaign_lead_id,
      leadId: row.lead_id,
      recipientTimezone: row.recipient_timezone,
      optimalSendTime: row.optimal_send_time ? new Date(row.optimal_send_time) : null,
    }))
  }

  // Fallback query
  const { data: fallbackData } = await supabase
    .from('campaign_leads')
    .select('id, lead_id, recipient_timezone, optimal_send_time, leads!inner(timezone)')
    .eq('campaign_id', campaignId)
    .in('status', ['ready', 'in_sequence'])
    .or('optimal_send_time.is.null,optimal_send_time.lte.now()')
    .order('optimal_send_time', { ascending: true, nullsFirst: true })
    .limit(limit)

  return (fallbackData || []).map((row) => ({
    campaignLeadId: row.id,
    leadId: row.lead_id,
    recipientTimezone: row.recipient_timezone || (row.leads as any)?.timezone || 'America/New_York',
    optimalSendTime: row.optimal_send_time ? new Date(row.optimal_send_time) : null,
  }))
}

/**
 * Infer timezone from company location or domain
 */
export async function inferTimezone(
  companyLocation?: { country?: string; state?: string; city?: string } | null,
  domain?: string | null
): Promise<{ timezone: string; source: 'location' | 'domain' | 'default'; confidence: number }> {
  // Location-based inference
  if (companyLocation?.country) {
    const tz = inferTimezoneFromLocation(companyLocation)
    if (tz) {
      return { timezone: tz, source: 'location', confidence: 0.8 }
    }
  }

  // Domain-based inference (TLD)
  if (domain) {
    const tz = inferTimezoneFromDomain(domain)
    if (tz) {
      return { timezone: tz, source: 'domain', confidence: 0.6 }
    }
  }

  // Default
  return { timezone: 'America/New_York', source: 'default', confidence: 0.3 }
}

/**
 * Infer timezone from location
 */
function inferTimezoneFromLocation(location: {
  country?: string
  state?: string
  city?: string
}): string | null {
  const country = location.country?.toLowerCase()
  const state = location.state?.toLowerCase()

  // US states
  if (country === 'us' || country === 'usa' || country === 'united states') {
    const easternStates = ['ny', 'new york', 'fl', 'florida', 'ga', 'georgia', 'nc', 'north carolina', 'va', 'virginia', 'ma', 'massachusetts', 'nj', 'new jersey', 'pa', 'pennsylvania', 'oh', 'ohio', 'mi', 'michigan']
    const centralStates = ['tx', 'texas', 'il', 'illinois', 'mn', 'minnesota', 'wi', 'wisconsin', 'tn', 'tennessee', 'mo', 'missouri']
    const mountainStates = ['co', 'colorado', 'az', 'arizona', 'ut', 'utah', 'nm', 'new mexico', 'mt', 'montana']
    const pacificStates = ['ca', 'california', 'wa', 'washington', 'or', 'oregon', 'nv', 'nevada']

    if (state && easternStates.some((s) => state.includes(s))) return 'America/New_York'
    if (state && centralStates.some((s) => state.includes(s))) return 'America/Chicago'
    if (state && mountainStates.some((s) => state.includes(s))) return 'America/Denver'
    if (state && pacificStates.some((s) => state.includes(s))) return 'America/Los_Angeles'

    return 'America/New_York' // Default US
  }

  // Other countries
  const countryTimezones: Record<string, string> = {
    'uk': 'Europe/London',
    'united kingdom': 'Europe/London',
    'gb': 'Europe/London',
    'de': 'Europe/Berlin',
    'germany': 'Europe/Berlin',
    'fr': 'Europe/Paris',
    'france': 'Europe/Paris',
    'nl': 'Europe/Amsterdam',
    'netherlands': 'Europe/Amsterdam',
    'jp': 'Asia/Tokyo',
    'japan': 'Asia/Tokyo',
    'sg': 'Asia/Singapore',
    'singapore': 'Asia/Singapore',
    'au': 'Australia/Sydney',
    'australia': 'Australia/Sydney',
    'in': 'Asia/Mumbai',
    'india': 'Asia/Mumbai',
    'cn': 'Asia/Shanghai',
    'china': 'Asia/Shanghai',
    'hk': 'Asia/Hong_Kong',
    'hong kong': 'Asia/Hong_Kong',
    'ae': 'Asia/Dubai',
    'uae': 'Asia/Dubai',
    'united arab emirates': 'Asia/Dubai',
    'ca': 'America/Toronto',
    'canada': 'America/Toronto',
  }

  return countryTimezones[country || ''] || null
}

/**
 * Infer timezone from domain TLD
 */
function inferTimezoneFromDomain(domain: string): string | null {
  const tld = domain.split('.').pop()?.toLowerCase()

  const tldTimezones: Record<string, string> = {
    'uk': 'Europe/London',
    'de': 'Europe/Berlin',
    'fr': 'Europe/Paris',
    'nl': 'Europe/Amsterdam',
    'jp': 'Asia/Tokyo',
    'sg': 'Asia/Singapore',
    'au': 'Australia/Sydney',
    'in': 'Asia/Mumbai',
    'cn': 'Asia/Shanghai',
    'hk': 'Asia/Hong_Kong',
    'ae': 'Asia/Dubai',
    'ca': 'America/Toronto',
  }

  return tldTimezones[tld || ''] || null
}

// ============ Timezone Utility Functions ============

/**
 * Get current time in a specific timezone
 */
function getTimeInTimezone(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const values: Record<string, number> = {}
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = parseInt(part.value, 10)
    }
  })

  return new Date(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  )
}

/**
 * Convert a date from a timezone to UTC
 */
function convertFromTimezone(localDate: Date, timezone: string): Date {
  // Get the offset
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }))
  const offset = utcDate.getTime() - tzDate.getTime()

  return new Date(localDate.getTime() + offset)
}

/**
 * Format a date in a specific timezone
 */
function formatInTimezone(date: Date, timezone: string): string {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Get day name (mon, tue, etc.) for a date
 */
function getDayName(date: Date): WeekDay {
  const days: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[date.getDay()]
}

/**
 * Get time string (HH:MM) from a date
 */
function getTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Check if a timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date()
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
}

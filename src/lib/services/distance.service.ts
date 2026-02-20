/**
 * Distance Calculation & Proximity Service
 * Cursive Platform
 *
 * Calculate distances between coordinates and find leads
 * within a specified radius of a user's location.
 */

import { createClient } from '@/lib/supabase/server'
import { geocodingService, type GeocodingInput } from './geocoding.service'
import { safeError } from '@/lib/utils/log-sanitizer'

// ============================================
// TYPES
// ============================================

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface DistanceResult {
  miles: number
  kilometers: number
  formatted: string
}

export interface LeadWithDistance {
  id: string
  company_name: string
  city?: string
  state?: string
  distance_miles: number
  distance_formatted: string
  coordinates?: Coordinates
}

export interface ProximitySearchOptions {
  workspace_id: string
  center: Coordinates
  radius_miles: number
  limit?: number
  offset?: number
  filters?: {
    industry?: string[]
    state?: string[]
    min_score?: number
  }
}

export interface ProximitySearchResult {
  leads: LeadWithDistance[]
  total_count: number
  center: Coordinates
  radius_miles: number
}

// ============================================
// CONSTANTS
// ============================================

const EARTH_RADIUS_MILES = 3959
const EARTH_RADIUS_KM = 6371
const MILES_PER_KM = 0.621371

// ============================================
// DISTANCE SERVICE CLASS
// ============================================

export class DistanceService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(from: Coordinates, to: Coordinates): DistanceResult {
    const lat1 = this.toRadians(from.latitude)
    const lat2 = this.toRadians(to.latitude)
    const deltaLat = this.toRadians(to.latitude - from.latitude)
    const deltaLon = this.toRadians(to.longitude - from.longitude)

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const miles = EARTH_RADIUS_MILES * c
    const kilometers = EARTH_RADIUS_KM * c

    return {
      miles: Math.round(miles * 10) / 10,
      kilometers: Math.round(kilometers * 10) / 10,
      formatted: this.formatDistance(miles),
    }
  }

  /**
   * Format distance as human-readable string
   */
  formatDistance(miles: number): string {
    if (miles < 0.1) {
      return 'Less than 0.1 mi'
    } else if (miles < 1) {
      return `${Math.round(miles * 10) / 10} mi`
    } else if (miles < 10) {
      return `${Math.round(miles * 10) / 10} mi`
    } else if (miles < 100) {
      return `${Math.round(miles)} mi`
    } else {
      return `${Math.round(miles / 10) * 10} mi`
    }
  }

  /**
   * Get user's coordinates from their location input
   */
  async getUserCoordinates(location: GeocodingInput): Promise<Coordinates | null> {
    const result = await geocodingService.geocode(location)
    if (!result) return null

    return {
      latitude: result.latitude,
      longitude: result.longitude,
    }
  }

  /**
   * Find leads within a radius of a location
   */
  async findLeadsWithinRadius(options: ProximitySearchOptions): Promise<ProximitySearchResult> {
    const { workspace_id, center, radius_miles, limit = 50, offset = 0, filters } = options

    const supabase = await createClient()

    // Use the database function for efficient radius search
    // This uses the Haversine formula directly in PostgreSQL
    let query = supabase.rpc('leads_within_radius', {
      p_workspace_id: workspace_id,
      p_lat: center.latitude,
      p_lon: center.longitude,
      p_radius_miles: radius_miles,
    })

    // Note: Additional filters would need to be handled differently
    // since we're using an RPC function. For complex filtering,
    // we'd need to create a more sophisticated stored procedure.

    const { data: leadsData, error } = await query

    if (error) {
      safeError('[Distance] Proximity search error:', error)
      return {
        leads: [],
        total_count: 0,
        center,
        radius_miles,
      }
    }

    // Transform results
    const leads: LeadWithDistance[] = (leadsData || []).map((lead: {
      lead_id: string
      company_name: string
      city: string
      state: string
      distance_miles: number
    }) => ({
      id: lead.lead_id,
      company_name: lead.company_name,
      city: lead.city,
      state: lead.state,
      distance_miles: Math.round(lead.distance_miles * 10) / 10,
      distance_formatted: this.formatDistance(lead.distance_miles),
    }))

    // Apply additional filters client-side if needed
    let filteredLeads = leads
    if (filters?.state && filters.state.length > 0) {
      filteredLeads = filteredLeads.filter(
        (l) => l.state && filters.state!.includes(l.state)
      )
    }

    // Apply pagination
    const totalCount = filteredLeads.length
    const paginatedLeads = filteredLeads.slice(offset, offset + limit)

    return {
      leads: paginatedLeads,
      total_count: totalCount,
      center,
      radius_miles,
    }
  }

  /**
   * Alternative: Find leads within radius using direct SQL query
   * Use this if the RPC function isn't available
   */
  async findLeadsWithinRadiusDirect(options: ProximitySearchOptions): Promise<ProximitySearchResult> {
    const { workspace_id, center, radius_miles, limit = 50, offset = 0 } = options

    const supabase = await createClient()

    // Bounding box optimization - filter by rough lat/lng range first
    // This significantly speeds up the query by reducing the number of
    // distance calculations needed
    const latDelta = radius_miles / 69 // ~69 miles per degree of latitude
    const lngDelta = radius_miles / (69 * Math.cos(this.toRadians(center.latitude)))

    const minLat = center.latitude - latDelta
    const maxLat = center.latitude + latDelta
    const minLng = center.longitude - lngDelta
    const maxLng = center.longitude + lngDelta

    // Query leads within bounding box
    const { data: leadsData, error } = await supabase
      .from('leads')
      .select(`
        id,
        company_data,
        city_normalized,
        state_abbrev,
        latitude,
        longitude
      `)
      .eq('workspace_id', workspace_id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)

    if (error) {
      safeError('[Distance] Direct proximity search error:', error)
      return {
        leads: [],
        total_count: 0,
        center,
        radius_miles,
      }
    }

    // Calculate exact distance and filter
    const leadsWithDistance: LeadWithDistance[] = []

    for (const lead of leadsData || []) {
      if (!lead.latitude || !lead.longitude) continue

      const distance = this.calculateDistance(center, {
        latitude: parseFloat(lead.latitude),
        longitude: parseFloat(lead.longitude),
      })

      if (distance.miles <= radius_miles) {
        leadsWithDistance.push({
          id: lead.id,
          company_name: (lead.company_data as { name?: string })?.name || 'Unknown',
          city: lead.city_normalized,
          state: lead.state_abbrev,
          distance_miles: distance.miles,
          distance_formatted: distance.formatted,
          coordinates: {
            latitude: parseFloat(lead.latitude),
            longitude: parseFloat(lead.longitude),
          },
        })
      }
    }

    // Sort by distance
    leadsWithDistance.sort((a, b) => a.distance_miles - b.distance_miles)

    // Apply pagination
    const totalCount = leadsWithDistance.length
    const paginatedLeads = leadsWithDistance.slice(offset, offset + limit)

    return {
      leads: paginatedLeads,
      total_count: totalCount,
      center,
      radius_miles,
    }
  }

  /**
   * Calculate distances for a list of leads from a center point
   */
  async addDistancesToLeads(
    leads: Array<{ id: string; latitude?: number; longitude?: number; [key: string]: unknown }>,
    center: Coordinates
  ): Promise<LeadWithDistance[]> {
    return leads
      .filter((lead) => lead.latitude != null && lead.longitude != null)
      .map((lead) => {
        const distance = this.calculateDistance(center, {
          latitude: lead.latitude!,
          longitude: lead.longitude!,
        })

        return {
          id: lead.id,
          company_name: String((lead as { company_data?: { name?: string } }).company_data?.name || 'Unknown'),
          city: String(lead.city_normalized || ''),
          state: String(lead.state_abbrev || ''),
          distance_miles: distance.miles,
          distance_formatted: distance.formatted,
          coordinates: {
            latitude: lead.latitude!,
            longitude: lead.longitude!,
          },
        }
      })
      .sort((a, b) => a.distance_miles - b.distance_miles)
  }

  /**
   * Get distance brackets (for filtering UI)
   */
  getDistanceBrackets(): Array<{ value: number; label: string }> {
    return [
      { value: 5, label: 'Within 5 miles' },
      { value: 10, label: 'Within 10 miles' },
      { value: 25, label: 'Within 25 miles' },
      { value: 50, label: 'Within 50 miles' },
      { value: 100, label: 'Within 100 miles' },
      { value: 250, label: 'Within 250 miles' },
      { value: 500, label: 'Within 500 miles' },
    ]
  }

  /**
   * Check if a point is within a radius of another point
   */
  isWithinRadius(point: Coordinates, center: Coordinates, radius_miles: number): boolean {
    const distance = this.calculateDistance(center, point)
    return distance.miles <= radius_miles
  }

  /**
   * Get the bounding box for a radius search (for map displays)
   */
  getBoundingBox(
    center: Coordinates,
    radius_miles: number
  ): { north: number; south: number; east: number; west: number } {
    const latDelta = radius_miles / 69
    const lngDelta = radius_miles / (69 * Math.cos(this.toRadians(center.latitude)))

    return {
      north: center.latitude + latDelta,
      south: center.latitude - latDelta,
      east: center.longitude + lngDelta,
      west: center.longitude - lngDelta,
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

// Export singleton instance
export const distanceService = new DistanceService()

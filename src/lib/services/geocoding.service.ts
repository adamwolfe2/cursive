/**
 * Geocoding Service
 * Cursive Platform
 *
 * Converts addresses to lat/lng coordinates using multiple providers
 * with caching and fallback strategies.
 */

import { createClient } from '@/lib/supabase/server'

// ============================================
// TYPES
// ============================================

export interface GeocodingResult {
  latitude: number
  longitude: number
  formatted_address?: string
  accuracy: 'address' | 'postal_code' | 'city' | 'state' | 'country'
  source: 'cache' | 'city_lookup' | 'google' | 'mapbox' | 'census' | 'manual'
  normalized?: {
    city?: string
    state?: string
    state_abbrev?: string
    postal_code?: string
    country?: string
    country_code?: string
  }
}

export interface GeocodingInput {
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface GeocodeProviderConfig {
  google?: { apiKey: string }
  mapbox?: { accessToken: string }
  census?: { enabled: boolean }
}

// ============================================
// US CITY COORDINATES (MAJOR CITIES)
// ============================================

// Built-in coordinates for top US cities (fallback when no API available)
const US_MAJOR_CITIES: Record<string, Record<string, { lat: number; lng: number }>> = {
  'AL': {
    'Birmingham': { lat: 33.5207, lng: -86.8025 },
    'Montgomery': { lat: 32.3668, lng: -86.2999 },
    'Huntsville': { lat: 34.7304, lng: -86.5861 },
  },
  'AK': {
    'Anchorage': { lat: 61.2181, lng: -149.9003 },
    'Fairbanks': { lat: 64.8378, lng: -147.7164 },
  },
  'AZ': {
    'Phoenix': { lat: 33.4484, lng: -112.0740 },
    'Tucson': { lat: 32.2226, lng: -110.9747 },
    'Mesa': { lat: 33.4152, lng: -111.8315 },
    'Scottsdale': { lat: 33.4942, lng: -111.9261 },
  },
  'CA': {
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'San Diego': { lat: 32.7157, lng: -117.1611 },
    'San Jose': { lat: 37.3382, lng: -121.8863 },
    'Sacramento': { lat: 38.5816, lng: -121.4944 },
    'Oakland': { lat: 37.8044, lng: -122.2712 },
    'Fresno': { lat: 36.7378, lng: -119.7871 },
    'Long Beach': { lat: 33.7701, lng: -118.1937 },
    'Irvine': { lat: 33.6846, lng: -117.8265 },
    'Santa Monica': { lat: 34.0195, lng: -118.4912 },
    'Palo Alto': { lat: 37.4419, lng: -122.1430 },
  },
  'CO': {
    'Denver': { lat: 39.7392, lng: -104.9903 },
    'Colorado Springs': { lat: 38.8339, lng: -104.8214 },
    'Boulder': { lat: 40.0150, lng: -105.2705 },
  },
  'CT': {
    'Hartford': { lat: 41.7658, lng: -72.6734 },
    'New Haven': { lat: 41.3083, lng: -72.9279 },
    'Stamford': { lat: 41.0534, lng: -73.5387 },
  },
  'DC': {
    'Washington': { lat: 38.9072, lng: -77.0369 },
  },
  'FL': {
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Orlando': { lat: 28.5383, lng: -81.3792 },
    'Tampa': { lat: 27.9506, lng: -82.4572 },
    'Jacksonville': { lat: 30.3322, lng: -81.6557 },
    'Fort Lauderdale': { lat: 26.1224, lng: -80.1373 },
  },
  'GA': {
    'Atlanta': { lat: 33.7490, lng: -84.3880 },
    'Savannah': { lat: 32.0809, lng: -81.0912 },
    'Augusta': { lat: 33.4735, lng: -82.0105 },
  },
  'IL': {
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Springfield': { lat: 39.7817, lng: -89.6501 },
    'Naperville': { lat: 41.7508, lng: -88.1535 },
  },
  'MA': {
    'Boston': { lat: 42.3601, lng: -71.0589 },
    'Cambridge': { lat: 42.3736, lng: -71.1097 },
    'Worcester': { lat: 42.2626, lng: -71.8023 },
  },
  'MI': {
    'Detroit': { lat: 42.3314, lng: -83.0458 },
    'Grand Rapids': { lat: 42.9634, lng: -85.6681 },
    'Ann Arbor': { lat: 42.2808, lng: -83.7430 },
  },
  'MN': {
    'Minneapolis': { lat: 44.9778, lng: -93.2650 },
    'St. Paul': { lat: 44.9537, lng: -93.0900 },
  },
  'NC': {
    'Charlotte': { lat: 35.2271, lng: -80.8431 },
    'Raleigh': { lat: 35.7796, lng: -78.6382 },
    'Durham': { lat: 35.9940, lng: -78.8986 },
  },
  'NJ': {
    'Newark': { lat: 40.7357, lng: -74.1724 },
    'Jersey City': { lat: 40.7178, lng: -74.0431 },
    'Trenton': { lat: 40.2171, lng: -74.7429 },
  },
  'NY': {
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Buffalo': { lat: 42.8864, lng: -78.8784 },
    'Albany': { lat: 42.6526, lng: -73.7562 },
    'Rochester': { lat: 43.1566, lng: -77.6088 },
  },
  'OH': {
    'Columbus': { lat: 39.9612, lng: -82.9988 },
    'Cleveland': { lat: 41.4993, lng: -81.6944 },
    'Cincinnati': { lat: 39.1031, lng: -84.5120 },
  },
  'OR': {
    'Portland': { lat: 45.5152, lng: -122.6784 },
    'Eugene': { lat: 44.0521, lng: -123.0868 },
  },
  'PA': {
    'Philadelphia': { lat: 39.9526, lng: -75.1652 },
    'Pittsburgh': { lat: 40.4406, lng: -79.9959 },
    'Harrisburg': { lat: 40.2732, lng: -76.8867 },
  },
  'TX': {
    'Houston': { lat: 29.7604, lng: -95.3698 },
    'Dallas': { lat: 32.7767, lng: -96.7970 },
    'Austin': { lat: 30.2672, lng: -97.7431 },
    'San Antonio': { lat: 29.4241, lng: -98.4936 },
    'Fort Worth': { lat: 32.7555, lng: -97.3308 },
  },
  'VA': {
    'Virginia Beach': { lat: 36.8529, lng: -75.9780 },
    'Richmond': { lat: 37.5407, lng: -77.4360 },
    'Norfolk': { lat: 36.8508, lng: -76.2859 },
  },
  'WA': {
    'Seattle': { lat: 47.6062, lng: -122.3321 },
    'Spokane': { lat: 47.6588, lng: -117.4260 },
    'Tacoma': { lat: 47.2529, lng: -122.4443 },
  },
}

// State centroids for fallback
const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'AL': { lat: 32.806671, lng: -86.791130 },
  'AK': { lat: 61.370716, lng: -152.404419 },
  'AZ': { lat: 33.729759, lng: -111.431221 },
  'AR': { lat: 34.969704, lng: -92.373123 },
  'CA': { lat: 36.116203, lng: -119.681564 },
  'CO': { lat: 39.059811, lng: -105.311104 },
  'CT': { lat: 41.597782, lng: -72.755371 },
  'DE': { lat: 39.318523, lng: -75.507141 },
  'DC': { lat: 38.897438, lng: -77.026817 },
  'FL': { lat: 27.766279, lng: -81.686783 },
  'GA': { lat: 33.040619, lng: -83.643074 },
  'HI': { lat: 21.094318, lng: -157.498337 },
  'ID': { lat: 44.240459, lng: -114.478828 },
  'IL': { lat: 40.349457, lng: -88.986137 },
  'IN': { lat: 39.849426, lng: -86.258278 },
  'IA': { lat: 42.011539, lng: -93.210526 },
  'KS': { lat: 38.526600, lng: -96.726486 },
  'KY': { lat: 37.668140, lng: -84.670067 },
  'LA': { lat: 31.169546, lng: -91.867805 },
  'ME': { lat: 44.693947, lng: -69.381927 },
  'MD': { lat: 39.063946, lng: -76.802101 },
  'MA': { lat: 42.230171, lng: -71.530106 },
  'MI': { lat: 43.326618, lng: -84.536095 },
  'MN': { lat: 45.694454, lng: -93.900192 },
  'MS': { lat: 32.741646, lng: -89.678696 },
  'MO': { lat: 38.456085, lng: -92.288368 },
  'MT': { lat: 46.921925, lng: -110.454353 },
  'NE': { lat: 41.125370, lng: -98.268082 },
  'NV': { lat: 38.313515, lng: -117.055374 },
  'NH': { lat: 43.452492, lng: -71.563896 },
  'NJ': { lat: 40.298904, lng: -74.521011 },
  'NM': { lat: 34.840515, lng: -106.248482 },
  'NY': { lat: 42.165726, lng: -74.948051 },
  'NC': { lat: 35.630066, lng: -79.806419 },
  'ND': { lat: 47.528912, lng: -99.784012 },
  'OH': { lat: 40.388783, lng: -82.764915 },
  'OK': { lat: 35.565342, lng: -96.928917 },
  'OR': { lat: 44.572021, lng: -122.070938 },
  'PA': { lat: 40.590752, lng: -77.209755 },
  'RI': { lat: 41.680893, lng: -71.511780 },
  'SC': { lat: 33.856892, lng: -80.945007 },
  'SD': { lat: 44.299782, lng: -99.438828 },
  'TN': { lat: 35.747845, lng: -86.692345 },
  'TX': { lat: 31.054487, lng: -97.563461 },
  'UT': { lat: 40.150032, lng: -111.862434 },
  'VT': { lat: 44.045876, lng: -72.710686 },
  'VA': { lat: 37.769337, lng: -78.169968 },
  'WA': { lat: 47.400902, lng: -121.490494 },
  'WV': { lat: 38.491226, lng: -80.954453 },
  'WI': { lat: 44.268543, lng: -89.616508 },
  'WY': { lat: 42.755966, lng: -107.302490 },
}

// ============================================
// GEOCODING SERVICE CLASS
// ============================================

export class GeocodingService {
  private config: GeocodeProviderConfig

  constructor(config?: GeocodeProviderConfig) {
    this.config = config || {
      google: process.env.GOOGLE_MAPS_API_KEY
        ? { apiKey: process.env.GOOGLE_MAPS_API_KEY }
        : undefined,
      mapbox: process.env.MAPBOX_ACCESS_TOKEN
        ? { accessToken: process.env.MAPBOX_ACCESS_TOKEN }
        : undefined,
      census: { enabled: true },
    }
  }

  /**
   * Geocode an address with caching and fallbacks
   */
  async geocode(input: GeocodingInput): Promise<GeocodingResult | null> {
    // 1. Check cache first
    const cached = await this.checkCache(input)
    if (cached) {
      return cached
    }

    // 2. Try built-in city lookup (no API needed)
    const cityLookup = this.lookupCity(input)
    if (cityLookup) {
      await this.saveToCache(input, cityLookup)
      return cityLookup
    }

    // 3. Try Google Maps API if configured
    if (this.config.google?.apiKey) {
      const googleResult = await this.geocodeWithGoogle(input)
      if (googleResult) {
        await this.saveToCache(input, googleResult)
        return googleResult
      }
    }

    // 4. Try Mapbox if configured
    if (this.config.mapbox?.accessToken) {
      const mapboxResult = await this.geocodeWithMapbox(input)
      if (mapboxResult) {
        await this.saveToCache(input, mapboxResult)
        return mapboxResult
      }
    }

    // 5. Try US Census Geocoder (free, US only)
    if (this.config.census?.enabled && this.isUSAddress(input)) {
      const censusResult = await this.geocodeWithCensus(input)
      if (censusResult) {
        await this.saveToCache(input, censusResult)
        return censusResult
      }
    }

    // 6. Fallback to state centroid
    const stateFallback = this.getStateCentroid(input)
    if (stateFallback) {
      return stateFallback
    }

    return null
  }

  /**
   * Check cache for existing geocode result
   */
  private async checkCache(input: GeocodingInput): Promise<GeocodingResult | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('geocode_cache')
        .select('*')
        .eq('city', input.city || '')
        .eq('state', input.state || '')
        .eq('postal_code', input.postal_code || '')
        .eq('country', input.country || 'US')
        .single()

      if (error || !data) return null

      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        formatted_address: data.formatted_address,
        accuracy: data.accuracy as GeocodingResult['accuracy'],
        source: 'cache',
        normalized: {
          city: data.normalized_city,
          state: data.normalized_state,
          state_abbrev: data.normalized_state_abbrev,
          postal_code: data.normalized_postal_code,
          country: data.normalized_country,
          country_code: data.normalized_country_code,
        },
      }
    } catch {
      return null
    }
  }

  /**
   * Save geocode result to cache
   */
  private async saveToCache(input: GeocodingInput, result: GeocodingResult): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from('geocode_cache').upsert({
        address: input.address,
        city: input.city,
        state: input.state,
        postal_code: input.postal_code,
        country: input.country || 'US',
        latitude: result.latitude,
        longitude: result.longitude,
        formatted_address: result.formatted_address,
        accuracy: result.accuracy,
        source: result.source,
        normalized_city: result.normalized?.city,
        normalized_state: result.normalized?.state,
        normalized_state_abbrev: result.normalized?.state_abbrev,
        normalized_postal_code: result.normalized?.postal_code,
        normalized_country: result.normalized?.country,
        normalized_country_code: result.normalized?.country_code,
      }, {
        onConflict: 'geocode_cache_location_key',
      })
    } catch {
      // Cache save failed, continue anyway
    }
  }

  /**
   * Look up city coordinates from built-in data
   */
  private lookupCity(input: GeocodingInput): GeocodingResult | null {
    if (!input.city || !input.state) return null

    const stateAbbrev = input.state.toUpperCase()
    const cityNormalized = this.normalizeCity(input.city)

    const stateData = US_MAJOR_CITIES[stateAbbrev]
    if (!stateData) return null

    // Try exact match
    for (const [city, coords] of Object.entries(stateData)) {
      if (this.normalizeCity(city) === cityNormalized) {
        return {
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: 'city',
          source: 'city_lookup',
          normalized: {
            city,
            state_abbrev: stateAbbrev,
          },
        }
      }
    }

    // Try fuzzy match
    for (const [city, coords] of Object.entries(stateData)) {
      if (this.fuzzyMatch(cityNormalized, this.normalizeCity(city))) {
        return {
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: 'city',
          source: 'city_lookup',
          normalized: {
            city,
            state_abbrev: stateAbbrev,
          },
        }
      }
    }

    return null
  }

  /**
   * Get state centroid as fallback
   */
  private getStateCentroid(input: GeocodingInput): GeocodingResult | null {
    if (!input.state) return null

    const stateAbbrev = input.state.toUpperCase()
    const centroid = STATE_CENTROIDS[stateAbbrev]

    if (!centroid) return null

    return {
      latitude: centroid.lat,
      longitude: centroid.lng,
      accuracy: 'state',
      source: 'city_lookup',
      normalized: {
        state_abbrev: stateAbbrev,
      },
    }
  }

  /**
   * Geocode using Google Maps API
   */
  private async geocodeWithGoogle(input: GeocodingInput): Promise<GeocodingResult | null> {
    if (!this.config.google?.apiKey) return null

    try {
      const address = this.buildAddressString(input)
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
      url.searchParams.set('address', address)
      url.searchParams.set('key', this.config.google.apiKey)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(url.toString(), { signal: controller.signal })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (data.status !== 'OK' || !data.results?.[0]) return null

      const result = data.results[0]
      const location = result.geometry.location

      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        accuracy: this.parseGoogleAccuracy(result.geometry.location_type),
        source: 'google',
        normalized: this.parseGoogleComponents(result.address_components),
      }
    } catch {
      return null
    }
  }

  /**
   * Geocode using Mapbox API
   */
  private async geocodeWithMapbox(input: GeocodingInput): Promise<GeocodingResult | null> {
    if (!this.config.mapbox?.accessToken) return null

    try {
      const address = this.buildAddressString(input)
      const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`
      )
      url.searchParams.set('access_token', this.config.mapbox.accessToken)
      url.searchParams.set('country', input.country === 'United States' ? 'US' : input.country || 'US')
      url.searchParams.set('limit', '1')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(url.toString(), { signal: controller.signal })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!data.features?.[0]) return null

      const feature = data.features[0]
      const [lng, lat] = feature.center

      return {
        latitude: lat,
        longitude: lng,
        formatted_address: feature.place_name,
        accuracy: this.parseMapboxAccuracy(feature.place_type[0]),
        source: 'mapbox',
      }
    } catch {
      return null
    }
  }

  /**
   * Geocode using US Census Geocoder (free)
   */
  private async geocodeWithCensus(input: GeocodingInput): Promise<GeocodingResult | null> {
    try {
      const address = this.buildAddressString(input)
      const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
      url.searchParams.set('address', address)
      url.searchParams.set('benchmark', 'Public_AR_Current')
      url.searchParams.set('format', 'json')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(url.toString(), { signal: controller.signal })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!data.result?.addressMatches?.[0]) return null

      const match = data.result.addressMatches[0]
      return {
        latitude: match.coordinates.y,
        longitude: match.coordinates.x,
        formatted_address: match.matchedAddress,
        accuracy: 'address',
        source: 'census',
      }
    } catch {
      return null
    }
  }

  /**
   * Build address string from components
   */
  private buildAddressString(input: GeocodingInput): string {
    const parts = []
    if (input.address) parts.push(input.address)
    if (input.city) parts.push(input.city)
    if (input.state) parts.push(input.state)
    if (input.postal_code) parts.push(input.postal_code)
    if (input.country) parts.push(input.country)
    return parts.join(', ')
  }

  /**
   * Check if address is in the US
   */
  private isUSAddress(input: GeocodingInput): boolean {
    if (!input.country) return true // Default to US
    const country = input.country.toLowerCase()
    return ['us', 'usa', 'united states', 'united states of america'].includes(country)
  }

  /**
   * Normalize city name for comparison
   */
  private normalizeCity(city: string): string {
    return city
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Fuzzy match two strings
   */
  private fuzzyMatch(a: string, b: string): boolean {
    if (a.includes(b) || b.includes(a)) return true
    // Simple Levenshtein threshold
    const maxLen = Math.max(a.length, b.length)
    if (maxLen === 0) return true
    const distance = this.levenshtein(a, b)
    return (1 - distance / maxLen) >= 0.85
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= b.length; i++) matrix[i] = [i]
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[b.length][a.length]
  }

  /**
   * Parse Google accuracy level
   */
  private parseGoogleAccuracy(locationType: string): GeocodingResult['accuracy'] {
    switch (locationType) {
      case 'ROOFTOP': return 'address'
      case 'RANGE_INTERPOLATED': return 'address'
      case 'GEOMETRIC_CENTER': return 'postal_code'
      case 'APPROXIMATE': return 'city'
      default: return 'city'
    }
  }

  /**
   * Parse Mapbox accuracy level
   */
  private parseMapboxAccuracy(placeType: string): GeocodingResult['accuracy'] {
    switch (placeType) {
      case 'address': return 'address'
      case 'postcode': return 'postal_code'
      case 'place': return 'city'
      case 'region': return 'state'
      case 'country': return 'country'
      default: return 'city'
    }
  }

  /**
   * Parse Google address components
   */
  private parseGoogleComponents(components: Array<{ long_name: string; short_name: string; types: string[] }>): GeocodingResult['normalized'] {
    const result: GeocodingResult['normalized'] = {}

    for (const component of components) {
      if (component.types.includes('locality')) {
        result.city = component.long_name
      }
      if (component.types.includes('administrative_area_level_1')) {
        result.state = component.long_name
        result.state_abbrev = component.short_name
      }
      if (component.types.includes('postal_code')) {
        result.postal_code = component.short_name
      }
      if (component.types.includes('country')) {
        result.country = component.long_name
        result.country_code = component.short_name
      }
    }

    return result
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()

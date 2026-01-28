/**
 * DataShopper API Types
 * Based on DataShopper V2 API documentation
 *
 * DataShopper is a visitor identification + data enrichment platform.
 * It identifies anonymous website visitors and enriches contacts with 300+ data points.
 *
 * NOTE: DataShopper does NOT provide:
 * - Intent-based B2B lead queries
 * - Topic or intent signal filtering
 * - Bulk queries by industry/geography
 */

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface DataShopperAuthParams {
  api_key: string
  website: string // website slug
}

export interface GetVisitorResultsParams extends DataShopperAuthParams {
  search?: string // Filter by name, email, phone, or URL path
  start?: string // yyyy-mm-dd
  end?: string // yyyy-mm-dd
}

export interface EnrichByEmailParams extends DataShopperAuthParams {
  email: string
}

export interface EnrichByPhoneParams extends DataShopperAuthParams {
  phone: string
}

export interface EnrichByMd5Params extends DataShopperAuthParams {
  md5: string
}

export interface EnrichByIdParams extends DataShopperAuthParams {
  id: string
}

export interface EnrichByDeviceParams extends DataShopperAuthParams {
  deviceId: string // AAID or IDFA
}

export interface EnrichByIpParams extends DataShopperAuthParams {
  ip: string
}

export interface EnrichByVehicleParams extends DataShopperAuthParams {
  vin: string
}

export interface EnrichByPiiParams extends DataShopperAuthParams {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zip: string
}

// V1 Batch request types
export interface BatchPiiRecord {
  FirstName: string
  LastName: string
  Address: string
  Zip: string
  Sequence: string // Custom ID for tracking
}

export interface BatchEnrichParams extends DataShopperAuthParams {
  object_list: string[] | BatchPiiRecord[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface DataShopperResponse<T = DataShopperIdentity[]> {
  success: boolean
  data: {
    identities: T
  }
}

export interface DataShopperPhone {
  phone: number
  dnc: boolean // Do Not Call registry
  carrier: string
  addedDate: string
  updateDate: string
  lastSeenDate: string
  phoneType: 0 | 1 | 3 // 0=unknown, 1=landline, 3=mobile
  workPhone: boolean
  rankOrder: number // 1 = primary
  qualityLevel: number // 0-4 scale
  activityStatus: string // A1, A7 = active, I4 = inactive
  contactabilityScore: string // A-K scale (A best)
}

export interface DataShopperEmail {
  email: string
  md5: string
  optIn: boolean
  qualityLevel: number // 0-4 scale
  ip: string
  rankOrder: number // 1 = primary
  registerDate: string
  updateDate: string
  url: string
}

export interface DataShopperCompany {
  title: string // "PRINCIPAL", "OWNER", "CEO", etc.
  company: string
  address: string
  city: string
  state: string
  zip: string
  phone: number
  email?: string
  linkedin?: string
  sic: string // Standard Industrial Classification code
  sicDescription: string
}

export interface DataShopperVehicle {
  vin: string
  make: string
  model: string
  manufacturer: string
  manufacturerBased: string // "European", "American", "Asian"
  year: number
  fuel: string // G=gas, D=diesel, E=electric, H=hybrid
  msrp: number
  style: string
  bodyType: string // SUV, Sedan, Truck, etc.
  class: string // Luxury, Economy, etc.
  doors: number
  driveType: string // AWD, FWD, RWD
  vehicleType: string
  size: string // Compact, Mid-Size, Full-Size
  weight: string
  maxPayload: number
  trim: string
  engineCylinders: number
  transmissionType: string // A=auto, M=manual
  transmissionGears: number
  gvwRange: string
  rankOrder: number
}

export interface DataShopperFinances {
  householdIncome: string
  discretionaryIncome: string
  financialPower: number // 1-10 scale
  creditRange: string
}

export interface DataShopperDemographicData {
  // Segmentation
  sourceNumber: number
  eagles18Segment: string
  eagles60Segment: string
  eagles120Segment: string
  eagles4800Segment: string

  // Demographics
  addressType: string // "Single Family", etc.
  ethnicityDetail: string
  ethnicGroup: string
  gender: string
  age: number
  birthYear: number
  generation: string // "Generation X (1961-1981)", etc.
  maritalStatus: string
  religion: string
  language: string
  speaksEnglish: boolean
  multilingual: boolean
  education: string
  urbanicity: string

  // Household
  householdAdults: number
  householdPersons: number
  householdChild: boolean
  householdChildAged0to3: boolean
  householdChildAged4to6: boolean
  householdChildAged7to9: boolean
  householdChildAged10to12: boolean
  householdChildAged13to18: boolean
  householdVeteran: boolean

  // Financial
  incomeLevel: string
  householdIncome: string
  householdIncomeMidpoint: number
  medianIncome: number
  creditRange: string
  creditMidpoint: number
  householdNetWorth: string
  householdNetWorthMidpoint: number
  creditCard: boolean
  bankCard: boolean
  premiumCard: boolean
  amexCard: boolean
  premiumAmexCard: boolean
  ownsInvestments: boolean
  ownsStocksAndBonds: boolean
  ownsMutualFunds: boolean
  investor: boolean

  // Property
  homeOwnership: string
  homeValue: number
  medianHomeValue: number
  mortgageAmount: number
  mortgageRefinanceAmount: number
  mortgageRefinanceAge: number
  lengthOfResidence: number
  dwellingType: string
  singleFamilyDwelling: boolean
  homePurchasedYearsAgo: number
  ownsSwimmingPool: boolean

  // Occupation
  occupationDetail: string
  occupationType: string
  occupationCategory: string
  whiteCollar: boolean
  blueCollar: boolean

  // Vehicle summary
  householdVehicles: number
  vehicleTypeSuv: boolean
  vehicleTypeSedan: boolean
  vehicleClassLuxury: boolean
  vehicleYearEarliest: number
  vehicleYearLatest: number

  // Interests (100+ boolean fields - partial list)
  carsInterest: boolean
  entertainmentInterest: boolean
  homeImprovementInterest: boolean
  diy: boolean
  fitness: boolean
  epicurean: boolean
  gardening: boolean
  golf: boolean
  healthyLivingInterest: boolean
  cooking: boolean
  photography: boolean
  selfImprovement: boolean
  homeDecor: boolean
  hunting: boolean
  motorcycles: boolean
  movies: boolean
  music: boolean
  outdoors: boolean
  campingHiking: boolean
  fishing: boolean
  travel: boolean
  travelBusiness: boolean
  travelPersonal: boolean
  travelCruises: boolean
  travelVacation: boolean
  travelForeign: boolean
  petOwner: boolean
  catOwner: boolean
  dogOwner: boolean
  magazineSubscriber: boolean
  books: boolean
  investments: boolean

  // Reading interests
  readingAvidReader: boolean
  readingFiction: boolean
  readingFinance: boolean
  readingScienceTechnology: boolean
  readingWorldNewsPolitics: boolean

  // Donations
  likelyCharitableDonor: boolean
  recentDonationEnvironmentalCause: boolean
  recentDonationHealthCause: boolean
  voter: boolean
  politicalContributor: boolean

  // Affinities (1-5 scale)
  apparelAffinity: number
  cookingAffinity: number
  doItYourselfAffinity: number
  gardeningAffinity: number
  homeDecoratingAffinity: number
  travelAffinity: number
  travelUsAffinity: number
  tvMoviesAffinity: number

  // Purchase behavior
  recentCatalogPurchasesDollars: number
  recentCatalogPurchasesAvgDollars: string
  recentApparelPurchasesDollars: number
  recentHomeGoodsLivingPurchasesDollars: number
}

export interface DataShopperIdentity {
  // Core identity
  id: number // DataShopper internal ID
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zip: string
  zip4: string
  latitude: number
  longitude: number
  gender: string
  birthDate: string
  validated: boolean

  // Geographic codes
  dpbc: string
  carrierRoute: string
  fipsStateCode: string
  fipsCountyCode: string
  countyName: string
  addressType: string
  cbsa: string
  censusTract: string
  censusBlockGroup: string
  censusBlock: string
  dma: number
  congressionalDistrict: string
  urbanicityCode: string

  // Contact flags
  hasEmail: boolean
  hasPhone: boolean

  // Nested arrays
  phones: DataShopperPhone[]
  emails: DataShopperEmail[]
  vehicles: DataShopperVehicle[]
  companies: DataShopperCompany[]

  // Extended data
  data: DataShopperDemographicData
  finances: DataShopperFinances
}

// V1 Batch response types
export interface BatchEnrichResponse {
  success: boolean
  data: {
    requestId: string
    returnData: Record<string, BatchEnrichResult[]>
  }
}

export interface BatchEnrichResult {
  Id: string
  Address: string
  City: string
  First_Name: string
  Last_Name: string
  State: string
  Zip: string
  NationalConsumerDatabase: string
  Email_Array: string[]
  Phone_Array: string[]
  Sequence: string
}

// ============================================================================
// PIXEL MANAGEMENT TYPES
// ============================================================================

export interface CreatePixelParams extends DataShopperAuthParams {
  name: string
  url: string
  filter?: 'include' | 'exclude'
  routes?: string[]
}

export interface PixelUtmFilters {
  campaign_source?: string
  campaign_medium?: string
  campaign_name?: string
  campaign_term?: string
  campaign_content?: string
}

export interface PixelZipCodeFilters {
  type: 'include' | 'exclude'
  zip_codes: string[]
}

export interface CreateBlacklistParams extends DataShopperAuthParams {
  name: string
  type: 'email' | 'address'
  list: string[]
}

// ============================================================================
// SIC CODE REFERENCE (common B2B industry codes)
// ============================================================================

export const SIC_CODES = {
  // Technology
  '7371': 'Computer Programming Services',
  '7372': 'Prepackaged Software',
  '7373': 'Computer Integrated Systems Design',
  '7374': 'Computer Processing Services',
  '7375': 'Information Retrieval Services',
  '7379': 'Computer Related Services',

  // Professional Services
  '8711': 'Engineering Services',
  '8712': 'Architectural Services',
  '8721': 'Accounting Services',
  '8731': 'Commercial Research Laboratories',
  '8732': 'Commercial Testing Laboratories',
  '8742': 'Management Consulting Services',
  '8743': 'Public Relations Services',
  '8748': 'Business Consulting Services',

  // Manufacturing
  '3559': 'Special Industry Machinery',
  '3561': 'Pumps and Pumping Equipment',
  '3571': 'Electronic Computers',
  '3572': 'Computer Storage Devices',
  '3575': 'Computer Terminals',
  '3577': 'Computer Peripheral Equipment',

  // Healthcare
  '8011': 'Offices of Physicians',
  '8021': 'Offices of Dentists',
  '8031': 'Offices of Osteopathic Physicians',
  '8041': 'Offices of Chiropractors',
  '8062': 'General Medical and Surgical Hospitals',

  // Construction
  '1521': 'General Contractors - Residential',
  '1522': 'General Contractors - Nonresidential',
  '1531': 'Operative Builders',
  '1541': 'General Contractors - Industrial',
  '1542': 'General Contractors - Nonresidential',

  // Retail
  '5311': 'Department Stores',
  '5411': 'Grocery Stores',
  '5541': 'Gasoline Service Stations',
  '5812': 'Eating Places',
  '5961': 'Catalog and Mail-Order Houses',
} as const

export type SicCode = keyof typeof SIC_CODES

// ============================================================================
// HELPER TYPES
// ============================================================================

export type PhoneType = 'unknown' | 'landline' | 'mobile'

export function getPhoneTypeLabel(phoneType: number): PhoneType {
  switch (phoneType) {
    case 1:
      return 'landline'
    case 3:
      return 'mobile'
    default:
      return 'unknown'
  }
}

export type ContactabilityGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K'

export function isHighlyContactable(grade: string): boolean {
  return ['A', 'B', 'C', 'D', 'E'].includes(grade.toUpperCase())
}

// Enrichment method used
export type EnrichmentMethod =
  | 'email'
  | 'phone'
  | 'ip'
  | 'pii'
  | 'md5'
  | 'device'
  | 'vehicle'
  | 'visitor' // From pixel
  | 'batch_email'
  | 'batch_phone'
  | 'batch_pii'
  | 'batch_id'
  | 'batch_md5'

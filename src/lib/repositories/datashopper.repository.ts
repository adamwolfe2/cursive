/**
 * DataShopper Repository
 *
 * Handles storing and retrieving DataShopper enrichment data in Supabase.
 * Transforms DataShopper API responses into our database schema.
 */

import { createClient } from '@/lib/supabase/server'
import type { DataShopperIdentity } from '@/types/datashopper.types'
import { DataShopperService } from '@/lib/services/datashopper.service'
import { DatabaseError } from '@/types'

export class DataShopperRepository {
  private workspaceId: string

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Store a DataShopper identity as a lead with all related data
   */
  async storeIdentity(
    identity: DataShopperIdentity,
    enrichmentMethod: string
  ): Promise<string> {
    const supabase = await createClient()

    // Start a transaction by doing all inserts
    // First, create or update the main lead record
    const leadData = this.transformToLead(identity, enrichmentMethod)

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(
        {
          ...leadData,
          workspace_id: this.workspaceId,
        },
        {
          onConflict: 'datashopper_id,workspace_id',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single()

    if (leadError) {
      throw new DatabaseError(`Failed to store lead: ${leadError.message}`)
    }

    const leadId = lead.id

    // Store emails
    if (identity.emails?.length) {
      await this.storeEmails(leadId, identity.emails)
    }

    // Store phones
    if (identity.phones?.length) {
      await this.storePhones(leadId, identity.phones)
    }

    // Store companies
    if (identity.companies?.length) {
      await this.storeCompanies(leadId, identity.companies)
    }

    // Store vehicles
    if (identity.vehicles?.length) {
      await this.storeVehicles(leadId, identity.vehicles)
    }

    // Store interests
    if (identity.data) {
      await this.storeInterests(leadId, identity.data)
    }

    return leadId
  }

  /**
   * Transform DataShopper identity to our lead schema
   */
  private transformToLead(identity: DataShopperIdentity, enrichmentMethod: string) {
    const primaryEmail = DataShopperService.getPrimaryEmail(identity)
    const primaryPhone = DataShopperService.getPrimaryPhone(identity)
    const primaryCompany = DataShopperService.getPrimaryCompany(identity)

    return {
      // DataShopper ID
      datashopper_id: identity.id,

      // Core identity
      first_name: identity.firstName,
      last_name: identity.lastName,
      full_name: `${identity.firstName} ${identity.lastName}`.trim(),
      address: identity.address,
      city: identity.city,
      state: identity.state,
      postal_code: identity.zip,
      zip4: identity.zip4,
      latitude: identity.latitude,
      longitude: identity.longitude,
      validated: identity.validated,
      has_email: identity.hasEmail,
      has_phone: identity.hasPhone,

      // Primary contact (for easy access)
      email: primaryEmail,
      phone: primaryPhone,

      // Company info from primary company association
      company_name: primaryCompany?.company || null,
      job_title: primaryCompany?.title || null,
      contact_title: primaryCompany?.title || null,
      company_industry: primaryCompany?.sicDescription || null,
      linkedin_url: primaryCompany?.linkedin || null,

      // Geographic codes
      fips_state_code: identity.fipsStateCode,
      fips_county_code: identity.fipsCountyCode,
      county_name: identity.countyName,
      address_type: identity.addressType,
      cbsa: identity.cbsa,
      census_tract: identity.censusTract,
      census_block_group: identity.censusBlockGroup,
      census_block: identity.censusBlock,
      dma: identity.dma,
      congressional_district: identity.congressionalDistrict,
      urbanicity_code: identity.urbanicityCode,
      dpbc: identity.dpbc,
      carrier_route: identity.carrierRoute,

      // Demographics
      gender: identity.gender || identity.data?.gender,
      birth_date: identity.birthDate,
      age: identity.data?.age,
      generation: identity.data?.generation,
      marital_status: identity.data?.maritalStatus,
      religion: identity.data?.religion,
      language: identity.data?.language,
      speaks_english: identity.data?.speaksEnglish,
      multilingual: identity.data?.multilingual,
      education: identity.data?.education,
      urbanicity: identity.data?.urbanicity,
      ethnicity_detail: identity.data?.ethnicityDetail,
      ethnic_group: identity.data?.ethnicGroup,

      // Household
      household_adults: identity.data?.householdAdults,
      household_persons: identity.data?.householdPersons,
      household_has_children: identity.data?.householdChild,
      household_child_age_0_3: identity.data?.householdChildAged0to3,
      household_child_age_4_6: identity.data?.householdChildAged4to6,
      household_child_age_7_9: identity.data?.householdChildAged7to9,
      household_child_age_10_12: identity.data?.householdChildAged10to12,
      household_child_age_13_18: identity.data?.householdChildAged13to18,
      household_veteran: identity.data?.householdVeteran,

      // Financial
      income_level: identity.data?.incomeLevel,
      household_income: identity.data?.householdIncome || identity.finances?.householdIncome,
      household_income_midpoint: identity.data?.householdIncomeMidpoint,
      median_income: identity.data?.medianIncome,
      credit_range: identity.data?.creditRange || identity.finances?.creditRange,
      credit_midpoint: identity.data?.creditMidpoint,
      household_net_worth: identity.data?.householdNetWorth,
      household_net_worth_midpoint: identity.data?.householdNetWorthMidpoint,
      has_credit_card: identity.data?.creditCard,
      has_bank_card: identity.data?.bankCard,
      has_premium_card: identity.data?.premiumCard,
      has_amex_card: identity.data?.amexCard,
      owns_investments: identity.data?.ownsInvestments,
      owns_stocks_bonds: identity.data?.ownsStocksAndBonds,
      owns_mutual_funds: identity.data?.ownsMutualFunds,
      is_investor: identity.data?.investor,
      discretionary_income: identity.finances?.discretionaryIncome,
      financial_power: identity.finances?.financialPower,

      // Property
      home_ownership: identity.data?.homeOwnership,
      home_value: identity.data?.homeValue,
      median_home_value: identity.data?.medianHomeValue,
      mortgage_amount: identity.data?.mortgageAmount,
      mortgage_refinance_amount: identity.data?.mortgageRefinanceAmount,
      mortgage_refinance_age: identity.data?.mortgageRefinanceAge,
      length_of_residence: identity.data?.lengthOfResidence,
      dwelling_type: identity.data?.dwellingType,
      single_family_dwelling: identity.data?.singleFamilyDwelling,
      home_purchased_years_ago: identity.data?.homePurchasedYearsAgo,
      owns_swimming_pool: identity.data?.ownsSwimmingPool,

      // Occupation
      occupation_detail: identity.data?.occupationDetail,
      occupation_type: identity.data?.occupationType,
      occupation_category: identity.data?.occupationCategory,
      is_white_collar: identity.data?.whiteCollar,
      is_blue_collar: identity.data?.blueCollar,

      // Vehicle summary
      household_vehicles: identity.data?.householdVehicles,
      vehicle_type_suv: identity.data?.vehicleTypeSuv,
      vehicle_type_sedan: identity.data?.vehicleTypeSedan,
      vehicle_class_luxury: identity.data?.vehicleClassLuxury,
      vehicle_year_earliest: identity.data?.vehicleYearEarliest,
      vehicle_year_latest: identity.data?.vehicleYearLatest,

      // DataShopper metadata
      datashopper_source_number: identity.data?.sourceNumber,
      datashopper_eagles_18_segment: identity.data?.eagles18Segment,
      datashopper_eagles_60_segment: identity.data?.eagles60Segment,
      datashopper_raw_data: identity,
      enriched_at: new Date().toISOString(),
      enrichment_method: enrichmentMethod,

      // Standard fields
      source: 'datashopper',
      enrichment_status: 'enriched',
      delivery_status: 'pending',
    }
  }

  /**
   * Store email addresses for a lead
   */
  private async storeEmails(leadId: string, emails: DataShopperIdentity['emails']) {
    const supabase = await createClient()

    const emailRecords = emails.map((e, index) => ({
      lead_id: leadId,
      workspace_id: this.workspaceId,
      email: e.email,
      md5_hash: e.md5,
      opt_in: e.optIn,
      quality_level: e.qualityLevel,
      rank_order: e.rankOrder,
      register_date: e.registerDate,
      update_date: e.updateDate,
      ip_address: e.ip,
      source_url: e.url,
      is_primary: e.rankOrder === 1 || index === 0,
    }))

    const { error } = await supabase
      .from('lead_emails')
      .upsert(emailRecords, {
        onConflict: 'lead_id,email',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Failed to store emails:', error)
    }
  }

  /**
   * Store phone numbers for a lead
   */
  private async storePhones(leadId: string, phones: DataShopperIdentity['phones']) {
    const supabase = await createClient()

    const phoneRecords = phones.map((p, index) => ({
      lead_id: leadId,
      workspace_id: this.workspaceId,
      phone: p.phone.toString(),
      phone_type: p.phoneType,
      phone_type_label: p.phoneType === 1 ? 'landline' : p.phoneType === 3 ? 'mobile' : 'unknown',
      is_work_phone: p.workPhone,
      dnc_status: p.dnc,
      carrier: p.carrier,
      contactability_score: p.contactabilityScore,
      activity_status: p.activityStatus,
      quality_level: p.qualityLevel,
      rank_order: p.rankOrder,
      added_date: p.addedDate,
      update_date: p.updateDate,
      last_seen_date: p.lastSeenDate,
      is_primary: p.rankOrder === 1 || index === 0,
    }))

    const { error } = await supabase
      .from('lead_phones')
      .upsert(phoneRecords, {
        onConflict: 'lead_id,phone',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Failed to store phones:', error)
    }
  }

  /**
   * Store company associations for a lead
   */
  private async storeCompanies(leadId: string, companies: DataShopperIdentity['companies']) {
    const supabase = await createClient()

    const companyRecords = companies.map((c, index) => ({
      lead_id: leadId,
      workspace_id: this.workspaceId,
      job_title: c.title,
      company_name: c.company,
      company_address: c.address,
      company_city: c.city,
      company_state: c.state,
      company_zip: c.zip,
      company_phone: c.phone?.toString(),
      company_email: c.email,
      linkedin_url: c.linkedin,
      sic_code: c.sic,
      sic_description: c.sicDescription,
      is_primary: index === 0,
    }))

    const { error } = await supabase
      .from('lead_companies')
      .upsert(companyRecords, {
        onConflict: 'lead_id,company_name,job_title',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Failed to store companies:', error)
    }
  }

  /**
   * Store vehicles for a lead
   */
  private async storeVehicles(leadId: string, vehicles: DataShopperIdentity['vehicles']) {
    const supabase = await createClient()

    const vehicleRecords = vehicles.map((v) => ({
      lead_id: leadId,
      workspace_id: this.workspaceId,
      vin: v.vin,
      make: v.make,
      model: v.model,
      manufacturer: v.manufacturer,
      manufacturer_origin: v.manufacturerBased,
      year: v.year,
      fuel_type: v.fuel,
      msrp: v.msrp,
      style: v.style,
      body_type: v.bodyType,
      vehicle_class: v.class,
      doors: v.doors,
      drive_type: v.driveType,
      vehicle_type: v.vehicleType,
      size: v.size,
      trim: v.trim,
      engine_cylinders: v.engineCylinders,
      transmission_type: v.transmissionType,
      transmission_gears: v.transmissionGears,
      gvw_range: v.gvwRange,
      rank_order: v.rankOrder,
    }))

    const { error } = await supabase
      .from('lead_vehicles')
      .upsert(vehicleRecords, {
        onConflict: 'lead_id,vin',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Failed to store vehicles:', error)
    }
  }

  /**
   * Store interests for a lead
   */
  private async storeInterests(leadId: string, data: DataShopperIdentity['data']) {
    const supabase = await createClient()

    const activeInterests = DataShopperService.getActiveInterests(data)
    const affinityFields = [
      'apparelAffinity',
      'cookingAffinity',
      'doItYourselfAffinity',
      'gardeningAffinity',
      'homeDecoratingAffinity',
      'travelAffinity',
      'travelUsAffinity',
      'tvMoviesAffinity',
    ] as const

    const interestRecords = [
      // Boolean interests
      ...activeInterests.map((key) => ({
        lead_id: leadId,
        workspace_id: this.workspaceId,
        interest_key: key,
        interest_value: true,
        affinity_score: null,
      })),
      // Affinity scores (1-5 scale)
      ...affinityFields
        .filter((key) => (data as any)[key] != null)
        .map((key) => ({
          lead_id: leadId,
          workspace_id: this.workspaceId,
          interest_key: key,
          interest_value: (data as any)[key] > 0,
          affinity_score: (data as any)[key],
        })),
    ]

    if (interestRecords.length > 0) {
      const { error } = await supabase
        .from('lead_interests')
        .upsert(interestRecords, {
          onConflict: 'lead_id,interest_key',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Failed to store interests:', error)
      }
    }
  }

  /**
   * Get a lead with all related DataShopper data
   */
  async getLeadWithDetails(leadId: string) {
    const supabase = await createClient()

    const [lead, emails, phones, companies, vehicles, interests] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('workspace_id', this.workspaceId)
        .single(),
      supabase
        .from('lead_emails')
        .select('*')
        .eq('lead_id', leadId)
        .order('rank_order', { ascending: true }),
      supabase
        .from('lead_phones')
        .select('*')
        .eq('lead_id', leadId)
        .order('rank_order', { ascending: true }),
      supabase
        .from('lead_companies')
        .select('*')
        .eq('lead_id', leadId)
        .order('is_primary', { ascending: false }),
      supabase.from('lead_vehicles').select('*').eq('lead_id', leadId),
      supabase.from('lead_interests').select('*').eq('lead_id', leadId),
    ])

    if (lead.error) {
      throw new DatabaseError(`Failed to get lead: ${lead.error.message}`)
    }

    return {
      ...lead.data,
      emails: emails.data || [],
      phones: phones.data || [],
      companies: companies.data || [],
      vehicles: vehicles.data || [],
      interests: interests.data || [],
    }
  }

  /**
   * Find leads by SIC code (industry)
   */
  async findByIndustry(sicCode: string, limit = 100) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_companies')
      .select('lead_id, leads(*)')
      .eq('workspace_id', this.workspaceId)
      .eq('sic_code', sicCode)
      .limit(limit)

    if (error) {
      throw new DatabaseError(`Failed to find leads by industry: ${error.message}`)
    }

    return data?.map((r) => r.leads) || []
  }

  /**
   * Find leads by job title
   */
  async findByJobTitle(title: string, limit = 100) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_companies')
      .select('lead_id, leads(*)')
      .eq('workspace_id', this.workspaceId)
      .ilike('job_title', `%${title}%`)
      .limit(limit)

    if (error) {
      throw new DatabaseError(`Failed to find leads by job title: ${error.message}`)
    }

    return data?.map((r) => r.leads) || []
  }
}

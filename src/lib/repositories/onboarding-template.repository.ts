// Onboarding Template Repository
// Database access layer for onboarding_templates

import { createAdminClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/types'
import type {
  OnboardingTemplate,
  OnboardingTemplateInsert,
  TemplateCategory,
} from '@/types/onboarding-templates'

export class OnboardingTemplateRepository {
  /**
   * Find all templates, ordered by is_default desc then name asc
   */
  async findAll(): Promise<OnboardingTemplate[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingTemplate[]
  }

  /**
   * Find templates by category
   */
  async findByCategory(category: TemplateCategory): Promise<OnboardingTemplate[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_templates')
      .select('*')
      .eq('category', category)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingTemplate[]
  }

  /**
   * Find a single template by ID
   */
  async findById(id: string): Promise<OnboardingTemplate | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingTemplate | null
  }

  /**
   * Create a new template
   */
  async create(input: OnboardingTemplateInsert): Promise<OnboardingTemplate> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_templates')
      .insert(input)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingTemplate
  }

  /**
   * Update an existing template
   */
  async update(
    id: string,
    updates: Partial<OnboardingTemplateInsert>
  ): Promise<OnboardingTemplate> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_templates')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    if (!data) {
      throw new DatabaseError(`Template not found: ${id}`)
    }

    return data as unknown as OnboardingTemplate
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('onboarding_templates')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Create a template from an existing client record (strips PII)
   */
  async createFromClient(
    clientId: string,
    name: string,
    description: string,
    category: TemplateCategory
  ): Promise<OnboardingTemplate> {
    const supabase = createAdminClient()

    // Fetch the client record
    const { data: client, error: fetchError } = await supabase
      .from('onboarding_clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle()

    if (fetchError || !client) {
      throw new DatabaseError(fetchError?.message || `Client not found: ${clientId}`)
    }

    // Extract ICP and config fields, strip PII
    const templateData = {
      packages_selected: client.packages_selected,
      target_industries: client.target_industries,
      sub_industries: client.sub_industries,
      target_company_sizes: client.target_company_sizes,
      target_titles: client.target_titles,
      target_geography: client.target_geography,
      specific_regions: client.specific_regions,
      must_have_traits: client.must_have_traits,
      exclusion_criteria: client.exclusion_criteria,
      pain_points: client.pain_points,
      intent_keywords: client.intent_keywords,
      competitor_names: client.competitor_names,
      copy_tone: client.copy_tone,
      primary_cta: client.primary_cta,
      data_use_cases: client.data_use_cases,
      primary_crm: client.primary_crm,
      data_format: client.data_format,
      audience_count: client.audience_count,
      sending_volume: client.sending_volume,
      lead_volume: client.lead_volume,
    }

    return this.create({
      name,
      description,
      category,
      is_default: false,
      template_data: templateData,
    })
  }
}

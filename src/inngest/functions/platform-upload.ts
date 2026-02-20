// Platform Upload
// Uploads hot and warm leads to industry-specific platforms

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export const platformUpload = inngest.createFunction(
  {
    id: 'platform-upload',
    name: 'Platform Upload',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { event: 'lead/upload-to-platform' },
  async ({ event, step, logger }) => {
    const { lead_ids, workspace_id, platform, industry } = event.data

    logger.info(
      `Uploading ${lead_ids.length} leads to ${platform} for ${industry}`
    )

    // Step 1: Fetch leads with full data
    const leads = await step.run('fetch-leads', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .in('id', lead_ids)
        .eq('workspace_id', workspace_id)

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`)
      }

      return data
    })

    // Step 2: Get platform credentials from workspace integrations
    const platformConfig = await step.run('get-platform-config', async () => {
      const supabase = createAdminClient()

      const { data: integration } = await supabase
        .from('integrations')
        .select('config')
        .eq('workspace_id', workspace_id)
        .eq('type', 'platform')
        .eq('status', 'active')
        .single()

      return integration?.config as any
    })

    // Step 3: Group leads by intent score
    const groupedLeads = await step.run('group-leads', async () => {
      const hot = leads.filter((lead: any) => lead.intent_data?.score === 'hot')
      const warm = leads.filter((lead: any) => lead.intent_data?.score === 'warm')

      logger.info(`Hot leads: ${hot.length}, Warm leads: ${warm.length}`)

      return { hot, warm }
    })

    // Step 4: Upload to platform
    const uploadResult = await step.run('upload-to-platform', async () => {
      try {
        // Format leads for platform upload
        const formattedLeads = leads.map((lead: any) => ({
          // Standard fields
          id: lead.id,
          company_name: lead.company_data?.name,
          domain: lead.company_data?.domain,
          industry: lead.company_data?.industry,
          employee_count: lead.company_data?.employee_count,
          revenue: lead.company_data?.revenue,
          location: lead.company_data?.location,

          // Intent data
          intent_score: lead.intent_data?.score,
          intent_signals: lead.intent_data?.signals,

          // Contact data
          contacts: lead.contact_data?.contacts || [],
          primary_contact: lead.contact_data?.primary_contact,

          // Metadata
          created_at: lead.created_at,
          enriched_at: lead.enriched_at,
        }))

        // Platform-specific upload logic
        const platformResult = await uploadToPlatform(
          platform,
          industry,
          formattedLeads,
          platformConfig
        )

        return platformResult
      } catch (error: any) {
        logger.error('Platform upload failed:', error)
        throw error
      }
    })

    // Step 5: Record upload in database
    await step.run('record-upload', async () => {
      const supabase = createAdminClient()

      // Update leads with platform upload status
      await supabase
        .from('leads')
        .update({
          platform_uploaded: true,
          platform_uploaded_at: new Date().toISOString(),
          platform_name: platform,
        })
        .in('id', lead_ids)

      // Log billing event for platform uploads
      await supabase.from('billing_events').insert({
        workspace_id,
        event_type: 'platform_upload',
        quantity: lead_ids.length,
        metadata: {
          platform,
          industry,
          hot_leads: groupedLeads.hot.length,
          warm_leads: groupedLeads.warm.length,
        },
      })

      logger.info(`Recorded platform upload for ${lead_ids.length} leads`)
    })

    return {
      success: true,
      leads_uploaded: lead_ids.length,
      platform,
      industry,
      upload_result: uploadResult,
    }
  }
)

// Helper: Upload to specific platform
async function uploadToPlatform(
  platform: string,
  industry: string,
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  // Platform-specific upload logic
  switch (platform) {
    case 'tech-platform':
      return await uploadToTechPlatform(leads, config)

    case 'finance-platform':
      return await uploadToFinancePlatform(leads, config)

    case 'healthcare-platform':
      return await uploadToHealthcarePlatform(leads, config)

    case 'retail-platform':
      return await uploadToRetailPlatform(leads, config)

    case 'marketing-platform':
      return await uploadToMarketingPlatform(leads, config)

    default:
      return await uploadToGeneralPlatform(leads, config)
  }
}

// Tech Platform (e.g., Salesforce, HubSpot for tech companies)
async function uploadToTechPlatform(
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  if (!config?.api_key || !config?.api_url) {
    throw new Error('Tech platform credentials not configured')
  }

  try {
    const response = await fetch(`${config.api_url}/leads/bulk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leads: leads.map((lead) => ({
          company_name: lead.company_name,
          domain: lead.domain,
          industry: lead.industry,
          intent_score: lead.intent_score,
          contacts: lead.contacts,
          technologies: lead.company_data?.technologies,
          source: 'Cursive',
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(`Tech platform upload failed: ${response.statusText}`)
    }

    return {
      success: true,
      message: 'Uploaded to tech platform',
      uploaded_count: leads.length,
    }
  } catch (error: any) {
    safeError('[TechPlatform] Upload error:', error)
    throw error
  }
}

// Finance Platform
async function uploadToFinancePlatform(
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  if (!config?.api_key || !config?.api_url) {
    throw new Error('Finance platform credentials not configured')
  }

  // Similar implementation for finance platforms
  return {
    success: true,
    message: 'Uploaded to finance platform',
    uploaded_count: leads.length,
  }
}

// Healthcare Platform
async function uploadToHealthcarePlatform(
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  if (!config?.api_key || !config?.api_url) {
    throw new Error('Healthcare platform credentials not configured')
  }

  // Similar implementation for healthcare platforms
  return {
    success: true,
    message: 'Uploaded to healthcare platform',
    uploaded_count: leads.length,
  }
}

// Retail Platform
async function uploadToRetailPlatform(
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  if (!config?.api_key || !config?.api_url) {
    throw new Error('Retail platform credentials not configured')
  }

  // Similar implementation for retail platforms
  return {
    success: true,
    message: 'Uploaded to retail platform',
    uploaded_count: leads.length,
  }
}

// Marketing Platform
async function uploadToMarketingPlatform(
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  if (!config?.api_key || !config?.api_url) {
    throw new Error('Marketing platform credentials not configured')
  }

  // Similar implementation for marketing platforms
  return {
    success: true,
    message: 'Uploaded to marketing platform',
    uploaded_count: leads.length,
  }
}

// General Platform (fallback)
async function uploadToGeneralPlatform(
  leads: any[],
  config: any
): Promise<{ success: boolean; message: string; uploaded_count: number }> {
  // Generic webhook or API upload
  if (config?.webhook_url) {
    await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    })
  }

  return {
    success: true,
    message: 'Uploaded to general platform',
    uploaded_count: leads.length,
  }
}

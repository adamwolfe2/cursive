// Inngest Client Setup

import { Inngest } from 'inngest'

// Define event types for type safety
export type Events = {
  // Lead Generation & Management
  'lead/generate': {
    data: {
      query_id: string
      workspace_id: string
    }
  }
  'lead/created': {
    data: {
      lead_id: string
      workspace_id: string
      source?: string
    }
  }
  'lead/enrich': {
    data: {
      lead_id: string
      workspace_id: string
    }
  }
  'lead/deliver': {
    data: {
      lead_id: string
      workspace_id: string
      delivery_channels: ('email' | 'slack' | 'webhook')[]
    }
  }
  'lead/upload-to-platform': {
    data: {
      lead_ids: string[]
      workspace_id: string
      platform: string
      industry: string
    }
  }

  // Enrichment Pipeline
  'enrichment/process': {
    data: {
      job_id: string
      lead_id: string
      workspace_id: string
      provider: string
      priority: string
    }
  }
  'enrichment/batch': {
    data: {
      workspace_id: string
      lead_ids: string[]
      providers: string[]
      priority: string
    }
  }

  // Email Sequences
  'sequence/enroll': {
    data: {
      lead_id: string
      sequence_id: string
      workspace_id: string
    }
  }
  'sequence/process-step': {
    data: {
      enrollment_id: string
      sequence_id: string
      lead_id: string
      workspace_id: string
      step_number: number
    }
  }
  'sequence/batch-enroll': {
    data: {
      sequence_id: string
      lead_ids: string[]
      workspace_id: string
    }
  }

  // Email Sending
  'email/send': {
    data: {
      workspace_id: string
      lead_id?: string
      to: string
      to_name?: string
      subject: string
      body_html?: string
      body_text?: string
      account_id?: string
    }
  }
  'email/bulk-send': {
    data: {
      workspace_id: string
      emails: Array<{
        lead_id?: string
        to: string
        subject: string
        body_html?: string
        body_text?: string
      }>
      account_id?: string
    }
  }

  // SMS
  'sms/send': {
    data: {
      workspace_id: string
      lead_id?: string
      to: string
      body: string
      account_id?: string
    }
  }

  // Voice Outreach
  'voice/call': {
    data: {
      workspace_id: string
      lead_id?: string
      campaign_id?: string
      to_phone: string
      script?: string
      type: 'ai_voice' | 'ringless_voicemail'
    }
  }
  'voice/campaign-start': {
    data: {
      campaign_id: string
      lead_ids: string[]
      workspace_id: string
    }
  }

  // Workflows
  'workflow/trigger': {
    data: {
      workflow_id: string
      lead_id: string
      workspace_id: string
      trigger_type: string
    }
  }
  'workflow/process-step': {
    data: {
      execution_id: string
      workflow_id: string
      lead_id: string
      workspace_id: string
      step_number: number
    }
  }

  // Integrations
  'ghl/sync-contact': {
    data: {
      workspace_id: string
      lead_id: string
    }
  }
  'ghl/bulk-sync': {
    data: {
      workspace_id: string
      lead_ids: string[]
      create_opportunities?: boolean
      pipeline_id?: string
      stage_id?: string
    }
  }

  // System Events
  'credits/reset': {
    data: {
      workspace_id?: string
    }
  }
  'trends/update': {
    data: {
      force?: boolean
    }
  }
  'workspace/scrape-website': {
    data: {
      workspaceId: string
      websiteUrl: string
    }
  }
  'workspace/reset-send-count': {
    data: {
      workspace_id: string
    }
  }
  'job/retry-requested': {
    data: {
      job_id: string
      workspace_id?: string
    }
  }
  'webhook/deliver': {
    data: {
      url: string
      data: Record<string, any>
      workspace_id: string
    }
  }

  // Campaign Events
  'campaign/lead-added': {
    data: {
      campaign_lead_id: string
      campaign_id: string
      lead_id: string
      workspace_id: string
    }
  }
  'campaign/batch-enrich': {
    data: {
      campaign_id: string
      workspace_id: string
    }
  }
  'campaign/compose-email': {
    data: {
      campaign_lead_id: string
      campaign_id: string
      lead_id: string
      workspace_id: string
    }
  }
  'campaign/batch-compose': {
    data: {
      campaign_id: string
      workspace_id: string
    }
  }
  'campaign/send-email': {
    data: {
      email_send_id: string
      campaign_lead_id: string
      workspace_id: string
    }
  }
  'campaign/email-approved': {
    data: {
      email_send_id: string
      campaign_lead_id: string
      workspace_id: string
    }
  }
  'campaign/batch-send': {
    data: {
      campaign_id: string
      workspace_id: string
      limit?: number
    }
  }
  'campaign/status-changed': {
    data: {
      campaign_id: string
      workspace_id: string
      old_status: string
      new_status: string
      triggered_by?: string
    }
  }
  'campaign/email-composed': {
    data: {
      email_send_id: string
      campaign_lead_id: string
      campaign_id: string
      workspace_id: string
      sequence_step: number
      auto_send: boolean
    }
  }
  'campaign/email-sent': {
    data: {
      email_send_id: string
      campaign_lead_id: string
      campaign_id: string
      workspace_id: string
      sequence_step: number
    }
  }
  'campaign/schedule-changed': {
    data: {
      campaign_id: string
      workspace_id: string
      changed_fields?: string[]
    }
  }
  'lead/enrichment-complete': {
    data: {
      lead_id: string
      workspace_id: string
      enrichment_data: {
        company_location?: {
          country?: string
          state?: string
          city?: string
        }
        company_domain?: string
      }
    }
  }

  // Lead Routing Events
  'lead/routing.retry.trigger': {
    data: {
      limit?: number
    }
  }
  'lead/routing.health-check': {
    data: {
      workspaceId: string
    }
  }

  // EmailBison webhook events
  'emailbison/email-sent': {
    data: {
      message_id: string
      lead_email: string
      sent_at: string
    }
  }
  'emailbison/reply-received': {
    data: {
      reply_id: string
      lead_email: string
      from_email: string
      subject: string
      body: string
      received_at: string
    }
  }
  'emailbison/bounce-received': {
    data: {
      lead_email: string
      bounce_type: 'hard' | 'soft'
      bounce_reason: string
      bounced_at: string
    }
  }

  // Purchase Email Events
  'purchase/email.send': {
    data: {
      purchaseId: string
      userEmail: string
      userName: string
      downloadUrl: string
      totalLeads: number
      totalPrice: number
      expiresAt: string
    }
  }
  'purchase/credit-email.send': {
    data: {
      creditPurchaseId: string
      userEmail: string
      userName: string
      creditsAmount: number
      totalPrice: number
      packageName: string
      newBalance: number
    }
  }

  // Stripe Webhook Events
  'stripe/webhook.received': {
    data: {
      eventType: string
      eventId: string
      sessionId?: string
      metadata?: Record<string, any>
      amountTotal?: number
    }
  }

  // Marketplace Upsell Events
  'marketplace/credit-purchased': {
    data: {
      workspace_id: string
      user_id: string
      credits: number
      amount: number
      lifetime_spend: number
    }
  }
  'marketplace/upsell-check': {
    data: {
      workspace_id: string
      user_id: string
      lifetime_spend: number
    }
  }

  // Marketplace Onboarding Events
  'marketplace/first-purchase': {
    data: {
      workspace_id: string
      user_id: string
      user_email: string
      user_name: string
      credits: number
    }
  }

  // Custom Audience Events
  'marketplace/custom-audience-requested': {
    data: {
      request_id: string
      workspace_id: string
      user_id: string
      user_email: string
      industry: string
      volume: string
    }
  }
}

// Lazy-load Inngest client to avoid build-time initialization
let inngestInstance: Inngest<Events> | null = null

export function getInngest(): Inngest<Events> {
  if (!inngestInstance) {
    inngestInstance = new Inngest({
      id: 'cursive-platform',
      name: 'Cursive Platform',
      eventKey: process.env.INNGEST_EVENT_KEY,
    })
  }
  return inngestInstance
}

// Export the inngest instance with lazy initialization
export const inngest = new Proxy({} as Inngest<Events>, {
  get(_target, prop) {
    return (getInngest() as any)[prop]
  }
})

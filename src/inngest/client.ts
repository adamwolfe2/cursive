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
}

// Create Inngest client
export const inngest = new Inngest({
  id: 'cursive-platform',
  name: 'Cursive Platform',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

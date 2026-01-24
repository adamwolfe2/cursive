// Inngest Client Setup

import { Inngest } from 'inngest'

// Define event types for type safety
export type Events = {
  'lead/generate': {
    data: {
      query_id: string
      workspace_id: string
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
}

// Create Inngest client
export const inngest = new Inngest({
  id: 'cursive-platform',
  name: 'Cursive Platform',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

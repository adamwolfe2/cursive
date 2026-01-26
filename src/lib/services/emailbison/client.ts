// EmailBison API Client
// Service for interacting with EmailBison's API

export interface EmailBisonConfig {
  apiKey: string
  baseUrl?: string
}

export interface EmailBisonLead {
  id: number
  email: string
  first_name?: string
  last_name?: string
  company_name?: string
  custom_variables?: Record<string, string>
  tags?: string[]
  created_at: string
}

export interface EmailBisonCampaign {
  id: number
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
}

export interface EmailBisonReply {
  id: number
  lead_id: number
  campaign_id: number
  from_email: string
  from_name?: string
  subject: string
  body: string
  received_at: string
  is_interested?: boolean
}

export interface EmailBisonSendOptions {
  campaign_id: number
  to_email: string
  subject?: string
  body: string
  reply_to_message_id?: number
}

export class EmailBisonClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: EmailBisonConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.emailbison.com'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `EmailBison API error: ${response.status} ${response.statusText} - ${errorBody}`
      )
    }

    return response.json()
  }

  // ============================================================================
  // LEADS
  // ============================================================================

  async getLeads(params?: {
    campaign_id?: number
    page?: number
    limit?: number
  }): Promise<EmailBisonLead[]> {
    const searchParams = new URLSearchParams()
    if (params?.campaign_id) searchParams.set('campaign_id', String(params.campaign_id))
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<EmailBisonLead[]>(`/api/leads${query ? `?${query}` : ''}`)
  }

  async createLead(lead: Omit<EmailBisonLead, 'id' | 'created_at'>): Promise<EmailBisonLead> {
    return this.request<EmailBisonLead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    })
  }

  async updateLead(id: number, lead: Partial<EmailBisonLead>): Promise<EmailBisonLead> {
    return this.request<EmailBisonLead>(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lead),
    })
  }

  async attachTagsToLeads(leadIds: number[], tagIds: number[]): Promise<void> {
    await this.request('/api/tags/attach-to-leads', {
      method: 'POST',
      body: JSON.stringify({ lead_ids: leadIds, tag_ids: tagIds }),
    })
  }

  // ============================================================================
  // CAMPAIGNS
  // ============================================================================

  async getCampaigns(): Promise<EmailBisonCampaign[]> {
    return this.request<EmailBisonCampaign[]>('/api/campaigns')
  }

  async getCampaign(id: number): Promise<EmailBisonCampaign> {
    return this.request<EmailBisonCampaign>(`/api/campaigns/${id}`)
  }

  async pauseCampaign(id: number): Promise<void> {
    await this.request(`/api/campaigns/${id}/pause`, {
      method: 'POST',
    })
  }

  // ============================================================================
  // REPLIES
  // ============================================================================

  async getReplies(params?: {
    campaign_id?: number
    page?: number
    limit?: number
  }): Promise<EmailBisonReply[]> {
    const searchParams = new URLSearchParams()
    if (params?.campaign_id) searchParams.set('campaign_id', String(params.campaign_id))
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return this.request<EmailBisonReply[]>(`/api/replies${query ? `?${query}` : ''}`)
  }

  async markAsInterested(replyId: number): Promise<void> {
    await this.request(`/api/replies/${replyId}/mark-as-interested`, {
      method: 'PATCH',
    })
  }

  async pushToFollowupCampaign(replyId: number, campaignId: number): Promise<void> {
    await this.request(`/api/replies/${replyId}/followup-campaign/push`, {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId }),
    })
  }

  // ============================================================================
  // SENDING
  // ============================================================================

  async sendReply(options: EmailBisonSendOptions): Promise<{ success: boolean; message_id?: number }> {
    return this.request('/api/emails/reply', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: options.campaign_id,
        to_email: options.to_email,
        subject: options.subject,
        body: options.body,
        reply_to_message_id: options.reply_to_message_id,
      }),
    })
  }

  // ============================================================================
  // EMAIL ACCOUNTS
  // ============================================================================

  async getSenderEmails(): Promise<Array<{
    id: number
    email: string
    name: string
    is_active: boolean
  }>> {
    return this.request('/api/sender-emails')
  }
}

// Factory function to create client from agent's API key
export function createEmailBisonClient(apiKey: string): EmailBisonClient {
  return new EmailBisonClient({ apiKey })
}

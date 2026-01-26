// Twilio Service
// SMS and Voice call integration

import Twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export interface SendSMSParams {
  workspaceId: string
  leadId?: string
  userId: string
  to: string
  body: string
}

export interface MakeCallParams {
  workspaceId: string
  leadId?: string
  userId: string
  to: string
  from?: string
}

export class TwilioService {
  private fromNumber: string

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || ''
  }

  /**
   * Send an SMS message
   */
  async sendSMS(params: SendSMSParams): Promise<{ success: boolean; sid?: string; error?: string }> {
    if (!twilioClient) {
      console.error('[TwilioService] Twilio not configured')
      return { success: false, error: 'Twilio not configured' }
    }

    const supabase = await createClient()

    try {
      // Send SMS via Twilio
      const message = await twilioClient.messages.create({
        body: params.body,
        from: this.fromNumber,
        to: params.to,
      })

      // Log the communication
      await supabase.from('communication_logs').insert({
        workspace_id: params.workspaceId,
        lead_id: params.leadId,
        user_id: params.userId,
        communication_type: 'sms',
        direction: 'outbound',
        status: 'sent',
        from_number: this.fromNumber,
        to_number: params.to,
        message_body: params.body,
        twilio_sid: message.sid,
        twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
        sent_at: new Date().toISOString(),
      })

      // Log activity on lead
      if (params.leadId) {
        await supabase.from('lead_activities').insert({
          lead_id: params.leadId,
          workspace_id: params.workspaceId,
          activity_type: 'email_sent', // Using existing type, could add 'sms_sent'
          title: 'SMS sent',
          description: params.body.substring(0, 100),
          performed_by: params.userId,
          metadata: { type: 'sms', to: params.to, sid: message.sid },
        })
      }

      return { success: true, sid: message.sid }
    } catch (error: any) {
      console.error('[TwilioService] Send SMS error:', error)

      // Log failed attempt
      await supabase.from('communication_logs').insert({
        workspace_id: params.workspaceId,
        lead_id: params.leadId,
        user_id: params.userId,
        communication_type: 'sms',
        direction: 'outbound',
        status: 'failed',
        from_number: this.fromNumber,
        to_number: params.to,
        message_body: params.body,
        error_code: error.code?.toString(),
        error_message: error.message,
      })

      return { success: false, error: error.message }
    }
  }

  /**
   * Initiate an outbound call
   */
  async makeCall(params: MakeCallParams): Promise<{ success: boolean; sid?: string; error?: string }> {
    if (!twilioClient) {
      return { success: false, error: 'Twilio not configured' }
    }

    const supabase = await createClient()
    const fromNumber = params.from || this.fromNumber

    try {
      // Create TwiML for the call
      const call = await twilioClient.calls.create({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice`,
        from: fromNumber,
        to: params.to,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      })

      // Log the communication
      await supabase.from('communication_logs').insert({
        workspace_id: params.workspaceId,
        lead_id: params.leadId,
        user_id: params.userId,
        communication_type: 'call',
        direction: 'outbound',
        status: 'queued',
        from_number: fromNumber,
        to_number: params.to,
        twilio_sid: call.sid,
        twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
      })

      return { success: true, sid: call.sid }
    } catch (error: any) {
      console.error('[TwilioService] Make call error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Lookup phone number information
   */
  async lookupPhoneNumber(phoneNumber: string): Promise<{
    valid: boolean
    type?: string
    carrier?: string
    country?: string
    error?: string
  }> {
    if (!twilioClient) {
      return { valid: false, error: 'Twilio not configured' }
    }

    try {
      const lookup = await twilioClient.lookups.v2.phoneNumbers(phoneNumber).fetch({
        fields: 'line_type_intelligence,caller_name',
      })

      return {
        valid: lookup.valid || false,
        type: lookup.lineTypeIntelligence?.type,
        carrier: lookup.lineTypeIntelligence?.carrier_name,
        country: lookup.countryCode,
      }
    } catch (error: any) {
      console.error('[TwilioService] Lookup error:', error)
      return { valid: false, error: error.message }
    }
  }

  /**
   * Get SMS templates for a workspace
   */
  async getTemplates(workspaceId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')

    if (error) throw new Error(`Failed to fetch templates: ${error.message}`)
    return data || []
  }

  /**
   * Apply merge fields to template
   */
  applyMergeFields(template: string, lead: Record<string, any>): string {
    let result = template

    // Standard merge fields
    const mergeFields: Record<string, string | undefined> = {
      '{{first_name}}': lead.first_name,
      '{{last_name}}': lead.last_name,
      '{{full_name}}': lead.full_name,
      '{{company_name}}': lead.company_name,
      '{{email}}': lead.email,
      '{{phone}}': lead.phone,
      '{{job_title}}': lead.job_title,
    }

    for (const [field, value] of Object.entries(mergeFields)) {
      result = result.replace(new RegExp(field, 'g'), value || '')
    }

    return result
  }
}

export const twilioService = new TwilioService()

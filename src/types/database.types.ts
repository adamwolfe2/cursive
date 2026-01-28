export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          industry_vertical: string | null
          subdomain: string
          custom_domain: string | null
          branding: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          industry_vertical?: string | null
          subdomain: string
          custom_domain?: string | null
          branding?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          industry_vertical?: string | null
          subdomain?: string
          custom_domain?: string | null
          branding?: Json | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          auth_user_id: string
          workspace_id: string
          email: string
          full_name: string | null
          role: string
          plan: string
          daily_credit_limit: number
          daily_credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          workspace_id: string
          email: string
          full_name?: string | null
          role?: string
          plan?: string
          daily_credit_limit?: number
          daily_credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          workspace_id?: string
          email?: string
          full_name?: string | null
          role?: string
          plan?: string
          daily_credit_limit?: number
          daily_credits_used?: number
          created_at?: string
        }
      }
      queries: {
        Row: {
          id: string
          workspace_id: string
          name: string | null
          topic_id: string | null
          filters: Json | null
          status: string
          total_leads_generated: number
          leads_this_week: number
          last_run_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name?: string | null
          topic_id?: string | null
          filters?: Json | null
          status?: string
          total_leads_generated?: number
          leads_this_week?: number
          last_run_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string | null
          topic_id?: string | null
          filters?: Json | null
          status?: string
          total_leads_generated?: number
          leads_this_week?: number
          last_run_at?: string | null
          created_at?: string
        }
      }
      global_topics: {
        Row: {
          id: string
          topic: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          topic: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          topic?: string
          category?: string
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          workspace_id: string
          query_id: string | null
          company_name: string
          company_industry: string | null
          company_location: Json | null
          email: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          job_title: string | null
          phone: string | null
          linkedin_url: string | null
          company_domain: string | null
          source: string
          enrichment_status: string
          delivery_status: string
          routing_rule_id: string | null
          routing_metadata: Json | null
          created_at: string
          // New fields for DataShopper integration
          contact_title: string | null
          contact_seniority: string | null
          contact_department: string | null
          company_size: string | null
          company_revenue: string | null
          company_website: string | null
          company_employee_count: number | null
          company_founded_year: number | null
          company_description: string | null
          city: string | null
          state: string | null
          state_code: string | null
          country: string | null
          country_code: string | null
          postal_code: string | null
          address: string | null
          datashopper_id: number | null
          intent_topic: string | null
          intent_topic_id: string | null
          intent_score: string | null
          intent_signals: Json
          datashopper_person_id: string | null
          datashopper_company_id: string | null
          datashopper_record_type: string | null
          datashopper_raw_data: Json
          status: string
          secondary_email: string | null
          mobile_phone: string | null
          work_phone: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          query_id?: string | null
          company_name: string
          company_industry?: string | null
          company_location?: Json | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          job_title?: string | null
          phone?: string | null
          linkedin_url?: string | null
          company_domain?: string | null
          source: string
          enrichment_status: string
          delivery_status: string
          routing_rule_id?: string | null
          routing_metadata?: Json | null
          created_at?: string
          // New fields for DataShopper integration
          contact_title?: string | null
          contact_seniority?: string | null
          contact_department?: string | null
          company_size?: string | null
          company_revenue?: string | null
          company_website?: string | null
          company_employee_count?: number | null
          company_founded_year?: number | null
          company_description?: string | null
          city?: string | null
          state?: string | null
          state_code?: string | null
          country?: string | null
          country_code?: string | null
          postal_code?: string | null
          address?: string | null
          datashopper_id?: number | null
          intent_topic?: string | null
          intent_topic_id?: string | null
          intent_score?: string | null
          intent_signals?: Json
          datashopper_person_id?: string | null
          datashopper_company_id?: string | null
          datashopper_record_type?: string | null
          datashopper_raw_data?: Json
          status?: string
          secondary_email?: string | null
          mobile_phone?: string | null
          work_phone?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          query_id?: string | null
          company_name?: string
          company_industry?: string | null
          company_location?: Json | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          job_title?: string | null
          phone?: string | null
          linkedin_url?: string | null
          company_domain?: string | null
          source?: string
          enrichment_status?: string
          delivery_status?: string
          routing_rule_id?: string | null
          routing_metadata?: Json | null
          created_at?: string
          // New fields for DataShopper integration
          contact_title?: string | null
          contact_seniority?: string | null
          contact_department?: string | null
          company_size?: string | null
          company_revenue?: string | null
          company_website?: string | null
          company_employee_count?: number | null
          company_founded_year?: number | null
          company_description?: string | null
          city?: string | null
          state?: string | null
          state_code?: string | null
          country?: string | null
          country_code?: string | null
          postal_code?: string | null
          address?: string | null
          datashopper_id?: number | null
          intent_topic?: string | null
          intent_topic_id?: string | null
          intent_score?: string | null
          intent_signals?: Json
          datashopper_person_id?: string | null
          datashopper_company_id?: string | null
          datashopper_record_type?: string | null
          datashopper_raw_data?: Json
          status?: string
          secondary_email?: string | null
          mobile_phone?: string | null
          work_phone?: string | null
        }
      }
      lead_routing_rules: {
        Row: {
          id: string
          workspace_id: string
          rule_name: string
          priority: number
          is_active: boolean
          destination_workspace_id: string
          conditions: Json
          actions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          rule_name: string
          priority: number
          is_active?: boolean
          destination_workspace_id: string
          conditions: Json
          actions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          rule_name?: string
          priority?: number
          is_active?: boolean
          destination_workspace_id?: string
          conditions?: Json
          actions?: Json | null
          created_at?: string
        }
      }
      buyers: {
        Row: {
          id: string
          workspace_id: string
          email: string
          company_name: string
          service_states: string[]
          industry_vertical: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          company_name: string
          service_states?: string[]
          industry_vertical?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          company_name?: string
          service_states?: string[]
          industry_vertical?: string | null
          created_at?: string
        }
      }
      lead_purchases: {
        Row: {
          id: string
          lead_id: string
          buyer_id: string
          price_paid: number
          purchased_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          buyer_id: string
          price_paid: number
          purchased_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          buyer_id?: string
          price_paid?: number
          purchased_at?: string
        }
      }
      bulk_upload_jobs: {
        Row: {
          id: string
          workspace_id: string
          source: string
          total_records: number
          successful_records: number
          failed_records: number
          status: string
          routing_summary: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          source: string
          total_records: number
          successful_records?: number
          failed_records?: number
          status: string
          routing_summary?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          source?: string
          total_records?: number
          successful_records?: number
          failed_records?: number
          status?: string
          routing_summary?: Json | null
          created_at?: string
        }
      }
      lead_status_history: {
        Row: {
          id: string
          lead_id: string
          workspace_id: string
          from_status: LeadStatus | null
          to_status: LeadStatus
          changed_by: string
          change_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          workspace_id: string
          from_status?: LeadStatus | null
          to_status: LeadStatus
          changed_by: string
          change_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          workspace_id?: string
          from_status?: LeadStatus | null
          to_status?: LeadStatus
          changed_by?: string
          change_note?: string | null
          created_at?: string
        }
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          workspace_id: string
          content: string
          note_type: NoteType
          created_by: string
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          workspace_id: string
          content: string
          note_type?: NoteType
          created_by: string
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          workspace_id?: string
          content?: string
          note_type?: NoteType
          created_by?: string
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          workspace_id: string
          activity_type: ActivityType
          title: string
          description: string | null
          metadata: Json
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          workspace_id: string
          activity_type: ActivityType
          title: string
          description?: string | null
          metadata?: Json
          performed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          workspace_id?: string
          activity_type?: ActivityType
          title?: string
          description?: string | null
          metadata?: Json
          performed_by?: string | null
          created_at?: string
        }
      }
      // AI Email Agent Tables
      agents: {
        Row: {
          id: string
          workspace_id: string
          name: string
          ai_provider: string
          ai_model: string
          tone: string
          emailbison_api_key: string | null
          anthropic_api_key: string | null
          openai_api_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          ai_provider?: string
          ai_model?: string
          tone?: string
          emailbison_api_key?: string | null
          anthropic_api_key?: string | null
          openai_api_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          ai_provider?: string
          ai_model?: string
          tone?: string
          emailbison_api_key?: string | null
          anthropic_api_key?: string | null
          openai_api_key?: string | null
          created_at?: string
        }
      }
      email_instructions: {
        Row: {
          id: string
          agent_id: string
          content: string
          order_index: number
          enabled: boolean
        }
        Insert: {
          id?: string
          agent_id: string
          content: string
          order_index: number
          enabled?: boolean
        }
        Update: {
          id?: string
          agent_id?: string
          content?: string
          order_index?: number
          enabled?: boolean
        }
      }
      kb_entries: {
        Row: {
          id: string
          agent_id: string
          title: string
          content: string
          tags: string[] | null
          is_golden: boolean
        }
        Insert: {
          id?: string
          agent_id: string
          title: string
          content: string
          tags?: string[] | null
          is_golden?: boolean
        }
        Update: {
          id?: string
          agent_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          is_golden?: boolean
        }
      }
      email_threads: {
        Row: {
          id: string
          agent_id: string
          lead_id: string | null
          campaign_id: string | null
          sender_email: string
          sender_name: string | null
          subject: string | null
          intent_score: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          lead_id?: string | null
          campaign_id?: string | null
          sender_email: string
          sender_name?: string | null
          subject?: string | null
          intent_score?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          lead_id?: string | null
          campaign_id?: string | null
          sender_email?: string
          sender_name?: string | null
          subject?: string | null
          intent_score?: number
          status?: string
          created_at?: string
        }
      }
      email_messages: {
        Row: {
          id: string
          thread_id: string
          direction: string
          content: string
          generated_by: string | null
          confidence: number | null
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          direction: string
          content: string
          generated_by?: string | null
          confidence?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          direction?: string
          content?: string
          generated_by?: string | null
          confidence?: number | null
          created_at?: string
        }
      }
      email_tasks: {
        Row: {
          id: string
          thread_id: string
          agent_id: string
          status: string
          confidence: number | null
          generated_reply: string
          scheduled_for: string | null
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          agent_id: string
          status?: string
          confidence?: number | null
          generated_reply: string
          scheduled_for?: string | null
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          agent_id?: string
          status?: string
          confidence?: number | null
          generated_reply?: string
          scheduled_for?: string | null
          executed_at?: string | null
          created_at?: string
        }
      }
      // Email Campaign Tables (Sales.co integration)
      email_templates: {
        Row: {
          id: string
          workspace_id: string
          name: string
          subject: string
          body_html: string
          body_text: string | null
          variables: Json
          tone: string | null
          structure: string | null
          cta_type: string | null
          target_seniority: string[] | null
          company_types: string[] | null
          emails_sent: number
          total_replies: number
          positive_replies: number
          reply_rate: number
          positive_reply_rate: number
          source: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          subject: string
          body_html: string
          body_text?: string | null
          variables?: Json
          tone?: string | null
          structure?: string | null
          cta_type?: string | null
          target_seniority?: string[] | null
          company_types?: string[] | null
          emails_sent?: number
          total_replies?: number
          positive_replies?: number
          reply_rate?: number
          positive_reply_rate?: number
          source?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          subject?: string
          body_html?: string
          body_text?: string | null
          variables?: Json
          tone?: string | null
          structure?: string | null
          cta_type?: string | null
          target_seniority?: string[] | null
          company_types?: string[] | null
          emails_sent?: number
          total_replies?: number
          positive_replies?: number
          reply_rate?: number
          positive_reply_rate?: number
          source?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          workspace_id: string
          agent_id: string | null
          name: string
          description: string | null
          status: string
          subject_template: string | null
          body_template: string | null
          target_audience: Json | null
          schedule_config: Json | null
          target_industries: string[] | null
          target_company_sizes: string[] | null
          target_seniorities: string[] | null
          target_regions: string[] | null
          value_propositions: Json
          trust_signals: Json
          selected_template_ids: string[] | null
          matching_mode: string
          sequence_steps: number
          days_between_steps: number[] | null
          scheduled_start_at: string | null
          submitted_for_review_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          client_approved_at: string | null
          total_sent: number
          total_opened: number
          total_clicked: number
          total_replied: number
          positive_replies: number
          meetings_booked: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          agent_id?: string | null
          name: string
          description?: string | null
          status?: string
          subject_template?: string | null
          body_template?: string | null
          target_audience?: Json | null
          schedule_config?: Json | null
          target_industries?: string[] | null
          target_company_sizes?: string[] | null
          target_seniorities?: string[] | null
          target_regions?: string[] | null
          value_propositions?: Json
          trust_signals?: Json
          selected_template_ids?: string[] | null
          matching_mode?: string
          sequence_steps?: number
          days_between_steps?: number[] | null
          scheduled_start_at?: string | null
          submitted_for_review_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          client_approved_at?: string | null
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_replied?: number
          positive_replies?: number
          meetings_booked?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          agent_id?: string | null
          name?: string
          description?: string | null
          status?: string
          subject_template?: string | null
          body_template?: string | null
          target_audience?: Json | null
          schedule_config?: Json | null
          target_industries?: string[] | null
          target_company_sizes?: string[] | null
          target_seniorities?: string[] | null
          target_regions?: string[] | null
          value_propositions?: Json
          trust_signals?: Json
          selected_template_ids?: string[] | null
          matching_mode?: string
          sequence_steps?: number
          days_between_steps?: number[] | null
          scheduled_start_at?: string | null
          submitted_for_review_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          client_approved_at?: string | null
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_replied?: number
          positive_replies?: number
          meetings_booked?: number
          created_at?: string
          updated_at?: string
        }
      }
      email_sends: {
        Row: {
          id: string
          campaign_id: string
          workspace_id: string
          lead_id: string
          campaign_lead_id: string | null
          template_id: string | null
          to_email: string
          subject: string
          body_html: string
          body_text: string | null
          sequence_step: number | null
          value_prop_id: string | null
          tone_used: string | null
          structure_used: string | null
          cta_type_used: string | null
          status: string
          provider: string | null
          provider_message_id: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          clicked_at: string | null
          replied_at: string | null
          bounced_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          workspace_id: string
          lead_id: string
          campaign_lead_id?: string | null
          template_id?: string | null
          to_email: string
          subject: string
          body_html: string
          body_text?: string | null
          sequence_step?: number | null
          value_prop_id?: string | null
          tone_used?: string | null
          structure_used?: string | null
          cta_type_used?: string | null
          status?: string
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          replied_at?: string | null
          bounced_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          workspace_id?: string
          lead_id?: string
          campaign_lead_id?: string | null
          template_id?: string | null
          to_email?: string
          subject?: string
          body_html?: string
          body_text?: string | null
          sequence_step?: number | null
          value_prop_id?: string | null
          tone_used?: string | null
          structure_used?: string | null
          cta_type_used?: string | null
          status?: string
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          replied_at?: string | null
          bounced_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      client_profiles: {
        Row: {
          id: string
          workspace_id: string
          company_name: string
          company_description: string | null
          website_url: string | null
          industry: string | null
          company_size: string | null
          primary_offering: string | null
          secondary_offerings: string[] | null
          value_propositions: Json
          trust_signals: Json
          pain_points: string[] | null
          competitors: string[] | null
          differentiators: string[] | null
          target_industries: string[] | null
          target_company_sizes: string[] | null
          target_seniorities: string[] | null
          target_regions: string[] | null
          target_titles: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          company_name: string
          company_description?: string | null
          website_url?: string | null
          industry?: string | null
          company_size?: string | null
          primary_offering?: string | null
          secondary_offerings?: string[] | null
          value_propositions?: Json
          trust_signals?: Json
          pain_points?: string[] | null
          competitors?: string[] | null
          differentiators?: string[] | null
          target_industries?: string[] | null
          target_company_sizes?: string[] | null
          target_seniorities?: string[] | null
          target_regions?: string[] | null
          target_titles?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          company_name?: string
          company_description?: string | null
          website_url?: string | null
          industry?: string | null
          company_size?: string | null
          primary_offering?: string | null
          secondary_offerings?: string[] | null
          value_propositions?: Json
          trust_signals?: Json
          pain_points?: string[] | null
          competitors?: string[] | null
          differentiators?: string[] | null
          target_industries?: string[] | null
          target_company_sizes?: string[] | null
          target_seniorities?: string[] | null
          target_regions?: string[] | null
          target_titles?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      campaign_leads: {
        Row: {
          id: string
          campaign_id: string
          lead_id: string
          enrichment_data: Json
          enriched_at: string | null
          matched_value_prop_id: string | null
          match_reasoning: string | null
          current_step: number
          last_email_sent_at: string | null
          next_email_scheduled_at: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          lead_id: string
          enrichment_data?: Json
          enriched_at?: string | null
          matched_value_prop_id?: string | null
          match_reasoning?: string | null
          current_step?: number
          last_email_sent_at?: string | null
          next_email_scheduled_at?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          lead_id?: string
          enrichment_data?: Json
          enriched_at?: string | null
          matched_value_prop_id?: string | null
          match_reasoning?: string | null
          current_step?: number
          last_email_sent_at?: string | null
          next_email_scheduled_at?: string | null
          status?: string
          created_at?: string
        }
      }
      campaign_reviews: {
        Row: {
          id: string
          campaign_id: string
          reviewer_id: string | null
          review_type: string
          status: string
          notes: string | null
          requested_changes: Json
          sample_emails_reviewed: Json
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          reviewer_id?: string | null
          review_type: string
          status?: string
          notes?: string | null
          requested_changes?: Json
          sample_emails_reviewed?: Json
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          reviewer_id?: string | null
          review_type?: string
          status?: string
          notes?: string | null
          requested_changes?: Json
          sample_emails_reviewed?: Json
          created_at?: string
          completed_at?: string | null
        }
      }
      // User Lead Targeting and Assignments (Self-Service Model)
      user_targeting: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          target_industries: string[] | null
          target_sic_codes: string[] | null
          target_states: string[] | null
          target_cities: string[] | null
          target_zips: string[] | null
          is_active: boolean
          daily_lead_limit: number
          daily_lead_cap: number | null
          weekly_lead_cap: number | null
          monthly_lead_cap: number | null
          notification_email: string | null
          notify_on_new_leads: boolean
          email_notifications: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          target_industries?: string[] | null
          target_sic_codes?: string[] | null
          target_states?: string[] | null
          target_cities?: string[] | null
          target_zips?: string[] | null
          is_active?: boolean
          daily_lead_limit?: number
          daily_lead_cap?: number | null
          weekly_lead_cap?: number | null
          monthly_lead_cap?: number | null
          notification_email?: string | null
          notify_on_new_leads?: boolean
          email_notifications?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          target_industries?: string[] | null
          target_sic_codes?: string[] | null
          target_states?: string[] | null
          target_cities?: string[] | null
          target_zips?: string[] | null
          is_active?: boolean
          daily_lead_limit?: number
          daily_lead_cap?: number | null
          weekly_lead_cap?: number | null
          monthly_lead_cap?: number | null
          notification_email?: string | null
          notify_on_new_leads?: boolean
          email_notifications?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_lead_assignments: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          workspace_id: string
          matching_criteria: Json
          status: string
          created_at: string
          viewed_at: string | null
          contacted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lead_id: string
          workspace_id: string
          matching_criteria?: Json
          status?: string
          created_at?: string
          viewed_at?: string | null
          contacted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string
          workspace_id?: string
          matching_criteria?: Json
          status?: string
          created_at?: string
          viewed_at?: string | null
          contacted_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {
      route_lead_to_workspace: {
        Args: {
          p_lead_id: string
          p_source_workspace_id: string
        }
        Returns: string
      }
      update_lead_status: {
        Args: {
          p_lead_id: string
          p_new_status: LeadStatus
          p_user_id: string
          p_change_note?: string | null
        }
        Returns: void
      }
      add_lead_note: {
        Args: {
          p_lead_id: string
          p_user_id: string
          p_content: string
          p_note_type?: NoteType
          p_is_pinned?: boolean
        }
        Returns: string
      }
    }
    Enums: {
      lead_status: LeadStatus
      note_type: NoteType
      activity_type: ActivityType
    }
  }
}

// Enum types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type NoteType = 'note' | 'call' | 'email' | 'meeting' | 'task'
export type ActivityType =
  | 'status_change'
  | 'note_added'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'call_logged'
  | 'meeting_scheduled'
  | 'task_completed'
  | 'assigned'
  | 'enriched'
  | 'created'

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export type VerificationStatus = 'pending' | 'valid' | 'invalid' | 'catch_all' | 'risky' | 'unknown'
export type SeniorityLevel = 'c_suite' | 'vp' | 'director' | 'manager' | 'ic' | 'unknown'
export type PartnerTier = 'premium' | 'standard' | 'probation' | 'suspended'
export type PartnerStatus = 'pending' | 'approved' | 'suspended' | 'terminated'
export type CommissionStatus = 'pending_holdback' | 'payable' | 'paid' | 'cancelled'
export type PurchaseStatus = 'pending' | 'completed' | 'refunded' | 'partially_refunded'
export type ReferralType = 'user_to_user' | 'partner_to_partner'
export type ReferralStatus = 'pending' | 'converted' | 'rewarded' | 'expired'
export type UploadBatchStatus = 'pending' | 'validating' | 'verifying' | 'completed' | 'failed'

// Extended Lead type with marketplace fields
export interface MarketplaceLead {
  id: string
  workspace_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  job_title: string | null
  phone: string | null
  company_name: string
  company_domain: string | null
  company_industry: string | null
  company_size: string | null
  company_employee_count: number | null
  city: string | null
  state: string | null
  state_code: string | null
  country: string | null
  postal_code: string | null
  seniority_level: SeniorityLevel | null
  sic_code: string | null
  sic_codes: string[]
  intent_score_calculated: number
  freshness_score: number
  verification_status: VerificationStatus
  hash_key: string | null
  sold_count: number
  first_sold_at: string | null
  marketplace_price: number | null
  is_marketplace_listed: boolean
  partner_id: string | null
  upload_batch_id: string | null
  created_at: string
}

// Partner type
export interface Partner {
  id: string
  name: string
  email: string
  company_name: string | null
  api_key: string
  payout_rate: number
  is_active: boolean
  total_leads_uploaded: number
  total_leads_sold: number
  total_earnings: number
  pending_balance: number
  available_balance: number
  verification_pass_rate: number
  duplicate_rate: number
  data_completeness_rate: number
  partner_score: number
  partner_tier: PartnerTier
  base_commission_rate: number
  bonus_commission_rate: number
  referral_code: string | null
  referred_by_partner_id: string | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  payout_threshold: number
  status: PartnerStatus
  suspended_at: string | null
  suspension_reason: string | null
  last_upload_at: string | null
  created_at: string
  updated_at: string
}

// Marketplace Purchase
export interface MarketplacePurchase {
  id: string
  buyer_workspace_id: string
  buyer_user_id: string
  total_leads: number
  total_price: number
  payment_method: 'credits' | 'stripe' | 'mixed'
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  credits_used: number
  card_amount: number
  status: PurchaseStatus
  refund_amount: number
  refund_reason: string | null
  filters_used: Json | null
  download_url: string | null
  download_expires_at: string | null
  created_at: string
  completed_at: string | null
}

// Marketplace Purchase Item
export interface MarketplacePurchaseItem {
  id: string
  purchase_id: string
  lead_id: string
  price_at_purchase: number
  intent_score_at_purchase: number | null
  freshness_score_at_purchase: number | null
  partner_id: string | null
  commission_rate: number | null
  commission_amount: number | null
  commission_bonuses: Json
  commission_status: CommissionStatus
  commission_payable_at: string | null
  commission_paid_at: string | null
  payout_id: string | null
  created_at: string
}

// Workspace Credits
export interface WorkspaceCredits {
  id: string
  workspace_id: string
  balance: number
  total_purchased: number
  total_used: number
  total_earned: number
  updated_at: string
}

// Credit Purchase
export interface CreditPurchase {
  id: string
  workspace_id: string
  user_id: string
  credits: number
  package_name: string | null
  amount_paid: number
  price_per_credit: number
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
}

// Referral
export interface Referral {
  id: string
  referrer_user_id: string | null
  referrer_partner_id: string | null
  referred_user_id: string | null
  referred_partner_id: string | null
  referral_type: ReferralType
  referral_code: string
  status: ReferralStatus
  milestones_achieved: Json
  rewards_issued: Json
  total_rewards_value: number
  created_at: string
  converted_at: string | null
}

// Partner Upload Batch
export interface PartnerUploadBatch {
  id: string
  partner_id: string
  file_name: string
  file_url: string | null
  file_size_bytes: number | null
  file_type: string | null
  field_mappings: Json
  industry_category_id: string | null
  default_sic_codes: string[]
  skip_invalid_rows: boolean
  status: UploadBatchStatus
  total_rows: number
  processed_rows: number
  valid_rows: number
  invalid_rows: number
  duplicate_rows: number
  verification_pending: number
  verification_complete: number
  verification_valid: number
  verification_invalid: number
  marketplace_listed: number
  preview_data: Json | null
  detected_columns: string[]
  error_message: string | null
  error_log: Json
  rejected_rows_url: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Email Verification Queue Item
export interface EmailVerificationQueueItem {
  id: string
  lead_id: string
  email: string
  priority: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  max_attempts: number
  verification_result: VerificationStatus | null
  verification_provider: string | null
  verification_response: Json | null
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  next_retry_at: string | null
  created_at: string
}

// Partner Score History
export interface PartnerScoreHistory {
  id: string
  partner_id: string
  score: number
  previous_score: number | null
  verification_pass_rate: number | null
  duplicate_rate: number | null
  data_completeness_rate: number | null
  avg_freshness_at_sale: number | null
  tier: PartnerTier | null
  previous_tier: PartnerTier | null
  change_reason: string | null
  calculated_at: string
}

// Marketplace Audit Log Entry
export interface MarketplaceAuditLog {
  id: string
  action: string
  actor_type: 'user' | 'partner' | 'system' | 'admin'
  actor_id: string | null
  actor_email: string | null
  target_type: string | null
  target_id: string | null
  details: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// Credit Package Configuration
export interface CreditPackage {
  id: string
  credits: number
  price: number
  pricePerCredit: number
  name: string
  popular?: boolean
}

// Marketplace Filter Options
export interface MarketplaceFilters {
  industries?: string[]
  sicCodes?: string[]
  states?: string[]
  cities?: string[]
  companySizes?: string[]
  seniorityLevels?: SeniorityLevel[]
  intentScoreMin?: number
  intentScoreMax?: number
  freshnessMin?: number
  hasPhone?: boolean
  hasVerifiedEmail?: boolean
  verificationStatus?: VerificationStatus[]
  priceMin?: number
  priceMax?: number
}

// Marketplace Lead Preview (obfuscated for unpurchased leads)
export interface MarketplaceLeadPreview {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string
  company_industry: string | null
  company_size: string | null
  city: string | null
  state: string | null
  seniority_level: SeniorityLevel | null
  intent_score: number
  freshness_score: number
  verification_status: VerificationStatus
  has_phone: boolean
  has_email: boolean
  price: number
  // Obfuscated fields (revealed after purchase)
  email_preview: string | null // j***@company.com
  phone_preview: string | null // +1 (555) ***-**89
}

// Commission Calculation Result
export interface CommissionCalculation {
  rate: number
  amount: number
  bonuses: string[]
}

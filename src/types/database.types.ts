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

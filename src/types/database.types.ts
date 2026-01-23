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
    }
    Enums: {}
  }
}

export interface ClientData {
  id: string
  company_name: string
  created_at: string
  status: string
  enrichment_status: string
  copy_generation_status: string
  copy_approval_status: string
  automation_log: Array<{ step: string; status: string; timestamp: string }> | null
  intake_source: string | null
}

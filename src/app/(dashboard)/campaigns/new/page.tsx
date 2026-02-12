// New Campaign Request Page
// Users apply for a custom EmailBison campaign

import { CampaignRequestForm } from '@/components/campaigns/campaign-request-form'

export const metadata = {
  title: 'Apply for Email Campaign',
  description: 'Request a custom email campaign from EmailBison',
}

export default async function NewCampaignPage() {
  // Layout already verified auth
  return <CampaignRequestForm />
}

/**
 * Partner Lead Upload Page
 * CSV upload portal for partners
 */

import { LeadUpload } from '@/components/partner/lead-upload'

export default function PartnerUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upload Leads</h1>
        <p className="text-muted-foreground mt-2">
          Upload your leads via CSV to sell on the marketplace
        </p>
      </div>

      <LeadUpload />
    </div>
  )
}

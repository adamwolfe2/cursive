import { requireAffiliate } from '../_lib/require-affiliate'
import { createAdminClient } from '@/lib/supabase/admin'
import { SignatureClient } from './SignatureClient'
import { AGREEMENT_VERSION } from '@/lib/affiliate/agreement'
import { shortDate } from '../_lib/format'
import { CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AgreementPage() {
  const affiliate = await requireAffiliate()
  const signed = !!affiliate.agreement_accepted_at

  let signature: {
    signer_name: string
    signature_svg: string | null
    document_hash: string
    accepted_at: string
    version: string
  } | null = null

  if (signed) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('affiliate_agreements')
      .select('signer_name, signature_svg, document_hash, accepted_at, version')
      .eq('affiliate_id', affiliate.id)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    signature = data
  }

  if (signed) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-base font-semibold text-green-900">Agreement signed</h2>
              <p className="text-sm text-green-700">
                Signed by {signature?.signer_name || `${affiliate.first_name} ${affiliate.last_name}`} on{' '}
                {shortDate(affiliate.agreement_accepted_at)} · {affiliate.agreement_version || AGREEMENT_VERSION}
              </p>
            </div>
          </div>
        </div>

        {signature?.signature_svg && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="mb-2 text-sm font-medium text-gray-700">Your signature on file</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signature.signature_svg}
              alt="Signature"
              className="max-h-32 rounded-lg border border-gray-100 bg-gray-50 p-2"
            />
            <p className="mt-3 break-all text-xs text-gray-400">
              Document hash (SHA-256): {signature.document_hash}
            </p>
            <a
              href={signature.signature_svg}
              download={`cursive-partner-signature-${affiliate.partner_code}.png`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Download signature
            </a>
          </div>
        )}

        <p className="text-xs text-gray-400">
          A copy of the agreement you signed is retained on file. Contact partners@meetcursive.com for a
          countersigned PDF.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Sign your Partner Agreement</h2>
        <p className="text-sm text-gray-500">
          Read the terms, sign below, and your payouts activate. Commissions you&apos;ve already earned
          stay pending until this is signed.
        </p>
      </div>
      <SignatureClient />
    </div>
  )
}

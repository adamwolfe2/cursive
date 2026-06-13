import { requireAffiliate } from '../_lib/require-affiliate'
import { LinksClient } from './LinksClient'
import { PlayCircle, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LinksPage() {
  const affiliate = await requireAffiliate()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Links &amp; assets</h2>
        <p className="text-sm text-gray-500">
          Every link is tagged with your code <span className="font-mono text-primary">{affiliate.partner_code}</span>.
          Signups and payments through them are tracked server-side and credited to you.
        </p>
      </div>

      {/* Offer context */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <h3 className="text-sm font-semibold text-gray-900">What you&apos;re selling</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><strong className="text-gray-900">Visitor Pixel — $97/mo:</strong> identifies 60–70% of anonymous site visitors (company + person).</li>
            <li><strong className="text-gray-900">Custom Audience — $197/mo:</strong> weekly in-market prospect lists built to ICP.</li>
            <li><strong className="text-gray-900">Bundle — $247/mo:</strong> both, priority updates. Best value, highest converter.</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            All recurring. You earn your ramp rate on this MRR every month it stays active.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <PlayCircle className="h-5 w-5" />
            <h3 className="text-sm font-semibold text-gray-900">The VSL</h3>
          </div>
          <p className="text-sm text-gray-600">
            The offer page does the selling — video, social proof, and self-serve checkout. Drive traffic
            there and let it convert.
          </p>
          <a
            href={`https://leads.meetcursive.com/get-leads?ref=${affiliate.partner_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Preview your VSL link
          </a>
        </div>
      </section>

      <LinksClient code={affiliate.partner_code} />
    </div>
  )
}

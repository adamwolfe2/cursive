'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FlowType } from './types'

export function SuccessScreen({ flow, onReset }: { flow: FlowType; onReset: () => void }) {
  const router = useRouter()
  return (
    <div className="max-w-lg mx-auto text-center py-12 space-y-6">
      <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {flow === 'audience' ? "You're on the list!" : "Campaign request sent!"}
        </h2>
        <p className="text-gray-500">
          {flow === 'audience'
            ? "Our team has been notified and will reach out within 24 hours to scope your custom audience."
            : "Our team has been notified and will contact you within 24 hours to discuss your campaign."}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-left space-y-3">
        <p className="text-sm font-semibold text-gray-700">What happens next</p>
        {(flow === 'audience' ? [
          'Our team reviews your ICP and data sources',
          'We scope the audience size and confirm pricing',
          'Sample of 25 leads delivered within 48 hours',
          'Full delivery on your timeline',
        ] : [
          'Our team reviews your brief and targeting',
          'We scope the campaign and confirm pricing',
          'Copy drafted and sent to you for approval',
          'Sends begin within your agreed timeline',
        ]).map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-sm text-gray-600">{step}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.push('/website-visitors')}>
          <Eye className="h-4 w-4 mr-2" />
          Back to Visitors
        </Button>
        <Button onClick={onReset}>
          Submit Another Request
        </Button>
      </div>
    </div>
  )
}

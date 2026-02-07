// Campaign Request Success Page

import Link from 'next/link'
import { CheckCircle, Mail, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Campaign Request Submitted',
  description: 'Your campaign request has been submitted successfully',
}

export default function CampaignRequestSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <Card className="border-green-200">
          <CardContent className="pt-12 pb-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Campaign Request Submitted!
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Thank you for your interest in a custom email campaign. Our EmailBison team
              will review your request and reach out within 24 hours.
            </p>

            {/* Next Steps */}
            <div className="bg-primary/5 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                What Happens Next
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    1
                  </span>
                  <span>
                    <strong>Review:</strong> Our team will review your ICP and campaign goals
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    2
                  </span>
                  <span>
                    <strong>Strategy Call:</strong> We'll schedule a call to discuss your campaign strategy
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    3
                  </span>
                  <span>
                    <strong>Custom Proposal:</strong> Receive a tailored campaign proposal with pricing
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    4
                  </span>
                  <span>
                    <strong>Campaign Launch:</strong> Once approved, we'll craft and launch your campaign
                  </span>
                </li>
              </ol>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>
                Questions? Email us at{' '}
                <a
                  href="mailto:campaigns@emailbison.com"
                  className="text-primary hover:underline font-medium"
                >
                  campaigns@emailbison.com
                </a>
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/crm/leads">
                  View My Leads
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Back to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

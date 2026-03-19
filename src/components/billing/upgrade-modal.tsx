'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { UpgradeButton } from './upgrade-button'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  description?: string
}

const PRO_FEATURES = [
  '1,000 credits per day',
  '5 active queries',
  'Multi-channel delivery (Email, Slack, Webhooks)',
  'Advanced filtering & CRM integrations',
  'People Search',
  'Priority support',
]

export function UpgradeModal({
  open,
  onOpenChange,
  featureName,
  description,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to unlock {featureName}</DialogTitle>
          <DialogDescription>
            {description ||
              `${featureName} is available on the Pro plan. Upgrade to get access to this feature and more.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">$50</span>
            <span className="text-muted-foreground">/month</span>
            <span className="text-sm text-muted-foreground line-through ml-1">$99/mo</span>
          </div>

          {/* Features list */}
          <ul className="space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                <svg
                  className="h-4 w-4 text-primary flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <UpgradeButton billingPeriod="monthly" variant="primary" />

          {/* Guarantees */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
            <span>Cancel anytime</span>
            <span>30-day money-back guarantee</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

/**
 * UpgradeModal
 *
 * Contextual in-app modal that appears when a user hits a credit limit or
 * tries a premium feature. Shows tailored messaging based on the trigger,
 * fetches live credit packages from /api/credits/checkout, and redirects
 * to the Stripe checkout flow when the user selects a package.
 *
 * Designed to be helpful rather than aggressive — the user can always
 * dismiss with Escape or the X button.
 */

import { useEffect, useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Zap,
  Sparkles,
  Lock,
  Download,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { UpgradeTrigger } from '@/lib/hooks/use-upgrade-modal'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: UpgradeTrigger
  context?: string
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  pricePerCredit: number
  popular?: boolean
  savings?: string
}

// ── Trigger config ─────────────────────────────────────────────────────────────

interface TriggerConfig {
  icon: React.ReactNode
  headline: string
  subheadline: string
  badgeLabel: string
  badgeVariant: 'destructive' | 'secondary' | 'default' | 'outline'
}

function getTriggerConfig(trigger: UpgradeTrigger, context?: string): TriggerConfig {
  switch (trigger) {
    case 'credits_empty':
      return {
        icon: <Zap className="h-5 w-5 text-amber-500" />,
        headline: "You're out of credits",
        subheadline:
          context ||
          "You've used all your available credits. Pick up a package below to keep discovering and purchasing leads.",
        badgeLabel: 'Credits required',
        badgeVariant: 'destructive',
      }
    case 'credits_low':
      return {
        icon: <Zap className="h-5 w-5 text-amber-400" />,
        headline: 'Running low on credits',
        subheadline:
          context ||
          "Your credit balance is getting low. Top up now so you don't miss out on the leads you need.",
        badgeLabel: 'Low balance',
        badgeVariant: 'secondary',
      }
    case 'premium_feature':
      return {
        icon: <Lock className="h-5 w-5 text-primary" />,
        headline: 'This is a Pro feature',
        subheadline:
          context ||
          'Unlock advanced features like segment builder runs, bulk exports, and enrichment by adding credits to your account.',
        badgeLabel: 'Pro feature',
        badgeVariant: 'default',
      }
    case 'export_limit':
      return {
        icon: <Download className="h-5 w-5 text-blue-500" />,
        headline: "You've hit your export limit",
        subheadline:
          context ||
          'Export limits reset with a credit top-up. Choose a package to continue exporting your leads.',
        badgeLabel: 'Export limit reached',
        badgeVariant: 'secondary',
      }
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function UpgradeModal({
  isOpen,
  onClose,
  trigger,
  context,
}: UpgradeModalProps) {
  const config = getTriggerConfig(trigger, context)

  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  // Fetch packages when the modal opens
  useEffect(() => {
    if (!isOpen) return

    setLoadingPackages(true)
    setSelectedPackageId(null)

    fetch('/api/credits/checkout')
      .then((res) => res.json())
      .then((data) => {
        setPackages(data.packages || [])
        // Pre-select the popular package if one exists
        const popular = (data.packages || []).find((p: CreditPackage) => p.popular)
        if (popular) setSelectedPackageId(popular.id)
      })
      .catch((err) => {
        safeError('[UpgradeModal]', 'Failed to load credit packages:', err)
      })
      .finally(() => {
        setLoadingPackages(false)
      })
  }, [isOpen])

  const { mutate: checkoutMutate, isPending: isCheckoutPending } = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    },
    onError: (error: Error) => {
      safeError('[UpgradeModal]', 'Checkout error:', error)
      toast.error(error.message || 'Failed to start checkout. Please try again.')
    },
  })

  const handlePurchase = useCallback(() => {
    if (!selectedPackageId) return
    checkoutMutate(selectedPackageId)
  }, [selectedPackageId, checkoutMutate])

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            {config.icon}
            <Badge variant={config.badgeVariant}>{config.badgeLabel}</Badge>
          </div>
          <DialogTitle className="text-xl font-semibold text-left">
            {config.headline}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-left leading-relaxed">
            {config.subheadline}
          </DialogDescription>
        </DialogHeader>

        {/* Value prop row */}
        <div className="flex items-center gap-6 py-3 border-t border-b border-zinc-100 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            280M+ verified contacts
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-600" />
            Credits never expire
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-600" />
            Instant activation
          </span>
        </div>

        {/* Package selection */}
        {loadingPackages ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Unable to load packages.{' '}
              <a
                href="/marketplace/credits"
                className="text-primary underline underline-offset-2"
              >
                View credits page
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {packages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                  aria-pressed={isSelected}
                >
                  <Card
                    className={`relative h-full transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-primary border-2 shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {pkg.popular && (
                      <Badge
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px]"
                        variant="default"
                      >
                        Most Popular
                      </Badge>
                    )}
                    <CardContent className="pt-5 pb-5 px-4">
                      <div className="text-center">
                        <p className="text-[13px] font-medium text-zinc-700">{pkg.name}</p>
                        <div className="mt-1.5">
                          <span className="text-2xl font-bold text-zinc-900">
                            {formatPrice(pkg.price)}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {pkg.credits.toLocaleString()} credits
                        </p>
                        {pkg.savings && (
                          <Badge
                            variant="secondary"
                            className="mt-2 text-[11px]"
                          >
                            {pkg.savings}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 space-y-1.5 text-[12px] text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          ${pkg.pricePerCredit.toFixed(2)} per credit
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          Instant delivery
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3 flex justify-center">
                          <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <a
            href="/marketplace/credits"
            className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View all options
          </a>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-initial"
            >
              Not now
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={
                !selectedPackageId ||
                isCheckoutPending ||
                loadingPackages
              }
              className="flex-1 sm:flex-initial min-w-[140px]"
            >
              {isCheckoutPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                'Buy Credits'
              )}
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Secure payment powered by Stripe
        </p>
      </DialogContent>
    </Dialog>
  )
}

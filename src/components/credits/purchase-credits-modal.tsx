'use client'

/**
 * Purchase Credits Modal
 * Allows users to buy credit packages via Stripe
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  pricePerCredit: number
  popular?: boolean
  savings?: string
}

interface PurchaseCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBalance?: number
}

export function PurchaseCreditsModal({
  open,
  onOpenChange,
  currentBalance = 0,
}: PurchaseCreditsModalProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)

  // Fetch packages on mount
  useState(() => {
    fetch('/api/credits/checkout')
      .then(res => res.json())
      .then(data => {
        setPackages(data.packages || [])
        setLoadingPackages(false)
      })
      .catch(err => {
        console.error('Failed to load packages:', err)
        setLoadingPackages(false)
      })
  })

  const checkoutMutation = useMutation({
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
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start checkout')
    },
  })

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit package to continue generating leads. Current balance: {currentBalance.toLocaleString()} credits
          </DialogDescription>
        </DialogHeader>

        {loadingPackages ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={pkg.popular ? 'border-primary border-2 relative' : ''}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="pt-6 pb-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {formatPrice(pkg.price)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pkg.credits.toLocaleString()} credits
                    </div>
                    {pkg.savings && (
                      <Badge variant="secondary" className="mt-2">
                        {pkg.savings}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>${pkg.pricePerCredit.toFixed(2)} per lead credit</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Access to 280M+ database</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Credits never expire</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instant delivery</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                    onClick={() => checkoutMutation.mutate(pkg.id)}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Purchase'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center mt-4">
          Secure payment powered by Stripe • Credits never expire • Instant activation
        </div>
      </DialogContent>
    </Dialog>
  )
}

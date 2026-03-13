'use client'

import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CREDIT_PACKAGES } from '@/lib/constants/credit-packages'

export function BuyCreditsCard() {
  const toast = useToast()
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null)
  const [purchaseCooldown, setPurchaseCooldown] = useState(false)

  const handlePurchaseCredits = async (packageId: string, credits: number, price: number) => {
    // Prevent double-click: ignore if already purchasing or in cooldown
    if (purchasingPackage || purchaseCooldown) return

    setPurchasingPackage(packageId)
    setPurchaseCooldown(true)

    // Generate a client-side request ID for idempotency
    const requestId = `${packageId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    try {
      const response = await fetch('/api/marketplace/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
        },
        body: JSON.stringify({ packageId, credits, amount: price }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start purchase')
    } finally {
      setPurchasingPackage(null)
      // Keep button disabled for 5 seconds after click to prevent rapid re-clicks
      setTimeout(() => setPurchaseCooldown(false), 5000)
    }
  }

  return (
    <Card id="credits">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Buy Credits</CardTitle>
          <Badge variant="outline" className="text-xs">One-time purchase</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm text-muted-foreground">
              Each credit enriches one lead with phone, email, LinkedIn, and company intel.{' '}
              <span className="text-foreground font-medium">Credits never expire.</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              One enriched lead with a direct phone number can be worth 10-100x the cost.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePurchaseCredits(pkg.id, pkg.credits, pkg.price)}
              disabled={purchasingPackage === pkg.id || purchaseCooldown}
              className={`group border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-left relative disabled:opacity-60 disabled:cursor-wait ${
                pkg.popular ? 'border-primary/30' : 'border-border'
              }`}
            >
              {pkg.popular && (
                <Badge variant="default" className="absolute -top-2.5 right-3 text-[10px]">Popular</Badge>
              )}
              <div className="mb-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                  {pkg.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pkg.credits.toLocaleString()} credits
                </p>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-lg font-bold text-foreground">${pkg.price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ${pkg.pricePerCredit}/credit
                {pkg.savings > 0 && ` · Save ${pkg.savings}%`}
              </p>
              <div className="mt-3 w-full text-center py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {purchasingPackage === pkg.id ? 'Redirecting...' : 'Buy Now'}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

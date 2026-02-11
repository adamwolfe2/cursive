/**
 * Buy Lead Button Component
 * Handles Stripe payment flow for purchasing leads
 */

'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface PaymentFormProps {
  leadId: string
  clientSecret: string
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({
  leadId,
  clientSecret,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      // Confirm payment with Stripe
      const { error: submitError, paymentIntent } = await stripe.confirmPayment(
        {
          elements,
          redirect: 'if_required',
        }
      )

      if (submitError) {
        setError(submitError.message || 'Payment failed')
        onError(submitError.message || 'Payment failed')
        setLoading(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm purchase in our database
        const res = await fetch(`/api/leads/${leadId}/confirm-purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })

        if (res.ok) {
          onSuccess()
        } else {
          const data = await res.json()
          setError(
            data.error ||
              'Payment succeeded but failed to confirm purchase. Please contact support.'
          )
          onError(
            data.error ||
              'Payment succeeded but failed to confirm purchase. Please contact support.'
          )
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError(errorMessage)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Purchase Lead - $20'
        )}
      </Button>
    </form>
  )
}

interface Lead {
  id: string
  business_name?: string | null
  company_name?: string | null
  industry?: string | null
  company_industry?: string | null
  status?: string | null
  contact_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
}

interface BuyLeadButtonProps {
  lead: Lead
  onPurchaseComplete?: () => void
}

export function BuyLeadButton({ lead, onPurchaseComplete }: BuyLeadButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBuyClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/leads/${lead.id}/purchase`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setClientSecret(data.clientSecret)
        setShowModal(true)
      } else {
        setError(data.error || 'Failed to initiate purchase')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }

    setLoading(false)
  }

  const handleSuccess = () => {
    setShowModal(false)
    setClientSecret(null)
    if (onPurchaseComplete) {
      onPurchaseComplete()
    } else {
      // Default: reload page to show updated status
      window.location.reload()
    }
  }

  const handleError = (errorMessage: string) => {
    console.error('Purchase error:', errorMessage)
  }

  const isSold = lead.status === 'sold'

  return (
    <>
      <Button
        onClick={handleBuyClick}
        disabled={loading || isSold}
        variant={isSold ? 'secondary' : 'default'}
        size="sm"
      >
        {isSold ? (
          'Sold'
        ) : loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Buy Lead - $20'
        )}
      </Button>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Lead</DialogTitle>
            <DialogDescription className="mt-2 space-y-1">
              <div className="font-medium text-foreground">
                {lead.business_name || lead.company_name || 'Unknown Business'}
              </div>
              {(lead.industry || lead.company_industry) && (
                <div className="text-sm text-muted-foreground">
                  Industry: {lead.industry || lead.company_industry}
                </div>
              )}
              {(lead.contact_name || (lead.first_name && lead.last_name)) && (
                <div className="text-sm text-muted-foreground">
                  Contact: {lead.contact_name || `${lead.first_name} ${lead.last_name}`}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Complete your purchase for $20. After payment, you&apos;ll receive
                full contact information including email and phone.
              </div>
            </DialogDescription>
          </DialogHeader>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                leadId={lead.id}
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

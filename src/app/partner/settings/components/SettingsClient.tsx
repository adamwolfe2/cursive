'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Partner } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

interface Payout {
  id: string
  amount: number
  period_start: string
  period_end: string
  status: string
  stripe_transfer_id: string | null
  leads_count: number
  notes: string | null
  created_at: string
  paid_at: string | null
}

interface SettingsClientProps {
  partner: Partner
  payouts: Payout[]
}

const payoutStatusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
}

export function SettingsClient({ partner, payouts }: SettingsClientProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSavingThreshold, setIsSavingThreshold] = useState(false)
  const [payoutThreshold, setPayoutThreshold] = useState(partner.payout_threshold || 100)
  const shouldAnimate = useSafeAnimation()

  const handleSavePayoutThreshold = async () => {
    if (payoutThreshold < 25) return
    setIsSavingThreshold(true)
    try {
      const response = await fetch('/api/partner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_threshold: payoutThreshold }),
      })
      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to save payout threshold:', data.error)
      }
    } catch (error) {
      console.error('Failed to save payout threshold:', error)
    } finally {
      setIsSavingThreshold(false)
    }
  }

  const hasStripeAccount = !!partner.stripe_account_id

  const handleConnectStripe = async () => {
    setIsConnecting(true)
    try {
      // Call API to create Stripe Connect account link
      const response = await fetch('/api/partner/stripe/connect', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      className="space-y-6 max-w-4xl"
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? 'hidden' : undefined}
      animate={shouldAnimate ? 'visible' : undefined}
    >
      {/* Payout Account */}
      <motion.div
        className="bg-white rounded-lg border border-blue-100/50 shadow-sm"
        variants={shouldAnimate ? sectionVariants : undefined}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Payout Account
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Stripe account to receive payouts
          </p>
        </div>

        <div className="p-6">
          {hasStripeAccount ? (
            <div className="space-y-4">
              {/* Connected Status */}
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">
                    Stripe Connected
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Your Stripe account is connected and ready to receive payouts.
                  </div>
                  {partner.stripe_account_id && (
                    <div className="text-xs text-green-600 mt-2">
                      Account ID: {partner.stripe_account_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Payout Settings */}
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="min-payout">Minimum Payout Threshold</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="min-payout"
                        type="number"
                        min="25"
                        step="5"
                        value={payoutThreshold}
                        onChange={(e) => setPayoutThreshold(Number(e.target.value))}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSavePayoutThreshold}
                      disabled={isSavingThreshold || payoutThreshold < 25}
                    >
                      {isSavingThreshold ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum amount required before a payout is issued (minimum $25)
                  </p>
                </div>

                <div>
                  <Label>Payout Schedule</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="text-sm">
                      <span className="font-medium">Monthly</span> — First business day
                      of each month
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Link */}
              <div className="pt-4 border-t border-gray-100">
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <a
                    href={`https://dashboard.stripe.com/connect/accounts/${partner.stripe_account_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View in Stripe Dashboard
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Not Connected */}
              <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-amber-900">
                    Stripe Account Required
                  </div>
                  <div className="text-sm text-amber-700 mt-1">
                    Connect a Stripe account to receive payouts for your lead sales.
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <div>
                <Button
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Connect Stripe Account
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  You&apos;ll be redirected to Stripe to complete the connection process
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Payout History */}
      <motion.div
        className="bg-white rounded-lg border border-blue-100/50 shadow-sm overflow-hidden"
        variants={shouldAnimate ? sectionVariants : undefined}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Payout History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View your recent payout transactions
          </p>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <div className="text-sm font-medium text-muted-foreground">
              No payouts yet
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Payouts are issued monthly once you reach the minimum threshold
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/50">
                    <TableHead>Period</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout, index) => {
                    const config = payoutStatusConfig[payout.status as keyof typeof payoutStatusConfig] || payoutStatusConfig.pending
                    const StatusIcon = config.icon

                    const RowWrapper = shouldAnimate ? motion.tr : TableRow

                    return (
                      <RowWrapper
                        key={payout.id}
                        {...(shouldAnimate
                          ? {
                              initial: { opacity: 0, x: -20 },
                              animate: { opacity: 1, x: 0 },
                              transition: { delay: index * 0.05, duration: 0.3 },
                              whileHover: { backgroundColor: 'rgba(59, 130, 246, 0.03)' } as any,
                            }
                          : {})}
                      >
                        <TableCell>
                          <div className="text-sm">
                            {new Date(payout.period_start).toLocaleDateString()} -{' '}
                            {new Date(payout.period_end).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{payout.leads_count}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold text-green-600">
                            ${payout.amount.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.paid_at ? (
                            <div className="text-sm">
                              {formatDistanceToNow(new Date(payout.paid_at), {
                                addSuffix: true,
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </RowWrapper>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {payouts.map((payout, index) => {
                const config = payoutStatusConfig[payout.status as keyof typeof payoutStatusConfig] || payoutStatusConfig.pending
                const StatusIcon = config.icon

                const CardWrapper = shouldAnimate ? motion.div : 'div'

                return (
                  <CardWrapper
                    key={payout.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-2"
                    {...(shouldAnimate
                      ? {
                          initial: { opacity: 0, y: 20 },
                          animate: { opacity: 1, y: 0 },
                          transition: { delay: index * 0.05, duration: 0.3 },
                          whileHover: { y: -2, shadow: 'md' } as any,
                        }
                      : {})}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-sm text-muted-foreground">
                        {new Date(payout.period_start).toLocaleDateString()} -{' '}
                        {new Date(payout.period_end).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className={`${config.color} flex-shrink-0 ml-2`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-sm text-muted-foreground">
                        {payout.leads_count} leads
                      </div>
                      <div className="font-semibold text-lg text-green-600">
                        ${payout.amount.toFixed(2)}
                      </div>
                    </div>
                  </CardWrapper>
                )
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Account Information */}
      <motion.div
        className="bg-white rounded-lg border border-blue-100/50 shadow-sm"
        variants={shouldAnimate ? sectionVariants : undefined}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Account Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Partner Name</Label>
              <div className="font-medium mt-1">{partner.name}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="font-medium mt-1">{partner.email}</div>
            </div>
            {partner.company_name && (
              <div>
                <Label className="text-xs text-muted-foreground">Company</Label>
                <div className="font-medium mt-1">{partner.company_name}</div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Partner Tier</Label>
              <div className="font-medium mt-1 capitalize">{partner.partner_tier}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

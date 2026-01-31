'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Partner, PartnerUploadBatch } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Ban,
  PlayCircle,
  Edit,
  Save,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'
import { useToast } from '@/lib/hooks/use-toast'

interface PartnerDetailClientProps {
  partner: Partner
  batches: PartnerUploadBatch[]
  uploadCount: number
  earnings: Array<{
    id: string
    lead_id: string | null
    amount: number
    status: string
    description: string | null
    created_at: string
  }>
  earningsCount: number
  payouts: Array<{
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
  }>
  referredCount: number
}

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
  active: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Active' },
  suspended: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Suspended' },
  rejected: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Rejected' },
}

export function PartnerDetailClient({
  partner: initialPartner,
  batches,
  uploadCount,
  earnings,
  earningsCount,
  payouts,
  referredCount,
}: PartnerDetailClientProps) {
  const router = useRouter()
  const shouldAnimate = useSafeAnimation()
  const toast = useToast()
  const [partner, setPartner] = useState(initialPartner)
  const [isEditingCommission, setIsEditingCommission] = useState(false)
  const [newCommissionRate, setNewCommissionRate] = useState(partner.payout_rate)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Please provide a suspension reason')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspensionReason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to suspend partner')
      }

      const { partner: updatedPartner } = await response.json()
      setPartner(updatedPartner)
      setIsSuspendDialogOpen(false)
      setSuspensionReason('')
      toast.success('Partner suspended successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend partner')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActivate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to activate partner')
      }

      const { partner: updatedPartner } = await response.json()
      setPartner(updatedPartner)
      setIsActivateDialogOpen(false)
      toast.success('Partner activated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate partner')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCommission = async () => {
    if (newCommissionRate < 0 || newCommissionRate > 1) {
      toast.error('Commission rate must be between 0 and 1')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutRate: newCommissionRate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update commission')
      }

      const { partner: updatedPartner } = await response.json()
      setPartner(updatedPartner)
      setIsEditingCommission(false)
      toast.success('Commission rate updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update commission')
    } finally {
      setIsSubmitting(false)
    }
  }

  const config = statusConfig[partner.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/partners')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{partner.name}</h1>
            <p className="text-muted-foreground">{partner.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
          {partner.status === 'active' && (
            <Button variant="destructive" onClick={() => setIsSuspendDialogOpen(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Suspend Partner
            </Button>
          )}
          {(partner.status === 'suspended' || partner.status === 'pending') && (
            <Button variant="default" onClick={() => setIsActivateDialogOpen(true)}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Activate Partner
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.3 }}
      >
        <StatCard
          label="Total Earnings"
          value={`$${partner.total_earnings.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Leads Uploaded"
          value={partner.total_leads_uploaded.toLocaleString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Leads Sold"
          value={partner.total_leads_sold.toLocaleString()}
          icon={TrendingUp}
          color="cyan"
        />
        <StatCard
          label="Referred Partners"
          value={referredCount}
          icon={Users}
          color="amber"
        />
      </motion.div>

      {/* Partner Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Partner Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{partner.id.slice(0, 8)}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{partner.company_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier</span>
                <span className="font-medium capitalize">{partner.partner_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality Score</span>
                <span className="font-medium">{partner.partner_score.toFixed(1)}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referral Code</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{partner.referral_code}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium">
                  {new Date(partner.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Commission Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Commission Settings</h2>
              {!isEditingCommission && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingCommission(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            {isEditingCommission ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="commission">Payout Rate (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={(newCommissionRate * 100).toFixed(2)}
                    onChange={(e) => setNewCommissionRate(parseFloat(e.target.value) / 100)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Partner receives {(newCommissionRate * 100).toFixed(2)}% of each lead sale
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateCommission} disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditingCommission(false)
                      setNewCommissionRate(partner.payout_rate)
                    }}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payout Rate</span>
                  <span className="font-medium">{(partner.payout_rate * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Commission</span>
                  <span className="font-medium">{(partner.base_commission_rate * 100).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Suspension Info */}
          {partner.status === 'suspended' && partner.suspension_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Suspension Reason</h3>
                  <p className="text-sm text-red-700 mt-1">{partner.suspension_reason}</p>
                  {partner.suspended_at && (
                    <p className="text-xs text-red-600 mt-2">
                      Suspended {formatDistanceToNow(new Date(partner.suspended_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Uploads */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Recent Uploads ({uploadCount})
            </h2>
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploads yet</p>
            ) : (
              <div className="space-y-3">
                {batches.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium truncate">{batch.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {batch.total_rows.toLocaleString()} rows • {batch.valid_rows.toLocaleString()} valid
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {batch.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Earnings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Recent Earnings ({earningsCount})
            </h2>
            {earnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No earnings yet</p>
            ) : (
              <div className="space-y-3">
                {earnings.slice(0, 5).map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">${earning.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {earning.description || 'Lead sale'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(earning.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payouts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Recent Payouts ({payouts.length})
            </h2>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payouts yet</p>
            ) : (
              <div className="space-y-3">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">${payout.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payout.leads_count} leads
                      </p>
                    </div>
                    <Badge variant="outline">
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suspend Dialog */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Partner</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately suspend {partner.name} and prevent them from uploading new leads.
              Please provide a reason for suspension.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Suspension Reason</Label>
            <Textarea
              id="reason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Enter reason for suspension..."
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={isSubmitting || !suspensionReason.trim()}
            >
              {isSubmitting ? 'Suspending...' : 'Suspend Partner'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Partner</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate {partner.name} and allow them to upload leads to the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={isSubmitting}>
              {isSubmitting ? 'Activating...' : 'Activate Partner'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: 'green' | 'blue' | 'cyan' | 'amber'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <Icon className="h-8 w-8 opacity-50" />
      </div>
    </div>
  )
}

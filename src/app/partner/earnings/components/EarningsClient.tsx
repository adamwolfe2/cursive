'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
} from 'lucide-react'
import { EmptyState } from '@/components/animations/EmptyState'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

interface Earning {
  id: string
  lead_id: string | null
  amount: number
  status: string
  description: string | null
  created_at: string
}

interface EarningsClientProps {
  initialEarnings: Earning[]
  totalCount: number
  partnerId: string
  stats: {
    totalEarnings: number
    pendingBalance: number
    availableBalance: number
    totalLeadsSold: number
    commissionRate: number
  }
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock,
  },
}

export function EarningsClient({
  initialEarnings,
  totalCount,
  partnerId,
  stats,
}: EarningsClientProps) {
  const [earnings] = useState(initialEarnings)
  const shouldAnimate = useSafeAnimation()

  if (earnings.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Summary */}
        <StatsGrid stats={stats} shouldAnimate={shouldAnimate} />

        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="No earnings yet"
          description="Your earnings will appear here when leads are sold from the marketplace"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <StatsGrid stats={stats} shouldAnimate={shouldAnimate} />

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border border-blue-100/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">
              {totalCount} total transactions
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50/50">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Lead ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((earning, index) => {
              const config = statusConfig[earning.status as keyof typeof statusConfig] || statusConfig.pending
              const StatusIcon = config.icon

              const RowWrapper = shouldAnimate ? motion.tr : TableRow

              return (
                <RowWrapper
                  key={earning.id}
                  {...(shouldAnimate
                    ? {
                        initial: { opacity: 0, x: -20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: index * 0.05, duration: 0.3 },
                        whileHover: { backgroundColor: 'rgba(59, 130, 246, 0.03)' },
                      }
                    : {})}
                >
                  <TableCell>
                    <div className="text-sm">
                      {new Date(earning.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(earning.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-sm">
                      {earning.description || 'Lead sale commission'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {earning.lead_id ? (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {earning.lead_id.slice(0, 8)}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold text-green-600">
                      +${earning.amount.toFixed(2)}
                    </div>
                  </TableCell>
                </RowWrapper>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">
              {totalCount} total transactions
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {earnings.map((earning, index) => {
          const config = statusConfig[earning.status as keyof typeof statusConfig] || statusConfig.pending
          const StatusIcon = config.icon

          const CardWrapper = shouldAnimate ? motion.div : 'div'

          return (
            <CardWrapper
              key={earning.id}
              className="bg-white rounded-lg border border-blue-100/50 shadow-sm p-4 space-y-3"
              {...(shouldAnimate
                ? {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.05, duration: 0.3 },
                    whileHover: { y: -2, shadow: 'md' },
                  }
                : {})}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {earning.description || 'Lead sale commission'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(earning.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <Badge variant="outline" className={`${config.color} flex-shrink-0 ml-2`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {earning.lead_id && (
                  <div className="text-xs text-muted-foreground">
                    Lead: {earning.lead_id.slice(0, 8)}
                  </div>
                )}
                <div className="font-semibold text-lg text-green-600 ml-auto">
                  +${earning.amount.toFixed(2)}
                </div>
              </div>
            </CardWrapper>
          )
        })}
      </div>
    </div>
  )
}

function StatsGrid({
  stats,
  shouldAnimate,
}: {
  stats: EarningsClientProps['stats']
  shouldAnimate: boolean
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? 'hidden' : undefined}
      animate={shouldAnimate ? 'visible' : undefined}
    >
      <StatCard
        label="Total Earnings"
        value={`$${stats.totalEarnings.toFixed(2)}`}
        icon={DollarSign}
        color="green"
        subtitle="All-time revenue"
        shouldAnimate={shouldAnimate}
      />
      <StatCard
        label="Available Balance"
        value={`$${stats.availableBalance.toFixed(2)}`}
        icon={CheckCircle}
        color="blue"
        subtitle="Ready for payout"
        shouldAnimate={shouldAnimate}
      />
      <StatCard
        label="Pending"
        value={`$${stats.pendingBalance.toFixed(2)}`}
        icon={Clock}
        color="amber"
        subtitle="Processing"
        shouldAnimate={shouldAnimate}
      />
      <StatCard
        label="Leads Sold"
        value={stats.totalLeadsSold.toLocaleString()}
        icon={TrendingUp}
        color="purple"
        subtitle={`${(stats.commissionRate * 100).toFixed(0)}% commission`}
        shouldAnimate={shouldAnimate}
      />
    </motion.div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  shouldAnimate,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: 'green' | 'blue' | 'amber' | 'purple'
  subtitle?: string
  shouldAnimate: boolean
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }

  const CardWrapper = shouldAnimate ? motion.div : 'div'

  return (
    <CardWrapper
      className={`rounded-lg border p-4 ${colorClasses[color]} bg-gradient-to-br from-white/50 transition-all duration-200`}
      {...(shouldAnimate
        ? {
            whileHover: { y: -4, shadow: 'lg' },
            variants: {
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            },
          }
        : {})}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          {subtitle && (
            <div className="text-xs opacity-60 mt-1">{subtitle}</div>
          )}
        </div>
        <Icon className="h-8 w-8 opacity-50 flex-shrink-0" />
      </div>
    </CardWrapper>
  )
}

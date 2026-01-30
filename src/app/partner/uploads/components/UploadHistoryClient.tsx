'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PartnerUploadBatch } from '@/types/database.types'
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
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
} from 'lucide-react'
import { EmptyState } from '@/components/animations/EmptyState'
import { useSafeAnimation } from '@/hooks/use-reduced-motion'

interface UploadHistoryClientProps {
  initialBatches: PartnerUploadBatch[]
  totalCount: number
  partnerId: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },
  validating: {
    label: 'Validating',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock,
  },
  verifying: {
    label: 'Verifying',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
}

export function UploadHistoryClient({
  initialBatches,
  totalCount,
  partnerId,
}: UploadHistoryClientProps) {
  const [batches] = useState(initialBatches)
  const shouldAnimate = useSafeAnimation()

  if (batches.length === 0) {
    return (
      <EmptyState
        icon={<Upload className="h-12 w-12" />}
        title="No uploads yet"
        description="Upload your first batch of leads to get started"
        action={
          <Button asChild>
            <a href="/partner/upload">Upload Leads</a>
          </Button>
        }
      />
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={shouldAnimate ? containerVariants : undefined}
        initial={shouldAnimate ? 'hidden' : undefined}
        animate={shouldAnimate ? 'visible' : undefined}
      >
        <StatCard
          label="Total Uploads"
          value={totalCount}
          icon={FileText}
          color="blue"
          shouldAnimate={shouldAnimate}
        />
        <StatCard
          label="Completed"
          value={batches.filter((b) => b.status === 'completed').length}
          icon={CheckCircle}
          color="green"
          shouldAnimate={shouldAnimate}
        />
        <StatCard
          label="Processing"
          value={
            batches.filter((b) => ['validating', 'verifying', 'pending'].includes(b.status))
              .length
          }
          icon={Clock}
          color="amber"
          shouldAnimate={shouldAnimate}
        />
        <StatCard
          label="Failed"
          value={batches.filter((b) => b.status === 'failed').length}
          icon={XCircle}
          color="red"
          shouldAnimate={shouldAnimate}
        />
      </motion.div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border border-blue-100/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50/50">
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Rows</TableHead>
              <TableHead className="text-right">Valid</TableHead>
              <TableHead className="text-right">Invalid</TableHead>
              <TableHead className="text-right">Duplicates</TableHead>
              <TableHead className="text-right">Listed</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch, index) => {
              const config = statusConfig[batch.status]
              const StatusIcon = config.icon

              const RowWrapper = shouldAnimate ? motion.tr : TableRow

              return (
                <RowWrapper
                  key={batch.id}
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
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{batch.file_name}</div>
                        {batch.file_size_bytes && (
                          <div className="text-xs text-muted-foreground">
                            {formatBytes(batch.file_size_bytes)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {batch.total_rows.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {batch.valid_rows.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {batch.invalid_rows.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {batch.duplicate_rows.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-blue-600">
                    {batch.marketplace_listed.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(batch.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {batch.rejected_rows_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={batch.rejected_rows_url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
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
        {batches.map((batch, index) => {
          const config = statusConfig[batch.status]
          const StatusIcon = config.icon

          const CardWrapper = shouldAnimate ? motion.div : 'div'

          return (
            <CardWrapper
              key={batch.id}
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{batch.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(batch.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={`${config.color} flex-shrink-0 ml-2`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">{batch.total_rows.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="text-xs text-green-700">Valid</div>
                  <div className="font-semibold text-green-700">
                    {batch.valid_rows.toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <div className="text-xs text-red-700">Invalid</div>
                  <div className="font-semibold text-red-700">
                    {batch.invalid_rows.toLocaleString()}
                  </div>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <div className="text-xs text-blue-700">Listed</div>
                  <div className="font-semibold text-blue-700">
                    {batch.marketplace_listed.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {batch.rejected_rows_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={batch.rejected_rows_url} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardWrapper>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  shouldAnimate,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'amber' | 'red'
  shouldAnimate: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <Icon className="h-8 w-8 opacity-50" />
      </div>
    </CardWrapper>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

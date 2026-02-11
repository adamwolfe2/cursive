'use client'

import { useState } from 'react'
import { Download, FileText, Package, Calendar, CheckCircle, Clock, Loader2 } from 'lucide-react'

interface Delivery {
  id: string
  delivery_type: string
  delivery_period_start: string
  delivery_period_end: string
  status: string
  file_path: string | null
  file_name: string | null
  file_size: number | null
  delivered_at: string | null
  created_at: string
}

interface DeliveriesListProps {
  deliveries: Delivery[]
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  lead_list: 'Lead List',
  campaign_setup: 'Campaign Report',
  monthly_report: 'Monthly Report',
  optimization_session: 'Optimization Report',
}

export function DeliveriesList({ deliveries }: DeliveriesListProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleDownload = async (deliveryId: string, _filePath: string, _fileName: string) => {
    setDownloading(deliveryId)

    try {
      const response = await fetch('/api/services/deliveries/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: deliveryId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download file')
      }

      // Open signed URL in new tab to download
      window.open(data.download_url, '_blank')
    } catch (err: any) {
      alert(err.message || 'Failed to download file')
    } finally {
      setDownloading(null)
    }
  }

  const statusConfig = {
    scheduled: {
      label: 'Scheduled',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Calendar
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Clock
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle
    }
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-12 text-center">
        <Package className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          No deliveries yet
        </h3>
        <p className="text-zinc-600">
          Your first delivery will arrive within 5-7 business days after completing onboarding.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-zinc-200">
        <h2 className="text-2xl font-bold text-zinc-900">
          Deliveries
        </h2>
        <p className="text-sm text-zinc-600 mt-1">
          Download your lead lists and reports
        </p>
      </div>

      <div className="divide-y divide-zinc-200">
        {deliveries.map((delivery) => {
          const statusData = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.scheduled
          const StatusIcon = statusData.icon
          const deliveryLabel = DELIVERY_TYPE_LABELS[delivery.delivery_type] || delivery.delivery_type

          return (
            <div key={delivery.id} className="px-8 py-6 hover:bg-zinc-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {deliveryLabel}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusData.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusData.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-zinc-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(delivery.delivery_period_start)} - {formatDate(delivery.delivery_period_end)}
                      </span>
                    </div>

                    {delivery.file_size && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{formatFileSize(delivery.file_size)}</span>
                      </div>
                    )}

                    {delivery.delivered_at && (
                      <div>
                        Delivered {formatDate(delivery.delivered_at)}
                      </div>
                    )}
                  </div>
                </div>

                {delivery.status === 'delivered' && delivery.file_path && (
                  <button
                    onClick={() => handleDownload(delivery.id, delivery.file_path!, delivery.file_name || 'download.csv')}
                    disabled={downloading === delivery.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading === delivery.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Download
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

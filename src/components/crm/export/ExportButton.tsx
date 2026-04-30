'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'

// ============================================================================
// Platform SVG Icons (inline to avoid external dependencies)
// ============================================================================

function HubSpotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.58 12.97a2.74 2.74 0 0 0-1.56.49l-1.74-1.32a4.08 4.08 0 0 0 .45-1.85v-.15l2.1-.96a2.2 2.2 0 0 0 .75.14 2.22 2.22 0 1 0-2.22-2.22c0 .48.16.92.42 1.28l-2.03.93a4.1 4.1 0 0 0-2.47-1.72V5.3a2.22 2.22 0 1 0-1.98 0v2.28a4.12 4.12 0 0 0-3.3 4.03 4.12 4.12 0 0 0 4.12 4.12c1.12 0 2.13-.45 2.88-1.17l1.8 1.37a2.72 2.72 0 1 0 2.78-2.96zm-7.46 2.57a2.35 2.35 0 0 1-2.35-2.35 2.35 2.35 0 0 1 2.35-2.35 2.35 2.35 0 0 1 2.35 2.35 2.35 2.35 0 0 1-2.35 2.35z" />
    </svg>
  )
}

function SalesforceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.05 6.22a4.27 4.27 0 0 1 3.2-1.43c1.68 0 3.13.97 3.85 2.38a4.96 4.96 0 0 1 2.06-.45c2.76 0 4.99 2.25 4.99 5.02s-2.23 5.02-4.99 5.02c-.4 0-.79-.05-1.16-.14a3.89 3.89 0 0 1-3.4 2.01c-.7 0-1.37-.19-1.94-.52a4.67 4.67 0 0 1-4.13 2.51 4.68 4.68 0 0 1-4.3-2.86 4.25 4.25 0 0 1-.82.08c-2.35 0-4.25-1.92-4.25-4.28 0-1.59.87-2.98 2.15-3.72A4.54 4.54 0 0 1 5.6 5.31c1.74 0 3.27.98 4.05 2.42l.4-1.51z" />
    </svg>
  )
}

function GoogleSheetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.727 6.727H14V0l6.727 6.727h-6zm.546 3.818H8.727v1.091h6.546v-1.091zm0 3.273H8.727v1.091h6.546v-1.091zm0 3.273H8.727v1.091h6.546v-1.091zM19.636 8.182V22.91A1.09 1.09 0 0 1 18.545 24H5.455a1.09 1.09 0 0 1-1.091-1.09V1.09C4.364.49 4.854 0 5.455 0H13.09v7.09a1.09 1.09 0 0 0 1.091 1.092h5.455z" />
    </svg>
  )
}

function CsvIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="10" y1="9" x2="10" y2="9" />
    </svg>
  )
}

// ============================================================================
// Platform Configuration
// ============================================================================

export type ExportPlatform = 'hubspot' | 'salesforce' | 'google-sheets' | 'csv'

interface PlatformConfig {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  hoverBgColor: string
  borderColor: string
  endpoint: string
}

export const PLATFORM_CONFIGS: Record<ExportPlatform, PlatformConfig> = {
  hubspot: {
    name: 'HubSpot',
    icon: HubSpotIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverBgColor: 'hover:bg-orange-100',
    borderColor: 'border-orange-200',
    endpoint: '/api/crm/export/hubspot',
  },
  salesforce: {
    name: 'Salesforce',
    icon: SalesforceIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100',
    borderColor: 'border-blue-200',
    endpoint: '/api/crm/export/salesforce',
  },
  'google-sheets': {
    name: 'Sheets',
    icon: GoogleSheetsIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    hoverBgColor: 'hover:bg-green-100',
    borderColor: 'border-green-200',
    endpoint: '/api/crm/export/google-sheets',
  },
  csv: {
    name: 'CSV',
    icon: CsvIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    hoverBgColor: 'hover:bg-gray-100',
    borderColor: 'border-gray-200',
    endpoint: '/api/crm/export',
  },
}

// ============================================================================
// Connection Status Type
// ============================================================================

export type ConnectionStatus = 'connected' | 'not_connected' | 'unknown'

// ============================================================================
// ExportButton Component
// ============================================================================

interface ExportButtonProps {
  platform: ExportPlatform
  selectedCount: number
  connectionStatus?: ConnectionStatus
  onExport: (platform: ExportPlatform) => void
  isExporting?: boolean
  exportSuccess?: boolean
}

export function ExportButton({
  platform,
  selectedCount,
  connectionStatus = 'unknown',
  onExport,
  isExporting = false,
  exportSuccess = false,
}: ExportButtonProps) {
  const config = PLATFORM_CONFIGS[platform]
  const Icon = config.icon
  const hasSelection = selectedCount > 0

  // Non-CSV platforms that are not connected are disabled with "Coming soon"
  const isCrmPlatform = platform !== 'csv'
  const isNotConnected = isCrmPlatform && connectionStatus !== 'connected'
  const isDisabled = !hasSelection || isExporting || isNotConnected

  const buttonContent = (
    <Button
      variant="outline"
      size="sm"
      disabled={isDisabled}
      onClick={() => onExport(platform)}
      className={cn(
        'h-9 gap-2 border transition-all duration-150',
        isNotConnected
          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
          : hasSelection && !isExporting && !exportSuccess
            ? `${config.borderColor} ${config.bgColor} ${config.hoverBgColor} ${config.color}`
            : 'border-gray-200 text-gray-400',
        exportSuccess && 'border-green-300 bg-green-50 text-green-600',
        isExporting && 'opacity-70'
      )}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : exportSuccess ? (
        <Check className="size-4" />
      ) : (
        <Icon className="size-4" />
      )}
      <span className="text-xs font-medium">{config.name}</span>
      {connectionStatus === 'connected' && isCrmPlatform && (
        <span className="size-1.5 rounded-full bg-green-500" />
      )}
      {isNotConnected && (
        <span className="size-1.5 rounded-full bg-gray-300" />
      )}
    </Button>
  )

  if (isNotConnected) {
    return (
      <Tooltip content="Coming soon" side="bottom">
        {buttonContent}
      </Tooltip>
    )
  }

  if (!hasSelection) {
    return (
      <Tooltip content="Select leads to export" side="bottom">
        {buttonContent}
      </Tooltip>
    )
  }

  return buttonContent
}

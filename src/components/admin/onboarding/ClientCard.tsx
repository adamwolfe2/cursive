'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'
import { PACKAGES } from '@/types/onboarding'
import type { OnboardingClient, PackageSlug } from '@/types/onboarding'

const PACKAGE_COLORS: Record<PackageSlug, string> = {
  super_pixel: 'bg-violet-100 text-violet-700',
  audience: 'bg-blue-100 text-blue-700',
  outbound: 'bg-orange-100 text-orange-700',
  bundle: 'bg-emerald-100 text-emerald-700',
  affiliate: 'bg-pink-100 text-pink-700',
  enrichment: 'bg-cyan-100 text-cyan-700',
  paid_ads: 'bg-amber-100 text-amber-700',
  data_delivery: 'bg-slate-100 text-slate-700',
}

function getDaysSince(dateStr: string): number {
  const created = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
}

interface ClientCardProps {
  client: OnboardingClient
}

export default function ClientCard({ client }: ClientCardProps) {
  const router = useRouter()
  const daysSince = getDaysSince(client.created_at)
  const maxBadges = 3
  const visiblePackages = client.packages_selected.slice(0, maxBadges)
  const remaining = client.packages_selected.length - maxBadges

  return (
    <div
      className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-border-focus/30 transition-all duration-150 cursor-pointer"
      onClick={() => router.push(`/admin/onboarding/${client.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-foreground truncate leading-tight">
          {client.company_name}
        </h4>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {daysSince}d
        </span>
      </div>

      <p className="text-xs text-muted-foreground truncate mb-2">
        {client.primary_contact_name}
      </p>

      <div className="flex flex-wrap gap-1 mb-2.5">
        {visiblePackages.map((pkg) => (
          <span
            key={pkg}
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${PACKAGE_COLORS[pkg]}`}
          >
            {PACKAGES[pkg]?.label ?? pkg}
          </span>
        ))}
        {remaining > 0 && (
          <Badge size="sm" variant="muted">
            +{remaining}
          </Badge>
        )}
      </div>

      {/* Portal not sent warning */}
      {!client.portal_invite_sent_at && (
        <div className="mb-2">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700">
            Portal not sent
          </span>
        </div>
      )}

      {/* Completion indicators */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30">
        <PortalDot
          color={getContractColor(client.rabbitsign_status)}
          label={`Contract: ${client.rabbitsign_status ?? 'pending'}`}
          emoji="📄"
        />
        <PortalDot
          color={getInvoiceColor(client.stripe_invoice_status)}
          label={`Invoice: ${client.stripe_invoice_status ?? 'draft'}`}
          emoji="💳"
        />
        <PortalDot
          color={client.sender_identity_approval ? 'bg-green-500' : 'bg-gray-300'}
          label={`Domains: ${client.sender_identity_approval ? 'approved' : 'pending'}`}
          emoji="🌐"
        />
        <PortalDot
          color={getCopyColor(client.copy_approval_status)}
          label={`Copy: ${client.copy_approval_status ?? 'not started'}`}
          emoji="✉️"
        />
      </div>
    </div>
  )
}

function getContractColor(status: string | null): string {
  if (status === 'signed' || status === 'completed') return 'bg-green-500'
  if (status === 'sent') return 'bg-yellow-400'
  return 'bg-gray-300'
}

function getInvoiceColor(status: string | null): string {
  if (status === 'paid') return 'bg-green-500'
  if (status === 'open' || status === 'sent') return 'bg-yellow-400'
  return 'bg-gray-300'
}

function getCopyColor(status: string | null): string {
  if (status === 'approved') return 'bg-green-500'
  if (status === 'pending' || status === 'needs_edits' || status === 'regenerating') return 'bg-yellow-400'
  return 'bg-gray-300'
}

interface PortalDotProps {
  color: string
  label: string
  emoji: string
}

function PortalDot({ color, label, emoji }: PortalDotProps) {
  return (
    <div
      className="relative group flex items-center gap-0.5"
      title={label}
    >
      <span className="text-[9px] leading-none">{emoji}</span>
      <span className={cn('h-2 w-2 rounded-sm', color)} />
      {/* Tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white shadow">
        {label}
      </span>
    </div>
  )
}

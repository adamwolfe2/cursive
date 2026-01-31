// Leads Table Column Definitions
// Defines columns for the leads CRM table using TanStack Table

'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/app/crm/components/StatusBadge'
import { LeadAvatar } from '@/app/crm/components/LeadAvatar'
import { URLPill } from '@/app/crm/components/URLPill'
import { CompanyFavicon } from '@/app/crm/components/CompanyFavicon'
import { ScoreProgress } from '@/app/crm/components/ScoreProgress'
import { InlineStatusEdit } from './InlineStatusEdit'
import { InlineAssignUserEdit } from './InlineAssignUserEdit'
import { InlineTagsEdit } from './InlineTagsEdit'
import type { LeadTableRow } from '@/types/crm.types'
import { cn } from '@/lib/utils'

// Types for workspace data
interface WorkspaceUser {
  id: string
  full_name: string
  email: string
}

// Helper to format currency
function formatCurrency(amount: number | null): string {
  if (amount === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

// Helper to format phone
function formatPhone(phone: string | null): string {
  if (!phone) return '-'
  // Basic US phone formatting
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}


export function createLeadsTableColumns(
  availableUsers: WorkspaceUser[] = [],
  commonTags: string[] = []
): ColumnDef<LeadTableRow>[] {
  return [
  // Selection column
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // Status column (with inline editing)
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Status
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <InlineStatusEdit leadId={row.original.id} currentStatus={row.getValue('status')} />
    ),
    size: 140,
  },

  // Name column (with avatar)
  {
    id: 'name',
    accessorFn: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Name
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const firstName = row.original.first_name
      const lastName = row.original.last_name
      const email = row.original.email
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || email || 'Unknown'

      return (
        <div className="flex items-center gap-2.5">
          <LeadAvatar
            firstName={firstName}
            lastName={lastName}
            email={email}
            size="sm"
          />
          <span className="font-normal truncate">{fullName}</span>
        </div>
      )
    },
    size: 240,
  },

  // Email column
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Email
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const email = row.getValue('email') as string | null
      const isVerified = row.original.verification_status === 'valid'

      return (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-normal truncate">{email || '-'}</span>
          {isVerified && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-normal">
              ✓
            </Badge>
          )}
        </div>
      )
    },
    size: 220,
  },

  // Phone column
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="text-xs font-normal">{formatPhone(row.getValue('phone'))}</span>
    ),
    size: 140,
    enableSorting: false,
  },

  // Company column
  {
    accessorKey: 'company_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Company
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const companyName = row.getValue('company_name') as string | null
      const companyDomain = row.original.company_domain

      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <CompanyFavicon domain={companyDomain} companyName={companyName} />
            <span className="font-normal truncate">{companyName || '-'}</span>
          </div>
          {companyDomain && (
            <URLPill url={`https://${companyDomain}`} maxWidth={160} showIcon={false} />
          )}
        </div>
      )
    },
    size: 180,
  },

  // Job Title column
  {
    accessorKey: 'job_title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Job Title
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-xs font-normal truncate block">{row.getValue('job_title') || '-'}</span>
    ),
    size: 160,
  },

  // Industry column
  {
    accessorKey: 'company_industry',
    header: 'Industry',
    cell: ({ row }) => {
      const industry = row.getValue('company_industry') as string | null
      return industry ? (
        <Badge variant="outline" className="text-[11px] font-normal">
          {industry}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )
    },
    size: 140,
  },

  // State column
  {
    accessorKey: 'state',
    header: 'State',
    cell: ({ row }) => {
      const state = row.getValue('state') as string | null
      return state ? (
        <Badge variant="secondary" className="text-[10px] font-mono font-normal">
          {state}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )
    },
    size: 80,
  },

  // Company Size column
  {
    accessorKey: 'company_size',
    header: 'Company Size',
    cell: ({ row }) => (
      <span className="text-xs font-normal">{row.getValue('company_size') || '-'}</span>
    ),
    size: 120,
  },

  // Intent Score column
  {
    accessorKey: 'intent_score_calculated',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Intent
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const score = row.getValue('intent_score_calculated') as number | null
      return <ScoreProgress score={score} />
    },
    size: 100,
  },

  // Freshness Score column
  {
    accessorKey: 'freshness_score',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Freshness
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const score = row.getValue('freshness_score') as number | null
      return <ScoreProgress score={score} />
    },
    size: 100,
  },

  // Price column
  {
    accessorKey: 'marketplace_price',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Price
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-xs font-normal tabular-nums">
        {formatCurrency(row.getValue('marketplace_price'))}
      </span>
    ),
    size: 100,
  },

  // Owner column (with inline editing)
  {
    accessorKey: 'assigned_user',
    header: 'Owner',
    cell: ({ row }) => (
      <InlineAssignUserEdit
        leadId={row.original.id}
        currentUser={row.original.assigned_user || null}
        availableUsers={availableUsers}
      />
    ),
    size: 160,
    enableSorting: false,
  },

  // Tags column (with inline editing)
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => (
      <InlineTagsEdit
        leadId={row.original.id}
        currentTags={row.original.tags || []}
        commonTags={commonTags}
      />
    ),
    size: 180,
    enableSorting: false,
  },

  // Created Date column
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 h-8"
      >
        Created
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return (
        <div className="flex flex-col">
          <span className="text-xs font-normal">{formatDistanceToNow(date, { addSuffix: true })}</span>
          <span className="text-[10px] text-muted-foreground/70">{format(date, 'MMM d, yyyy')}</span>
        </div>
      )
    },
    size: 140,
  },

  // Actions column
  {
    id: 'actions',
    cell: ({ row }) => {
      const lead = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lead.email || '')}
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert('Edit functionality coming soon')}>
              Edit lead
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (confirm(`Are you sure you want to delete this lead?`)) {
                  fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
                    .then(() => window.location.reload())
                    .catch((err) => alert('Failed to delete lead'))
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 60,
    enableHiding: false,
  },
  ]
}

// Export the type for consumers
export type { WorkspaceUser }

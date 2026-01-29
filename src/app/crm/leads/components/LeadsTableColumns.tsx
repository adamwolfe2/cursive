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
import { InlineStatusEdit } from './InlineStatusEdit'
import { InlineAssignUserEdit } from './InlineAssignUserEdit'
import { InlineTagsEdit } from './InlineTagsEdit'
import type { LeadTableRow } from '@/types/crm.types'
import { cn } from '@/lib/utils'

// Mock available users - TODO: Replace with actual workspace users from API
const MOCK_AVAILABLE_USERS = [
  { id: '1', full_name: 'John Doe', email: 'john@example.com' },
  { id: '2', full_name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', full_name: 'Bob Johnson', email: 'bob@example.com' },
]

// Mock common tags - TODO: Replace with actual workspace tags from API
const MOCK_COMMON_TAGS = ['hot-lead', 'qualified', 'enterprise', 'follow-up', 'demo-scheduled']

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

// Helper to get intent score color
function getIntentScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 70) return 'text-green-600 dark:text-green-400'
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export const leadsTableColumns: ColumnDef<LeadTableRow>[] = [
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
        <div className="flex items-center gap-2">
          <LeadAvatar
            firstName={firstName}
            lastName={lastName}
            email={email}
            size="sm"
          />
          <span className="font-medium truncate">{fullName}</span>
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
        <div className="flex items-center gap-2">
          <span className="text-sm truncate">{email || '-'}</span>
          {isVerified && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
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
      <span className="text-sm">{formatPhone(row.getValue('phone'))}</span>
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
        <div className="flex flex-col gap-1">
          <span className="font-medium truncate">{companyName || '-'}</span>
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
      <span className="text-sm truncate block">{row.getValue('job_title') || '-'}</span>
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
        <Badge variant="outline" className="text-xs">
          {industry}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
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
        <Badge variant="secondary" className="text-xs font-mono">
          {state}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    size: 80,
  },

  // Company Size column
  {
    accessorKey: 'company_size',
    header: 'Company Size',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('company_size') || '-'}</span>
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
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn('text-sm font-medium tabular-nums', getIntentScoreColor(score))}
          >
            {score !== null ? score : '-'}
          </span>
        </div>
      )
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
      return (
        <span className={cn('text-sm tabular-nums', getIntentScoreColor(score))}>
          {score !== null ? score : '-'}
        </span>
      )
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
      <span className="text-sm font-medium tabular-nums">
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
        availableUsers={MOCK_AVAILABLE_USERS}
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
        commonTags={MOCK_COMMON_TAGS}
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
          <span className="text-sm">{formatDistanceToNow(date, { addSuffix: true })}</span>
          <span className="text-xs text-muted-foreground">{format(date, 'MMM d, yyyy')}</span>
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
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit lead</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 60,
    enableHiding: false,
  },
]

'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import ClientOverview from '@/components/admin/onboarding/ClientOverview'
import SequenceReview from '@/components/admin/onboarding/SequenceReview'
import FulfillmentChecklist from '@/components/admin/onboarding/FulfillmentChecklist'
import ClientFilesView from '@/components/admin/onboarding/ClientFilesView'
import AutomationLog from '@/components/admin/onboarding/AutomationLog'
import {
  updateClientStatus,
  regenerateCopy,
} from '@/app/admin/onboarding/actions'
import {
  CLIENT_STATUSES,
  STATUS_LABELS,
} from '@/types/onboarding'
import type {
  OnboardingClient,
  ClientFile,
  FulfillmentChecklist as FulfillmentChecklistType,
  ClientStatus,
} from '@/types/onboarding'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  MessageSquare,
  RefreshCw,
  Copy,
} from 'lucide-react'
import { DEAL_CALCULATOR_HANDOFF_KEY } from '@/types/onboarding-wizard'

const STATUS_BADGE_VARIANT: Record<ClientStatus, 'muted' | 'info' | 'default' | 'warning' | 'success' | 'destructive'> = {
  lead: 'muted',
  booked: 'info',
  discovery: 'default',
  closed: 'warning',
  onboarding: 'warning',
  setup: 'info',
  active: 'success',
  reporting: 'default',
  churned: 'destructive',
}

interface ClientDetailTabsProps {
  client: OnboardingClient
  files: ClientFile[]
  checklist: FulfillmentChecklistType | null
}

export default function ClientDetailTabs({ client, files, checklist }: ClientDetailTabsProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<ClientStatus>(client.status)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [regeneratingCopy, setRegeneratingCopy] = useState(false)

  async function handleStatusChange(newStatus: ClientStatus) {
    if (newStatus === currentStatus) return
    setUpdatingStatus(true)
    const prevStatus = currentStatus
    setCurrentStatus(newStatus)
    try {
      await updateClientStatus(client.id, newStatus)
    } catch {
      setCurrentStatus(prevStatus)
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleRegenerateCopy() {
    setRegeneratingCopy(true)
    try {
      await regenerateCopy(client.id)
    } finally {
      setRegeneratingCopy(false)
    }
  }

  // Merge the optimistic status into the client object for child components
  const clientWithStatus = { ...client, status: currentStatus }

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Badge variant={STATUS_BADGE_VARIANT[currentStatus]} size="sm" dot>
              {STATUS_LABELS[currentStatus]}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CLIENT_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updatingStatus}
              >
                <Badge variant={STATUS_BADGE_VARIANT[status]} size="sm" dot className="mr-2">
                  {STATUS_LABELS[status]}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {client.slack_url && (
          <a
            href={client.slack_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
              Send to Slack
            </Button>
          </a>
        )}

        <Button
          variant="outline"
          size="sm"
          loading={regeneratingCopy}
          onClick={handleRegenerateCopy}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Regenerate Copy
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Copy className="h-3.5 w-3.5" />}
          onClick={() => {
            // Build a deal state from this client's data for the wizard
            const dealHandoff = {
              clientName: '',
              outboundTierId: client.outbound_tier?.toLowerCase() || null,
              selectedPackages: (client.packages_selected || []).filter((p: string) => p !== 'outbound' && p !== 'bundle'),
              customDomains: 0,
              customInboxes: 0,
              useCustomInfra: false,
              domainCostPer: 12,
              inboxCostPer: 7,
              setupFeeOverride: client.setup_fee,
              recurringOverride: client.recurring_fee,
              billingCadence: (client.billing_cadence as 'monthly' | 'quarterly' | 'annual') || 'monthly',
              notes: `Duplicated from ${client.company_name}`,
            }
            localStorage.setItem(DEAL_CALCULATOR_HANDOFF_KEY, JSON.stringify(dealHandoff))
            router.push('/admin/onboarding/new')
          }}
        >
          Duplicate as New
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sequences">Email Sequences</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientOverview client={clientWithStatus} />
        </TabsContent>

        <TabsContent value="sequences">
          <SequenceReview client={clientWithStatus} />
        </TabsContent>

        <TabsContent value="fulfillment">
          <FulfillmentChecklist checklist={checklist} />
        </TabsContent>

        <TabsContent value="files">
          <ClientFilesView files={files} />
        </TabsContent>

        <TabsContent value="automation">
          <AutomationLog client={clientWithStatus} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

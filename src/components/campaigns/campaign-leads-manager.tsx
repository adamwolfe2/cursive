'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '@/components/ui/modal'

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  company_name: string
  job_title: string | null
  company_industry: string | null
  created_at: string
}

interface CampaignLead {
  id: string
  lead_id: string
  status: string
  current_step: number
  last_email_sent_at: string | null
  next_email_scheduled_at: string | null
  created_at: string
  lead?: Lead
}

interface Campaign {
  id: string
  name: string
  status: string
  sequence_steps: number
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  ready: { label: 'Ready', variant: 'outline' },
  in_sequence: { label: 'In Sequence', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  replied: { label: 'Replied', variant: 'default' },
  bounced: { label: 'Bounced', variant: 'destructive' },
  unsubscribed: { label: 'Unsubscribed', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'outline' },
}

interface CampaignLeadsManagerProps {
  campaignId: string
}

export function CampaignLeadsManager({ campaignId }: CampaignLeadsManagerProps) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([])
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  // Fetch campaign details and current leads
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch campaign
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
        if (!campaignRes.ok) throw new Error('Failed to fetch campaign')
        const campaignData = await campaignRes.json()
        setCampaign(campaignData.data)

        // Fetch campaign leads
        const leadsRes = await fetch(`/api/campaigns/${campaignId}/leads`)
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json()
          setCampaignLeads(leadsData.data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [campaignId])

  // Fetch available leads when modal opens
  const fetchAvailableLeads = useCallback(async () => {
    setLoadingLeads(true)
    try {
      const existingLeadIds = new Set(campaignLeads.map((cl) => cl.lead_id))
      const response = await fetch('/api/leads?limit=200')
      if (response.ok) {
        const data = await response.json()
        // Filter out leads already in this campaign
        const available = (data.data || []).filter((lead: Lead) => !existingLeadIds.has(lead.id))
        setAvailableLeads(available)
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLoadingLeads(false)
    }
  }, [campaignLeads])

  useEffect(() => {
    if (addModalOpen) {
      fetchAvailableLeads()
    }
  }, [addModalOpen, fetchAvailableLeads])

  // Filter leads by search query
  const filteredLeads = availableLeads.filter((lead) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.company_name?.toLowerCase().includes(query) ||
      lead.full_name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.job_title?.toLowerCase().includes(query)
    )
  })

  // Selection handlers
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      if (next.has(leadId)) {
        next.delete(leadId)
      } else {
        next.add(leadId)
      }
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)))
  }

  const clearSelection = () => {
    setSelectedLeadIds(new Set())
  }

  // Add leads to campaign
  const addLeadsToCampaign = async () => {
    if (selectedLeadIds.size === 0) return

    setAdding(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: Array.from(selectedLeadIds),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add leads')
      }

      const data = await response.json()
      setCampaignLeads(data.data || [])
      setAddModalOpen(false)
      setSelectedLeadIds(new Set())
      setSearchQuery('')
    } catch (err) {
      console.error('Failed to add leads:', err)
    } finally {
      setAdding(false)
    }
  }

  // Remove lead from campaign
  const removeFromCampaign = async (campaignLeadId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/leads?lead_id=${campaignLeadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCampaignLeads((prev) => prev.filter((cl) => cl.id !== campaignLeadId))
      }
    } catch (err) {
      console.error('Failed to remove lead:', err)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getLeadName = (lead?: Lead) => {
    if (!lead) return 'Unknown'
    return lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageContainer>
    )
  }

  if (error || !campaign) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-destructive">{error || 'Campaign not found'}</p>
          <Button variant="outline" onClick={() => router.push('/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${campaign.name} - Leads`}
        description={`Manage leads for this campaign (${campaignLeads.length} leads)`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.name, href: `/campaigns/${campaignId}` },
          { label: 'Leads' },
        ]}
        actions={
          <Button onClick={() => setAddModalOpen(true)}>Add Leads</Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({campaignLeads.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({campaignLeads.filter((l) => l.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="in_sequence">
            In Sequence ({campaignLeads.filter((l) => l.status === 'in_sequence').length})
          </TabsTrigger>
          <TabsTrigger value="replied">
            Replied ({campaignLeads.filter((l) => l.status === 'replied').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LeadsList
            leads={campaignLeads}
            sequenceSteps={campaign.sequence_steps}
            onRemove={removeFromCampaign}
            formatDate={formatDate}
            getLeadName={getLeadName}
          />
        </TabsContent>
        <TabsContent value="pending">
          <LeadsList
            leads={campaignLeads.filter((l) => l.status === 'pending')}
            sequenceSteps={campaign.sequence_steps}
            onRemove={removeFromCampaign}
            formatDate={formatDate}
            getLeadName={getLeadName}
          />
        </TabsContent>
        <TabsContent value="in_sequence">
          <LeadsList
            leads={campaignLeads.filter((l) => l.status === 'in_sequence')}
            sequenceSteps={campaign.sequence_steps}
            onRemove={removeFromCampaign}
            formatDate={formatDate}
            getLeadName={getLeadName}
          />
        </TabsContent>
        <TabsContent value="replied">
          <LeadsList
            leads={campaignLeads.filter((l) => l.status === 'replied')}
            sequenceSteps={campaign.sequence_steps}
            onRemove={removeFromCampaign}
            formatDate={formatDate}
            getLeadName={getLeadName}
          />
        </TabsContent>
      </Tabs>

      {/* Add Leads Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        className="max-w-2xl"
      >
        <ModalHeader onClose={() => setAddModalOpen(false)}>
          <ModalTitle>Add Leads to Campaign</ModalTitle>
          <ModalDescription>
            Select leads to add to this campaign. They will be queued for enrichment and email composition.
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          {/* Search and bulk actions */}
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={selectAllFiltered}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {selectedLeadIds.size} of {filteredLeads.length} leads selected
          </p>

          {/* Lead list */}
          <div className="max-h-80 overflow-y-auto border border-border rounded-lg">
            {loadingLeads ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? 'No leads match your search'
                  : 'No available leads to add'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      selectedLeadIds.has(lead.id) ? 'bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleLeadSelection(lead.id)}
                  >
                    <Checkbox
                      checked={selectedLeadIds.has(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getLeadName(lead)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.job_title} at {lead.company_name}
                      </p>
                    </div>
                    {lead.email && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {lead.email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAddModalOpen(false)} disabled={adding}>
            Cancel
          </Button>
          <Button
            onClick={addLeadsToCampaign}
            disabled={selectedLeadIds.size === 0 || adding}
            loading={adding}
          >
            Add {selectedLeadIds.size} Lead{selectedLeadIds.size !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  )
}

// Sub-component for leads list
interface LeadsListProps {
  leads: CampaignLead[]
  sequenceSteps: number
  onRemove: (id: string) => void
  formatDate: (date: string | null) => string
  getLeadName: (lead?: Lead) => string
}

function LeadsList({ leads, sequenceSteps, onRemove, formatDate, getLeadName }: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads in this view"
        description="Add leads to this campaign to get started."
      />
    )
  }

  return (
    <Card>
      <div className="divide-y divide-border">
        {leads.map((campaignLead) => (
          <div key={campaignLead.id} className="p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {getLeadName(campaignLead.lead)}
                </p>
                <Badge
                  variant={STATUS_LABELS[campaignLead.status]?.variant || 'secondary'}
                  className="text-xs"
                >
                  {STATUS_LABELS[campaignLead.status]?.label || campaignLead.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {campaignLead.lead?.job_title} at {campaignLead.lead?.company_name}
                {campaignLead.lead?.email && ` • ${campaignLead.lead.email}`}
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {campaignLead.current_step}/{sequenceSteps}
                </p>
                <p>Step</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {formatDate(campaignLead.last_email_sent_at)}
                </p>
                <p>Last Sent</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {formatDate(campaignLead.next_email_scheduled_at)}
                </p>
                <p>Next</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(campaignLead.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  User,
  Tag,
  DollarSign,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { EditLeadDialog } from './EditLeadDialog'
import { StatusBadge } from '@/app/(dashboard)/crm/components/StatusBadge'
import { LeadAvatar } from '@/app/(dashboard)/crm/components/LeadAvatar'
import { CompanyFavicon } from '@/app/(dashboard)/crm/components/CompanyFavicon'
import { ScoreProgress } from '@/app/(dashboard)/crm/components/ScoreProgress'
import { useToast } from '@/lib/hooks/use-toast'
import { formatDistanceToNow, format } from 'date-fns'
import type { LeadTableRow } from '@/types/crm.types'

interface LeadDetailClientProps {
  initialLead: LeadTableRow
}

export function LeadDetailClient({ initialLead }: LeadDetailClientProps) {
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Fetch lead data with React Query
  const { data: lead, refetch } = useQuery({
    queryKey: ['lead', initialLead.id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${initialLead.id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      const data = await res.json()
      return data.data as LeadTableRow
    },
    initialData: initialLead,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete lead')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Lead deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      router.push('/crm/leads')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete lead')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
    setShowDeleteDialog(false)
  }

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Lead'

  return (
    <div className="h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/crm/leads')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <LeadAvatar
                firstName={lead.first_name}
                lastName={lead.last_name}
                email={lead.email}
                size="lg"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{fullName}</h1>
                {(lead.job_title || lead.title) && (
                  <p className="text-sm text-gray-500">{lead.job_title || lead.title}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Lead
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(lead.email || '')}
                  disabled={!lead.email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Copy Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Info Card */}
              {lead.company_name && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CompanyFavicon
                      domain={lead.company_domain}
                      companyName={lead.company_name}
                      size="md"
                    />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {lead.company_name}
                      </h2>
                      {lead.company_domain && (
                        <a
                          href={`https://${lead.company_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {lead.company_domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {lead.company_industry && (
                      <div>
                        <div className="text-gray-500 mb-1">Industry</div>
                        <div className="font-medium">{lead.company_industry}</div>
                      </div>
                    )}
                    {lead.company_size && (
                      <div>
                        <div className="text-gray-500 mb-1">Company Size</div>
                        <div className="font-medium">{lead.company_size}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="overview" className="bg-white rounded-lg border border-gray-200">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Activity
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      {lead.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {lead.email}
                          </a>
                          {lead.verification_status === 'valid' && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm text-gray-900"
                          >
                            {lead.phone}
                          </a>
                        </div>
                      )}
                      {(lead.city || lead.state || lead.country) && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {lead.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Activity tracking coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    <Edit2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Notes feature coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Right 1/3 */}
            <div className="space-y-6">
              {/* Lead Scores */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Lead Scores</h3>
                <div className="space-y-4">
                  {lead.intent_score_calculated !== null && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Intent Score</span>
                        <span className="text-sm font-medium">
                          {lead.intent_score_calculated}%
                        </span>
                      </div>
                      <ScoreProgress score={lead.intent_score_calculated ?? null} />
                    </div>
                  )}
                  {lead.freshness_score !== null && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Freshness Score</span>
                        <span className="text-sm font-medium">{lead.freshness_score}%</span>
                      </div>
                      <ScoreProgress score={lead.freshness_score ?? null} />
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment */}
              {lead.assigned_user && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Assigned To</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.assigned_user.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.assigned_user.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Marketplace Info */}
              {lead.marketplace_price && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Marketplace Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${(lead.marketplace_price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {lead.last_contacted_at && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>
                        Last contacted{' '}
                        {formatDistanceToNow(new Date(lead.last_contacted_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Lead Dialog */}
      <EditLeadDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        lead={lead}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {fullName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

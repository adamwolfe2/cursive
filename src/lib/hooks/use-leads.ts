// React Query hooks for CRM leads
// Handles data fetching, mutations, and optimistic updates

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import type { LeadFilters, LeadTableRow, LeadUpdatePayload } from '@/types/crm.types'

interface LeadsResponse {
  leads: LeadTableRow[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

// Build query string from filters
function buildQueryString(filters: LeadFilters): string {
  const params = new URLSearchParams()

  if (filters.search) params.append('search', filters.search)
  if (filters.status?.length) params.append('status', filters.status.join(','))
  if (filters.industries?.length) params.append('industries', filters.industries.join(','))
  if (filters.states?.length) params.append('states', filters.states.join(','))
  if (filters.companySizes?.length) params.append('companySizes', filters.companySizes.join(','))
  if (filters.intentScoreMin !== undefined) params.append('intentScoreMin', String(filters.intentScoreMin))
  if (filters.intentScoreMax !== undefined) params.append('intentScoreMax', String(filters.intentScoreMax))
  if (filters.freshnessMin !== undefined) params.append('freshnessMin', String(filters.freshnessMin))
  if (filters.hasPhone) params.append('hasPhone', 'true')
  if (filters.hasVerifiedEmail) params.append('hasVerifiedEmail', 'true')
  if (filters.assignedUserId) params.append('assignedUserId', filters.assignedUserId)
  if (filters.tags?.length) params.append('tags', filters.tags.join(','))
  if (filters.page) params.append('page', String(filters.page))
  if (filters.pageSize) params.append('pageSize', String(filters.pageSize))
  if (filters.orderBy) params.append('orderBy', filters.orderBy)
  if (filters.orderDirection) params.append('orderDirection', filters.orderDirection)

  return params.toString()
}

// Fetch leads with filters
async function fetchLeads(filters: LeadFilters): Promise<LeadsResponse> {
  const queryString = buildQueryString(filters)
  const response = await fetch(`/api/crm/leads?${queryString}`)

  if (!response.ok) {
    throw new Error('Failed to fetch leads')
  }

  return response.json()
}

// Hook to fetch leads
export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ['crm-leads', filters],
    queryFn: () => fetchLeads(filters),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Update a single lead
async function updateLead(id: string, updates: LeadUpdatePayload): Promise<LeadTableRow> {
  const response = await fetch(`/api/crm/leads?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update lead')
  }

  const data = await response.json()
  return data.lead
}

// Hook to update a lead
export function useUpdateLead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LeadUpdatePayload }) =>
      updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
      toast({
        title: 'Lead updated',
        description: 'The lead has been updated successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Bulk update leads
async function bulkUpdateLeads(ids: string[], action: string, data: Record<string, unknown>): Promise<void> {
  const response = await fetch('/api/crm/leads/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, action, data }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to perform bulk operation')
  }
}

// Hook for bulk operations
export function useBulkUpdateLeads() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ ids, action, data }: { ids: string[]; action: string; data: Record<string, unknown> }) =>
      bulkUpdateLeads(ids, action, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
      toast({
        title: 'Bulk update complete',
        description: `Updated ${variables.ids.length} lead(s) successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

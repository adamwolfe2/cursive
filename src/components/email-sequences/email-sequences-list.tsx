'use client'

/**
 * Email Sequences List Component
 * Display and manage email sequences
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Edit,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface EmailSequence {
  id: string
  name: string
  description: string | null
  trigger_type: 'manual' | 'segment' | 'lead_added' | 'lead_scored' | 'time_based'
  status: 'draft' | 'active' | 'paused' | 'archived'
  total_sent: number
  total_opened: number
  total_clicked: number
  total_replied: number
  created_at: string
  updated_at: string
  email_sequence_steps?: Array<{ id: string }>
}

const triggerLabels = {
  manual: 'Manual',
  segment: 'Segment Based',
  lead_added: 'New Lead',
  lead_scored: 'Lead Scored',
  time_based: 'Time Based',
}

const triggerIcons = {
  manual: Mail,
  segment: Users,
  lead_added: Zap,
  lead_scored: BarChart3,
  time_based: Mail,
}

export function EmailSequencesList() {
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['email-sequences', statusFilter],
    queryFn: async () => {
      const response = await fetch(
        `/api/email-sequences?status=${statusFilter}&include_steps=true`
      )
      if (!response.ok) throw new Error('Failed to fetch sequences')
      return response.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/email-sequences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update sequence')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
      toast.success('Sequence updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteSequenceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/email-sequences/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete sequence')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
      toast.success('Sequence deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const sequences: EmailSequence[] = data?.sequences || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOpenRate = (sequence: EmailSequence) => {
    if (sequence.total_sent === 0) return 0
    return Math.round((sequence.total_opened / sequence.total_sent) * 100)
  }

  const getClickRate = (sequence: EmailSequence) => {
    if (sequence.total_sent === 0) return 0
    return Math.round((sequence.total_clicked / sequence.total_sent) * 100)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading sequences...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Tabs defaultValue="active" value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No sequences yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first automated email sequence to nurture leads.
          </p>
          <Button asChild>
            <Link href="/email-sequences/new">Create Sequence</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sequences.map((sequence) => {
            const TriggerIcon = triggerIcons[sequence.trigger_type]
            return (
              <Card key={sequence.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          <Link
                            href={`/email-sequences/${sequence.id}`}
                            className="hover:underline"
                          >
                            {sequence.name}
                          </Link>
                        </CardTitle>
                        <Badge className={getStatusColor(sequence.status)}>
                          {sequence.status}
                        </Badge>
                      </div>
                      {sequence.description && (
                        <CardDescription>{sequence.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TriggerIcon className="h-4 w-4" />
                          <span>{triggerLabels[sequence.trigger_type]}</span>
                        </div>
                        <div>
                          {sequence.email_sequence_steps?.length || 0} steps
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/email-sequences/${sequence.id}`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        {sequence.status === 'active' && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: sequence.id,
                                status: 'paused',
                              })
                            }
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {(sequence.status === 'paused' ||
                          sequence.status === 'draft') && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: sequence.id,
                                status: 'active',
                              })
                            }
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setConfirmDeleteId(sequence.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {/* Stats */}
                {sequence.total_sent > 0 && (
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-2xl font-bold">
                          {sequence.total_sent}
                        </div>
                        <div className="text-xs text-muted-foreground">Sent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {getOpenRate(sequence)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Opened
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {getClickRate(sequence)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Clicked
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {sequence.total_replied}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Replied
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sequence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sequence? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) {
                  deleteSequenceMutation.mutate(confirmDeleteId)
                  setConfirmDeleteId(null)
                }
              }}
              disabled={deleteSequenceMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

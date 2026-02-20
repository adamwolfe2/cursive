'use client'

/**
 * Email Sequence Builder Component
 * Main interface for building and managing email sequences
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Play,
  Pause,
  Settings,
  Users,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { SequenceStepsList } from './sequence-steps-list'
import { AddStepModal } from './add-step-modal'
import Link from 'next/link'

interface SequenceBuilderProps {
  sequenceId: string
}

export function SequenceBuilder({ sequenceId }: SequenceBuilderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showAddStep, setShowAddStep] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['email-sequence', sequenceId],
    queryFn: async () => {
      const response = await fetch(`/api/email-sequences/${sequenceId}`)
      if (!response.ok) throw new Error('Failed to fetch sequence')
      return response.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/email-sequences/${sequenceId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['email-sequence', sequenceId] })
      toast.success('Sequence updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading sequence...</div>
  }

  const sequence = data?.sequence
  if (!sequence) {
    return <div className="text-center py-12">Sequence not found</div>
  }

  const steps = sequence.email_sequence_steps || []
  const canActivate = steps.length > 0 && sequence.status !== 'active'

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

  const getOpenRate = () => {
    if (sequence.total_sent === 0) return 0
    return Math.round((sequence.total_opened / sequence.total_sent) * 100)
  }

  const getClickRate = () => {
    if (sequence.total_sent === 0) return 0
    return Math.round((sequence.total_clicked / sequence.total_sent) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.push('/email-sequences')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sequences
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{sequence.name}</h1>
            <Badge className={getStatusColor(sequence.status)}>
              {sequence.status}
            </Badge>
          </div>
          {sequence.description && (
            <p className="text-muted-foreground">{sequence.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/email-sequences/${sequenceId}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/email-sequences/${sequenceId}/enrollments`}>
              <Users className="mr-2 h-4 w-4" />
              Enrollments
            </Link>
          </Button>
          {sequence.status === 'active' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatusMutation.mutate('paused')}
              disabled={updateStatusMutation.isPending}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate('active')}
              disabled={!canActivate || updateStatusMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {sequence.total_sent > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sequence.total_sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getOpenRate()}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Click Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getClickRate()}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Replies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sequence.total_replied}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Steps</CardTitle>
              <CardDescription>
                Configure the emails in your sequence
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddStep(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-10 w-10 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-foreground">No steps yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">Add your first email step to build out your sequence. Each step sends an email after a configurable delay.</p>
            </div>
          ) : (
            <SequenceStepsList
              steps={steps}
              sequenceId={sequenceId}
              sequenceStatus={sequence.status}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Step Modal */}
      {showAddStep && (
        <AddStepModal
          sequenceId={sequenceId}
          onClose={() => setShowAddStep(false)}
        />
      )}
    </div>
  )
}

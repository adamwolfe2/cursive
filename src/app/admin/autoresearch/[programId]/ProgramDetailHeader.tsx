'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AutoresearchProgram } from '@/types/autoresearch'
import { ArrowLeft, Play, Pause, Settings } from 'lucide-react'

interface Props {
  program: AutoresearchProgram
  badge: { variant: 'success' | 'warning' | 'muted' | 'default'; label: string }
}

export default function ProgramDetailHeader({ program, badge }: Props) {
  const [updating, setUpdating] = useState(false)
  const [status, setStatus] = useState(program.status)
  const [error, setError] = useState<string | null>(null)

  const toggleStatus = async () => {
    const nextStatus = status === 'active' ? 'paused' : 'active'
    setUpdating(true)
    setError(null)

    try {
      const res = await fetch(`/api/autoresearch/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to update status')
      }

      setStatus(nextStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setUpdating(false)
    }
  }

  const currentBadge = status === program.status
    ? badge
    : status === 'active'
      ? { variant: 'success' as const, label: 'Active' }
      : { variant: 'warning' as const, label: 'Paused' }

  return (
    <div className="mb-6">
      <Link
        href="/admin/autoresearch"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Programs
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
          <Badge variant={currentBadge.variant} dot>
            {currentBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/autoresearch/${program.id}/config`}>
            <Button variant="outline" size="sm" leftIcon={<Settings className="h-3.5 w-3.5" />}>
              Configure
            </Button>
          </Link>
          {status !== 'completed' && (
            <Button
              variant={status === 'active' ? 'outline' : 'success'}
              size="sm"
              onClick={toggleStatus}
              loading={updating}
              leftIcon={
                status === 'active'
                  ? <Pause className="h-3.5 w-3.5" />
                  : <Play className="h-3.5 w-3.5" />
              }
            >
              {status === 'active' ? 'Pause' : 'Start'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Briefcase,
  Clock,
  Building,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import type { Deal } from '@/types/crm.types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString()}`
  }
}

function stageBadge(stage: string): string {
  const map: Record<string, string> = {
    Qualified: 'bg-blue-100 text-blue-800',
    Proposal: 'bg-amber-100 text-amber-800',
    Negotiation: 'bg-orange-100 text-orange-800',
    'Closed Won': 'bg-green-100 text-green-800',
    'Closed Lost': 'bg-gray-100 text-red-700',
  }
  return map[stage] ?? 'bg-gray-100 text-gray-600'
}

// ─── fetch ────────────────────────────────────────────────────────────────────

async function fetchDeal(id: string): Promise<Deal> {
  const res = await fetch(`/api/crm/deals/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to fetch deal (${res.status})`)
  }
  const json = await res.json()
  return json.data as Deal
}

// ─── edit form state ──────────────────────────────────────────────────────────

interface EditFormState {
  name: string
  description: string
  value: string
  currency: string
  stage: string
  probability: string
  close_date: string
  company_id: string
  contact_id: string
}

function dealToForm(d: Deal): EditFormState {
  return {
    name: d.name ?? '',
    description: d.description ?? '',
    value: String(d.value ?? 0),
    currency: d.currency ?? 'USD',
    stage: d.stage ?? 'Qualified',
    probability: String(d.probability ?? 0),
    close_date: d.close_date ? d.close_date.substring(0, 10) : '',
    company_id: d.company_id ?? '',
    contact_id: d.contact_id ?? '',
  }
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <Skeleton className="h-4 w-28" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── not-found state ──────────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Deal Not Found</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        This deal doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Button asChild>
        <Link href="/crm/deals">Back to Deals</Link>
      </Button>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<EditFormState | null>(null)

  const { data: deal, isLoading, isError } = useQuery({
    queryKey: ['crm-deal', id],
    queryFn: () => fetchDeal(id),
    retry: (failureCount, error: Error) => {
      if (error.message.includes('404') || error.message.includes('not found')) return false
      return failureCount < 2
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/crm/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to update deal')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Deal updated')
      queryClient.invalidateQueries({ queryKey: ['crm-deal', id] })
      setEditOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/deals/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to delete deal')
      }
    },
    onSuccess: () => {
      toast.success('Deal deleted')
      router.push('/crm/deals')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openEdit = () => {
    if (deal) setForm(dealToForm(deal))
    setEditOpen(true)
  }

  const handleSave = () => {
    if (!form) return
    updateMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      value: parseFloat(form.value) || 0,
      currency: form.currency,
      stage: form.stage,
      probability: parseInt(form.probability, 10) || 0,
      close_date: form.close_date || undefined,
      company_id: form.company_id || undefined,
      contact_id: form.contact_id || undefined,
    })
  }

  if (isLoading) return <LoadingSkeleton />
  if (isError || !deal) return <NotFoundState />

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/deals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-lg">
              {deal.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{deal.name}</h1>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(deal.value, deal.currency)}
              </p>
              {deal.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">{deal.description}</p>
              )}
            </div>
          </div>
          <Badge className={stageBadge(deal.stage)}>{deal.stage}</Badge>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Deal details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Deal Details
          </h2>
          <FieldRow icon={<Briefcase className="h-4 w-4" />} label="Stage">
            <Badge className={stageBadge(deal.stage)}>{deal.stage}</Badge>
          </FieldRow>
          <FieldRow icon={<Briefcase className="h-4 w-4" />} label="Probability">
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, deal.probability))}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground">{deal.probability}%</span>
            </div>
          </FieldRow>
          {deal.close_date && (
            <FieldRow icon={<Calendar className="h-4 w-4" />} label="Close Date">
              <span className="text-sm text-foreground">
                {new Date(deal.close_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </FieldRow>
          )}
          {deal.closed_at && (
            <FieldRow icon={<Calendar className="h-4 w-4" />} label="Closed At">
              <span className="text-sm text-foreground">{formatDate(deal.closed_at)}</span>
            </FieldRow>
          )}
        </div>

        {/* Relations */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Relations
          </h2>
          {deal.company_id && (
            <FieldRow icon={<Building className="h-4 w-4" />} label="Company">
              <Link
                href={`/crm/companies/${deal.company_id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Company
                <ExternalLink className="h-3 w-3" />
              </Link>
            </FieldRow>
          )}
          {deal.contact_id && (
            <FieldRow icon={<User className="h-4 w-4" />} label="Contact">
              <Link
                href={`/crm/contacts/${deal.contact_id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Contact
                <ExternalLink className="h-3 w-3" />
              </Link>
            </FieldRow>
          )}
          {!deal.company_id && !deal.contact_id && (
            <p className="text-sm text-muted-foreground">No linked records</p>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground border-t pt-4">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Created {formatDate(deal.created_at)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Updated {formatDate(deal.updated_at)}
        </span>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>Update the deal&apos;s details below.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Deal Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  value={form.description}
                  rows={3}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Value</label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Currency</label>
                <Input
                  value={form.currency}
                  maxLength={3}
                  onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Stage</label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm({ ...form, stage: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Closed Won">Closed Won</SelectItem>
                    <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Probability (0–100)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Close Date</label>
                <Input
                  type="date"
                  value={form.close_date}
                  onChange={(e) => setForm({ ...form, close_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Link to Company ID
                </label>
                <Input
                  value={form.company_id}
                  placeholder="UUID"
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Link to Contact ID
                </label>
                <Input
                  value={form.contact_id}
                  placeholder="UUID"
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deal.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── field row helper ─────────────────────────────────────────────────────────

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

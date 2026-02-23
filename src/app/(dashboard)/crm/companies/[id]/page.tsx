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
  Linkedin,
  Twitter,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
import type { Company } from '@/types/crm.types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-800',
    Prospect: 'bg-blue-100 text-blue-800',
    Inactive: 'bg-gray-100 text-gray-600',
    Lost: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

// ─── fetch ────────────────────────────────────────────────────────────────────

async function fetchCompany(id: string): Promise<Company> {
  const res = await fetch(`/api/crm/companies/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to fetch company (${res.status})`)
  }
  const json = await res.json()
  return json.data as Company
}

// ─── edit form state ──────────────────────────────────────────────────────────

interface EditFormState {
  name: string
  domain: string
  industry: string
  employees_range: string
  revenue_range: string
  website: string
  phone: string
  email: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip_code: string
  country: string
  linkedin_url: string
  twitter_url: string
  status: string
}

function companyToForm(c: Company): EditFormState {
  return {
    name: c.name ?? '',
    domain: c.domain ?? '',
    industry: c.industry ?? '',
    employees_range: c.employees_range ?? '',
    revenue_range: c.revenue_range ?? '',
    website: c.website ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    address_line1: c.address_line1 ?? '',
    address_line2: c.address_line2 ?? '',
    city: c.city ?? '',
    state: c.state ?? '',
    zip_code: c.zip_code ?? '',
    country: c.country ?? '',
    linkedin_url: c.linkedin_url ?? '',
    twitter_url: c.twitter_url ?? '',
    status: c.status ?? 'Prospect',
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
        {[0, 1, 2].map((i) => (
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
        <Building className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Company Not Found</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        This company doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Button asChild>
        <Link href="/crm/companies">Back to Companies</Link>
      </Button>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<EditFormState | null>(null)

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['crm-company', id],
    queryFn: () => fetchCompany(id),
    retry: (failureCount, error: Error) => {
      if (error.message.includes('404') || error.message.includes('not found')) return false
      return failureCount < 2
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EditFormState>) => {
      const res = await fetch(`/api/crm/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to update company')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Company updated')
      queryClient.invalidateQueries({ queryKey: ['crm-company', id] })
      setEditOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/companies/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to delete company')
      }
    },
    onSuccess: () => {
      toast.success('Company deleted')
      router.push('/crm/companies')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openEdit = () => {
    if (company) setForm(companyToForm(company))
    setEditOpen(true)
  }

  if (isLoading) return <LoadingSkeleton />
  if (isError || !company) return <NotFoundState />

  const address = [
    company.address_line1,
    company.address_line2,
    company.city,
    company.state,
    company.zip_code,
    company.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/companies"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
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
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-semibold text-lg">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
              {company.domain && (
                <p className="text-sm text-muted-foreground mt-0.5">{company.domain}</p>
              )}
              {company.industry && (
                <p className="text-xs text-muted-foreground">{company.industry}</p>
              )}
            </div>
          </div>
          <Badge className={statusBadge(company.status)}>{company.status}</Badge>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Contact Info
          </h2>
          {company.website && (
            <FieldRow icon={<Globe className="h-4 w-4" />} label="Website">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                {company.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </FieldRow>
          )}
          {company.email && (
            <FieldRow icon={<Mail className="h-4 w-4" />} label="Email">
              <a
                href={`mailto:${company.email}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {company.email}
              </a>
            </FieldRow>
          )}
          {company.phone && (
            <FieldRow icon={<Phone className="h-4 w-4" />} label="Phone">
              <a
                href={`tel:${company.phone}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {company.phone}
              </a>
            </FieldRow>
          )}
          {address && (
            <FieldRow icon={<MapPin className="h-4 w-4" />} label="Address">
              <span className="text-sm text-foreground">{address}</span>
            </FieldRow>
          )}
          {!company.website && !company.email && !company.phone && !address && (
            <p className="text-sm text-muted-foreground">No contact info on file</p>
          )}
        </div>

        {/* Company details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Company Details
          </h2>
          {company.employees_range && (
            <FieldRow icon={<Building className="h-4 w-4" />} label="Employees">
              <span className="text-sm text-foreground">{company.employees_range}</span>
            </FieldRow>
          )}
          {company.revenue_range && (
            <FieldRow icon={<Building className="h-4 w-4" />} label="Revenue">
              <span className="text-sm text-foreground">{company.revenue_range}</span>
            </FieldRow>
          )}
          {company.linkedin_url && (
            <FieldRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn">
              <a
                href={company.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </FieldRow>
          )}
          {company.twitter_url && (
            <FieldRow icon={<Twitter className="h-4 w-4" />} label="Twitter">
              <a
                href={company.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </FieldRow>
          )}
          {company.enriched_at && (
            <FieldRow icon={<Clock className="h-4 w-4" />} label="Enriched">
              <span className="text-sm text-foreground">{formatDate(company.enriched_at)}</span>
            </FieldRow>
          )}
          {!company.employees_range &&
            !company.revenue_range &&
            !company.linkedin_url &&
            !company.twitter_url && (
              <p className="text-sm text-muted-foreground">No additional details</p>
            )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground border-t pt-4">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Created {formatDate(company.created_at)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Updated {formatDate(company.updated_at)}
        </span>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update the company&apos;s details below.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Domain</label>
                <Input
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Industry</label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Employees Range</label>
                <Input
                  value={form.employees_range}
                  placeholder="e.g. 50-200"
                  onChange={(e) => setForm({ ...form, employees_range: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Revenue Range</label>
                <Input
                  value={form.revenue_range}
                  placeholder="e.g. $1M-$10M"
                  onChange={(e) => setForm({ ...form, revenue_range: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Website</label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Address Line 1</label>
                <Input
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Address Line 2</label>
                <Input
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">City</label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Zip Code</label>
                <Input
                  value={form.zip_code}
                  onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Country</label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">LinkedIn URL</label>
                <Input
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Twitter URL</label>
                <Input
                  value={form.twitter_url}
                  onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => form && updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{company.name}</strong>? This action cannot be
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

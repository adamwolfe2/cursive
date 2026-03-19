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
  Building,
  Briefcase,
  User,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import type { Contact } from '@/types/crm.types'

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

async function fetchContact(id: string): Promise<Contact> {
  const res = await fetch(`/api/crm/contacts/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Failed to fetch contact (${res.status})`)
  }
  const json = await res.json()
  return json.data as Contact
}

// ─── edit form state ──────────────────────────────────────────────────────────

interface EditFormState {
  first_name: string
  last_name: string
  title: string
  email: string
  phone: string
  mobile: string
  linkedin_url: string
  twitter_url: string
  status: string
  seniority_level: string
}

function contactToForm(c: Contact): EditFormState {
  return {
    first_name: c.first_name ?? '',
    last_name: c.last_name ?? '',
    title: c.title ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    mobile: c.mobile ?? '',
    linkedin_url: c.linkedin_url ?? '',
    twitter_url: c.twitter_url ?? '',
    status: c.status ?? 'Prospect',
    seniority_level: c.seniority_level ?? '',
  }
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── error / not-found state ──────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <User className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Contact Not Found</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        This contact doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Button asChild>
        <Link href="/crm/contacts">Back to Contacts</Link>
      </Button>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<EditFormState | null>(null)

  // Query
  const { data: contact, isLoading, isError } = useQuery({
    queryKey: ['crm-contact', id],
    queryFn: () => fetchContact(id),
    retry: (failureCount, error: Error) => {
      if (error.message.includes('404') || error.message.includes('not found')) return false
      return failureCount < 2
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EditFormState>) => {
      const res = await fetch(`/api/crm/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to update contact')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Contact updated')
      queryClient.invalidateQueries({ queryKey: ['crm-contact', id] })
      setEditOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to delete contact')
      }
    },
    onSuccess: () => {
      toast.success('Contact deleted')
      router.push('/crm/contacts')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openEdit = () => {
    if (contact) setForm(contactToForm(contact))
    setEditOpen(true)
  }

  const handleSave = () => {
    if (!form) return
    updateMutation.mutate(form)
  }

  if (isLoading) return <LoadingSkeleton />
  if (isError || !contact) return <NotFoundState />

  const displayName =
    contact.full_name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
    'Unnamed Contact'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
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
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
              {contact.title && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {contact.title}
                </p>
              )}
              {contact.seniority_level && (
                <p className="text-xs text-muted-foreground">{contact.seniority_level}</p>
              )}
            </div>
          </div>
          <Badge className={statusBadge(contact.status)}>{contact.status}</Badge>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Contact Info
          </h2>
          {contact.email && (
            <FieldRow icon={<Mail className="h-4 w-4" />} label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {contact.email}
              </a>
            </FieldRow>
          )}
          {contact.phone && (
            <FieldRow icon={<Phone className="h-4 w-4" />} label="Phone">
              <a
                href={`tel:${contact.phone}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {contact.phone}
              </a>
            </FieldRow>
          )}
          {contact.mobile && (
            <FieldRow icon={<Phone className="h-4 w-4" />} label="Mobile">
              <a
                href={`tel:${contact.mobile}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {contact.mobile}
              </a>
            </FieldRow>
          )}
          {!contact.email && !contact.phone && !contact.mobile && (
            <p className="text-sm text-muted-foreground">No contact info on file</p>
          )}
        </div>

        {/* Social / links */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Social & Links
          </h2>
          {contact.linkedin_url && (
            <FieldRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn">
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </FieldRow>
          )}
          {contact.twitter_url && (
            <FieldRow icon={<Twitter className="h-4 w-4" />} label="Twitter">
              <a
                href={contact.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </FieldRow>
          )}
          {contact.company_id && (
            <FieldRow icon={<Building className="h-4 w-4" />} label="Company ID">
              <Link
                href={`/crm/companies/${contact.company_id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                View Company
                <ExternalLink className="h-3 w-3" />
              </Link>
            </FieldRow>
          )}
          {!contact.linkedin_url && !contact.twitter_url && !contact.company_id && (
            <p className="text-sm text-muted-foreground">No links on file</p>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground border-t pt-4">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Created {formatDate(contact.created_at)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Updated {formatDate(contact.updated_at)}
        </span>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update the contact&apos;s details below.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">First Name</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  disabled={updateMutation.isPending}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mobile</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">LinkedIn URL</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Twitter URL</label>
                <Input
                  disabled={updateMutation.isPending}
                  value={form.twitter_url}
                  onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  disabled={updateMutation.isPending}
                  value={form.status}
                  options={[
                    { value: 'Prospect', label: 'Prospect' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'Lost', label: 'Lost' },
                  ]}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Seniority Level</label>
                <Select
                  disabled={updateMutation.isPending}
                  value={form.seniority_level || 'none'}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'C-Level', label: 'C-Level' },
                    { value: 'VP', label: 'VP' },
                    { value: 'Director', label: 'Director' },
                    { value: 'Manager', label: 'Manager' },
                    { value: 'Individual Contributor', label: 'Individual Contributor' },
                  ]}
                  onChange={(e) => setForm({ ...form, seniority_level: e.target.value === 'none' ? '' : e.target.value })}
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{displayName}</strong>? This action cannot be
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

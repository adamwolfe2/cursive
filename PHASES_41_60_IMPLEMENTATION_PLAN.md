# Phases 41-60 Implementation Plan (Simplified)

## Overview

This plan focuses on features that can be built with your **existing integrations** (Supabase, Resend, Inngest, Stripe) and **native browser features** - no complex third-party API setups required.

---

## What You Already Have (Use These!)

| Service | Purpose | Ready to Use |
|---------|---------|--------------|
| **Supabase** | Database + Auth | ✅ |
| **Resend** | Email delivery | ✅ |
| **Inngest** | Background jobs | ✅ |
| **Stripe** | Payments | ✅ |
| **Vercel KV** | Caching | ✅ |

---

## PHASE 41: Lead Action Center
**Build Time: 2-3 days** | **No new APIs needed**

### What We're Building
- Click-to-call (uses native `tel:` links - works on all phones)
- Send email (uses `mailto:` or Resend which you have)
- Copy buttons for email/phone
- Lead status workflow (New → Contacted → Qualified → Won → Lost)
- Add notes to leads
- Follow-up date reminders

### Database Migration
Create file: `supabase/migrations/20260124000001_lead_workflow.sql`

```sql
-- Lead workflow status
DO $$ BEGIN
  CREATE TYPE lead_workflow_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS workflow_status lead_workflow_status DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- Lead notes
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead activity log
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON lead_notes
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON lead_activities
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_workflow_status ON leads(workflow_status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
```

### Files to Create

**1. Lead Action Bar Component**
`src/components/leads/lead-action-bar.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Phone, Mail, Copy, Check, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LeadActionBarProps {
  lead: {
    id: string
    company_data: {
      name: string
    }
    contact_data?: {
      contacts?: Array<{
        email?: string
        phone?: string
        full_name?: string
      }>
    }
  }
  onStatusChange?: () => void
}

export function LeadActionBar({ lead, onStatusChange }: LeadActionBarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const primaryContact = lead.contact_data?.contacts?.[0]
  const email = primaryContact?.email
  const phone = primaryContact?.phone

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleEmailClick = () => {
    if (email) {
      // Opens user's default email client
      window.location.href = `mailto:${email}?subject=Regarding ${lead.company_data.name}`
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-zinc-50 border-b border-zinc-200">
      {/* Call Button - uses native tel: link */}
      {phone && (
        <a href={`tel:${phone}`} className="inline-flex">
          <Button variant="outline" size="sm" className="gap-2">
            <Phone className="h-4 w-4" />
            Call Now
          </Button>
        </a>
      )}

      {/* Email Button */}
      {email && (
        <Button variant="outline" size="sm" className="gap-2" onClick={handleEmailClick}>
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      )}

      {/* Copy Email */}
      {email && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => copyToClipboard(email, 'email')}
        >
          {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copiedField === 'email' ? 'Copied!' : 'Copy Email'}
        </Button>
      )}

      {/* Copy Phone */}
      {phone && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => copyToClipboard(phone, 'phone')}
        >
          {copiedField === 'phone' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copiedField === 'phone' ? 'Copied!' : 'Copy Phone'}
        </Button>
      )}
    </div>
  )
}
```

**2. Lead Status Dropdown**
`src/components/leads/lead-status-dropdown.tsx`

```tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-100 text-orange-700' },
  { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
]

interface LeadStatusDropdownProps {
  leadId: string
  currentStatus: string
  onStatusChange: (newStatus: string) => void
}

export function LeadStatusDropdown({ leadId, currentStatus, onStatusChange }: LeadStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const current = STATUSES.find(s => s.value === currentStatus) || STATUSES[0]

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        onStatusChange(newStatus)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${current.color}`}
      >
        {current.label}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 min-w-[140px]">
            {STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                {status.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

**3. Lead Notes Panel**
`src/components/leads/lead-notes-panel.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'

interface Note {
  id: string
  content: string
  note_type: string
  created_at: string
  users?: { full_name: string }
}

interface LeadNotesPanelProps {
  leadId: string
}

export function LeadNotesPanel({ leadId }: LeadNotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [leadId])

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    setIsAdding(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, note_type: noteType })
      })

      if (res.ok) {
        setNewNote('')
        fetchNotes()
      }
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const NOTE_TYPES = [
    { value: 'general', label: 'General' },
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Notes
      </h3>

      {/* Add Note Form */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-md"
          >
            {NOTE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md resize-none"
          rows={3}
        />
        <Button
          onClick={addNote}
          disabled={isAdding || !newNote.trim()}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-zinc-500">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-3 bg-zinc-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-zinc-500 uppercase">
                  {note.note_type}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatDateTime(note.created_at)}
                </span>
              </div>
              <p className="text-sm text-zinc-900">{note.content}</p>
              {note.users?.full_name && (
                <p className="text-xs text-zinc-500 mt-1">— {note.users.full_name}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

**4. API Routes**

`src/app/api/leads/[id]/status/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()
    const supabase = await createClient()

    // Update lead status
    const { error } = await supabase
      .from('leads')
      .update({
        workflow_status: status,
        last_contacted_at: ['contacted', 'qualified', 'proposal'].includes(status)
          ? new Date().toISOString()
          : undefined
      })
      .eq('id', params.id)
      .eq('workspace_id', user.workspace_id)

    if (error) throw error

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: params.id,
      workspace_id: user.workspace_id,
      user_id: user.id,
      activity_type: 'status_change',
      description: `Status changed to ${status}`,
      metadata: { new_status: status }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating lead status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
```

`src/app/api/leads/[id]/notes/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: notes, error } = await supabase
      .from('lead_notes')
      .select('*, users(full_name)')
      .eq('lead_id', params.id)
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, note_type } = await req.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: params.id,
        workspace_id: user.workspace_id,
        user_id: user.id,
        content,
        note_type: note_type || 'general'
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: params.id,
      workspace_id: user.workspace_id,
      user_id: user.id,
      activity_type: 'note_added',
      description: `Added ${note_type || 'general'} note`
    })

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('Error adding note:', error)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
```

---

## PHASE 42: Lead Search, Filter & Organization
**Build Time: 2 days** | **No new APIs needed**

### Database Migration
Add to: `supabase/migrations/20260124000002_lead_search.sql`

```sql
-- Full-text search on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Trigger to update search text
CREATE OR REPLACE FUNCTION update_lead_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := LOWER(
    COALESCE(NEW.company_data->>'name', '') || ' ' ||
    COALESCE(NEW.company_data->>'domain', '') || ' ' ||
    COALESCE(NEW.company_data->'location'->>'city', '') || ' ' ||
    COALESCE(NEW.company_data->'location'->>'state', '') || ' ' ||
    COALESCE(NEW.company_data->>'industry', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_search_text_trigger
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_search_text();

-- Index for search
CREATE INDEX IF NOT EXISTS idx_leads_search_text ON leads USING GIN(to_tsvector('english', search_text));

-- Saved filters
CREATE TABLE IF NOT EXISTS saved_lead_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_lead_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON saved_lead_filters
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
```

### Files to Create

**Lead Search Bar**
`src/components/leads/lead-search-bar.tsx`

```tsx
'use client'

import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface LeadSearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function LeadSearchBar({ onSearch, placeholder = 'Search leads...' }: LeadSearchBarProps) {
  const [query, setQuery] = useState('')

  const debouncedSearch = useDebounce((value: string) => {
    onSearch(value)
  }, 300)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
```

**Lead Filters Panel**
`src/components/leads/lead-filters-panel.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Filters {
  status?: string[]
  intentScore?: string[]
  source?: string[]
  dateRange?: { start?: string; end?: string }
}

interface LeadFiltersPanelProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const INTENT_OPTIONS = [
  { value: 'hot', label: '🔥 Hot' },
  { value: 'warm', label: '⚡ Warm' },
  { value: 'cold', label: '❄️ Cold' },
]

const SOURCE_OPTIONS = [
  { value: 'datashopper', label: 'DataShopper' },
  { value: 'audience_labs', label: 'Audience Labs' },
  { value: 'csv', label: 'CSV Upload' },
  { value: 'manual', label: 'Manual' },
]

export function LeadFiltersPanel({ filters, onChange }: LeadFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleFilter = (key: keyof Filters, value: string) => {
    const current = (filters[key] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: updated.length ? updated : undefined })
  }

  const clearFilters = () => {
    onChange({})
  }

  const activeFilterCount = Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length : true)).length

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-xs">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-lg shadow-lg border border-zinc-200 p-4 w-72">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-zinc-900">Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-1">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('status', option.value)}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      filters.status?.includes(option.value)
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intent Score */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Intent Score</label>
              <div className="flex flex-wrap gap-1">
                {INTENT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('intentScore', option.value)}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      filters.intentScore?.includes(option.value)
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Source</label>
              <div className="flex flex-wrap gap-1">
                {SOURCE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('source', option.value)}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      filters.source?.includes(option.value)
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => onChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                  className="flex-1 px-2 py-1 text-sm border border-zinc-200 rounded"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => onChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                  className="flex-1 px-2 py-1 text-sm border border-zinc-200 rounded"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

---

## PHASE 43: Export & Simple Integrations
**Build Time: 2 days** | **Uses existing Resend + webhooks**

### What We're Building (No Complex OAuth)
- CSV export with column selection (already have this - enhance it)
- Webhook integration for Zapier (simple POST to webhook URL)
- API keys for businesses to fetch their leads

Skip HubSpot OAuth - too complex. Instead, offer webhook/Zapier which connects to 5000+ apps including HubSpot.

### Database Migration
`supabase/migrations/20260124000003_api_keys.sql`

```sql
-- API keys for business access
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '["leads:read"]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook subscriptions
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['lead.created'],
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace isolation" ON api_keys
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workspace isolation" ON webhook_subscriptions
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));
```

### Files to Create

**Webhook Service**
`src/lib/services/webhook.service.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function triggerWebhooks(
  workspaceId: string,
  event: string,
  data: any
) {
  const supabase = await createClient()

  const { data: webhooks } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .contains('events', [event])

  if (!webhooks?.length) return

  const payload = {
    event,
    data,
    timestamp: new Date().toISOString()
  }

  for (const webhook of webhooks) {
    try {
      const signature = webhook.secret
        ? crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex')
        : undefined

      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signature && { 'X-Webhook-Signature': signature })
        },
        body: JSON.stringify(payload)
      })

      // Update last triggered
      await supabase
        .from('webhook_subscriptions')
        .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
        .eq('id', webhook.id)
    } catch (error) {
      // Increment failure count
      await supabase
        .from('webhook_subscriptions')
        .update({ failure_count: (webhook.failure_count || 0) + 1 })
        .eq('id', webhook.id)
    }
  }
}
```

**API Key Management Page**
`src/app/(dashboard)/settings/api-keys/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Key, Copy, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    const res = await fetch('/api/settings/api-keys')
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys || [])
    }
  }

  const createKey = async () => {
    if (!newKeyName.trim()) return
    setIsCreating(true)

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      })

      if (res.ok) {
        const data = await res.json()
        setNewlyCreatedKey(data.key) // Show this once, then it's gone
        setNewKeyName('')
        fetchKeys()
      }
    } finally {
      setIsCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    await fetch(`/api/settings/api-keys/${id}`, { method: 'DELETE' })
    fetchKeys()
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">API Keys</h1>

      {/* Create new key */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New API Key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production, Zapier)"
            className="flex-1 px-3 py-2 border border-zinc-200 rounded-md"
          />
          <Button onClick={createKey} disabled={isCreating || !newKeyName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>

        {newlyCreatedKey && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800 font-medium mb-2">
              Copy your API key now. You won't be able to see it again!
            </p>
            <code className="block p-2 bg-white rounded text-sm break-all">
              {newlyCreatedKey}
            </code>
          </div>
        )}
      </div>

      {/* Existing keys */}
      <div className="bg-white rounded-lg border border-zinc-200">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold">Your API Keys</h2>
        </div>

        {keys.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No API keys yet. Create one above.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {keys.map((key) => (
              <div key={key.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{key.name}</span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    <code>{key.key_prefix}...</code>
                    {key.last_used_at && (
                      <span className="ml-2">
                        Last used: {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteKey(key.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Usage Example */}
      <div className="mt-6 bg-zinc-900 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-3">Example Usage</h3>
        <pre className="text-sm text-zinc-300 overflow-x-auto">
{`curl -X GET \\
  https://yourdomain.com/api/v1/leads \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        </pre>
      </div>
    </div>
  )
}
```

---

## PHASE 44: Notifications
**Build Time: 2 days** | **Uses existing Resend + Inngest**

### Database Migration
`supabase/migrations/20260124000004_notifications.sql`

```sql
-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
```

### Files to Create

**Notification Bell**
`src/components/notifications/notification-bell.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: any
  read_at: string | null
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications?limit=10')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    }
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    fetchNotifications()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-lg shadow-lg border border-zinc-200 w-80">
            <div className="p-3 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read_at && markAsRead(notification.id)}
                    className={`p-3 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 ${
                      !notification.read_at ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-900">
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-sm text-zinc-600 mt-0.5">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

**Inngest Function for Lead Notifications**
`src/inngest/functions/send-lead-notification.ts`

```typescript
import { inngest } from '../client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendLeadNotification = inngest.createFunction(
  { id: 'send-lead-notification' },
  { event: 'lead/created' },
  async ({ event, step }) => {
    const { lead, workspaceId } = event.data

    // Get workspace users with notification preferences
    const users = await step.run('get-users', async () => {
      // This would query your database
      return [] // Implement: get users for workspace with email_new_leads = true
    })

    for (const user of users) {
      // Create in-app notification
      await step.run(`create-notification-${user.id}`, async () => {
        // Insert into notifications table
      })

      // Send email if enabled
      if (user.notification_preferences?.email_new_leads) {
        await step.run(`send-email-${user.id}`, async () => {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: user.email,
            subject: `New Lead: ${lead.company_data?.name || 'Unknown Company'}`,
            html: `
              <h2>You received a new lead!</h2>
              <p><strong>Company:</strong> ${lead.company_data?.name}</p>
              <p><strong>Industry:</strong> ${lead.company_data?.industry || 'N/A'}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/leads">View Lead</a></p>
            `
          })
        })
      }
    }
  }
)
```

---

## PHASE 45: Mobile Responsive
**Build Time: 1-2 days** | **No APIs needed - just CSS**

### Key Fixes

**1. Sidebar - Convert to hamburger on mobile**
Update `src/components/layout/sidebar.tsx`

```tsx
// Add state for mobile menu
const [isMobileOpen, setIsMobileOpen] = useState(false)

// Mobile toggle button (add to header on mobile)
<button
  className="lg:hidden p-2"
  onClick={() => setIsMobileOpen(!isMobileOpen)}
>
  <Menu className="h-6 w-6" />
</button>

// Sidebar wrapper
<aside className={`
  fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform
  lg:translate-x-0 lg:static
  ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
`}>
```

**2. Lead Table - Cards on mobile**
Update the leads table to show cards on mobile:

```tsx
// In leads-table.tsx
<div className="hidden md:block">
  {/* Table view for desktop */}
  <table>...</table>
</div>

<div className="md:hidden space-y-3">
  {/* Card view for mobile */}
  {leads.map(lead => (
    <div key={lead.id} className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{lead.company_data?.name}</h3>
          <p className="text-sm text-zinc-500">{lead.company_data?.industry}</p>
        </div>
        <IntentBadge score={lead.intent_data?.score} />
      </div>
      <div className="mt-3 flex gap-2">
        {lead.contact_data?.contacts?.[0]?.phone && (
          <a href={`tel:${lead.contact_data.contacts[0].phone}`} className="btn-sm">
            Call
          </a>
        )}
        {lead.contact_data?.contacts?.[0]?.email && (
          <a href={`mailto:${lead.contact_data.contacts[0].email}`} className="btn-sm">
            Email
          </a>
        )}
      </div>
    </div>
  ))}
</div>
```

**3. Touch targets - Minimum 44px**
```css
/* Add to global CSS */
@media (max-width: 768px) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## PHASE 47: Team Access
**Build Time: 2-3 days** | **Uses existing user roles**

### Database Migration
`supabase/migrations/20260124000005_team_invites.sql`

```sql
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON team_invitations(token) WHERE accepted_at IS NULL;

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view invitations" ON team_invitations
  FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage invitations" ON team_invitations
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM users
    WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
```

### Files to Create

**Team Settings Page**
`src/app/(dashboard)/settings/team/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Trash2, Crown, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: string
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User,
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    const res = await fetch('/api/team')
    if (res.ok) {
      const data = await res.json()
      setMembers(data.members || [])
      setInvitations(data.invitations || [])
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail) return
    setIsInviting(true)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })

      if (res.ok) {
        setInviteEmail('')
        fetchTeam()
      }
    } finally {
      setIsInviting(false)
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this team member?')) return
    await fetch(`/api/team/${userId}`, { method: 'DELETE' })
    fetchTeam()
  }

  const cancelInvite = async (inviteId: string) => {
    await fetch(`/api/team/invite/${inviteId}`, { method: 'DELETE' })
    fetchTeam()
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
        <Users className="h-6 w-6" />
        Team Members
      </h1>

      {/* Invite Form */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 px-3 py-2 border border-zinc-200 rounded-md"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-md"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={sendInvite} disabled={isInviting || !inviteEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Invite
          </Button>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">Pending Invitations</h3>
          {invitations.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between py-2">
              <span className="text-yellow-800">{invite.email}</span>
              <button
                onClick={() => cancelInvite(invite.id)}
                className="text-yellow-700 hover:text-yellow-900"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-lg border border-zinc-200">
        <div className="divide-y divide-zinc-200">
          {members.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role]
            return (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                    <span className="text-zinc-600 font-medium">
                      {member.full_name?.[0] || member.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{member.full_name || member.email}</div>
                    <div className="text-sm text-zinc-500">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-zinc-600">
                    <RoleIcon className="h-4 w-4" />
                    {member.role}
                  </span>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

---

## PHASE 48: Onboarding Wizard
**Build Time: 1-2 days** | **No APIs needed**

### Simple Setup Checklist (no Intro.js needed)

`src/components/onboarding/setup-checklist.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  href: string
}

export function SetupChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    const res = await fetch('/api/onboarding/progress')
    if (res.ok) {
      const data = await res.json()
      setItems([
        { id: 'profile', label: 'Complete your profile', completed: data.hasProfile, href: '/settings/profile' },
        { id: 'preferences', label: 'Set lead preferences', completed: data.hasPreferences, href: '/settings/preferences' },
        { id: 'query', label: 'Create your first query', completed: data.hasQuery, href: '/queries/new' },
        { id: 'payment', label: 'Add payment method', completed: data.hasPayment, href: '/settings/billing' },
      ])
    }
    setIsLoading(false)
  }

  const completedCount = items.filter(i => i.completed).length
  const progress = items.length ? (completedCount / items.length) * 100 : 0

  if (isLoading) return null
  if (progress === 100) return null // Hide when complete

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900">Get Started</h3>
        <span className="text-sm text-zinc-500">{completedCount}/{items.length} complete</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-zinc-100 rounded-full mb-4">
        <div
          className="h-2 bg-emerald-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50"
          >
            <div className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-zinc-300" />
              )}
              <span className={item.completed ? 'text-zinc-500 line-through' : 'text-zinc-900'}>
                {item.label}
              </span>
            </div>
            {!item.completed && <ChevronRight className="h-4 w-4 text-zinc-400" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
```

---

## Summary: What to Build and In What Order

### Week 1: Core Lead Actions
1. **Phase 41** - Lead Action Center (status, notes, call/email buttons)
2. **Phase 42** - Search & Filter

### Week 2: Engagement
3. **Phase 44** - Notifications (using Resend you already have)
4. **Phase 45** - Mobile Responsive fixes

### Week 3: Collaboration
5. **Phase 47** - Team Access
6. **Phase 48** - Onboarding Checklist

### Week 4: Integrations
7. **Phase 43** - Webhooks + API Keys (skip HubSpot OAuth)

---

## What We're Skipping (Too Complex)

| Feature | Why Skip | Alternative |
|---------|----------|-------------|
| Twilio SMS/Voice | Complex setup, costs money | Use native `tel:` links + Resend for email |
| HubSpot OAuth | Complex OAuth flow | Use Zapier webhooks instead |
| NeverBounce/SmartyStreets | External API complexity | Manual quality review |
| Lead Marketplace/Auctions | Very complex real-time system | Future phase |
| AI Features | Requires ML infrastructure | Future phase |

---

## Next Steps

1. Run the migration for Phase 41
2. Create the lead action components
3. Update the lead detail panel to include the new components
4. Test on mobile

Ready to start building?

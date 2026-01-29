# Custom CRM Technical Specification

**Target Quality**: 95-100% match to Twenty CRM UI/UX
**Timeline**: 3 weeks (Week 1 checkpoint for quality validation)
**Stack**: Next.js 15 + React 18 + shadcn/ui + TanStack Table + Supabase

---

## 1. ARCHITECTURE OVERVIEW

### Component Structure

```
src/app/crm/
├── leads/                          # Main leads CRM view
│   ├── page.tsx                    # Leads table view
│   ├── [id]/                       # Lead detail view
│   │   └── page.tsx
│   └── components/
│       ├── LeadsDataTable.tsx      # Main table component
│       ├── LeadsTableColumns.tsx   # Column definitions
│       ├── LeadDetailPanel.tsx     # Right drawer detail view
│       ├── LeadStatusBadge.tsx     # Status badge component
│       ├── LeadBulkActions.tsx     # Bulk action toolbar
│       └── LeadFilters.tsx         # Filter dropdowns
├── companies/                      # Companies view (future)
├── components/                     # Shared CRM components
│   ├── DataTable.tsx              # Reusable table wrapper
│   ├── StatusBadge.tsx            # Generic status badge
│   ├── AvatarGroup.tsx            # Stacked avatars
│   ├── URLPill.tsx                # URL display component
│   ├── InlineEdit.tsx             # Inline editing wrapper
│   └── CRMSidebar.tsx             # Navigation sidebar
└── lib/
    ├── crm-state.ts               # Zustand state management
    └── crm-utils.ts               # Utility functions

src/components/ui/                  # shadcn/ui components
└── (extend with CRM-specific variants)
```

---

## 2. WEEK 1 DELIVERABLES: LEADS TABLE VIEW

### 2.1 Main Table Component

**File**: `src/app/crm/leads/page.tsx`

**Features**:
- Server-side data fetching with React Query
- Pagination (20/50/100 rows per page)
- Multi-sort support
- Column visibility toggle
- Bulk selection
- Row actions menu
- Search/filter bar

**Implementation Pattern**:
```tsx
// Server Component
export default async function LeadsPage() {
  // Fetch initial data server-side
  const initialData = await getLeadsForWorkspace()

  return (
    <div className="flex h-screen">
      <CRMSidebar />
      <main className="flex-1 overflow-hidden">
        <LeadsDataTable initialData={initialData} />
      </main>
    </div>
  )
}
```

### 2.2 Column Configuration

**Columns** (based on existing `leads` table schema):

| Column | Type | Width | Sortable | Filterable | Features |
|--------|------|-------|----------|------------|----------|
| Select | Checkbox | 40px | No | No | Bulk selection |
| Status | Badge | 120px | Yes | Yes | Colored badge with dot |
| Lead Name | Text+Avatar | 240px | Yes | Yes | First + Last name with avatar |
| Email | Email | 220px | Yes | Yes | Verified badge if valid |
| Phone | Phone | 140px | No | Yes | Formatted display |
| Company | Text+Logo | 180px | Yes | Yes | Company name with logo |
| Job Title | Text | 160px | Yes | Yes | Truncated with tooltip |
| Industry | Tag | 140px | Yes | Yes | Filter by industry |
| State | Tag | 80px | Yes | Yes | US state code |
| Company Size | Text | 100px | Yes | Yes | Employee range |
| Intent Score | Progress | 100px | Yes | Yes | 0-100 with color coding |
| Freshness | Progress | 100px | Yes | Yes | 0-100 with decay indicator |
| Price | Currency | 100px | Yes | Yes | Marketplace price |
| Owner | Avatar | 100px | Yes | Yes | Assigned user |
| Created | Date | 120px | Yes | Yes | Relative time + absolute |
| Actions | Menu | 60px | No | No | Edit, View, Delete |

### 2.3 Status Badge Component

**Design Specs** (matching Twenty):
```tsx
// StatusBadge.tsx
interface StatusBadgeProps {
  status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost'
  size?: 'sm' | 'md'
  variant?: 'solid' | 'outline'
}

// Styling (Tailwind):
- Height: 20px (sm) / 24px (md)
- Padding: px-2 (8px horizontal)
- Border radius: rounded (4px)
- Dot size: 4px with rounded-full
- Gap: gap-1 (4px between dot and text)
- Font: text-sm (14px) with font-medium (500)

// Color Mapping:
new → blue (bg-blue-50 text-blue-700)
contacted → yellow (bg-yellow-50 text-yellow-700)
qualified → purple (bg-purple-50 text-purple-700)
won → green (bg-green-50 text-green-700)
lost → gray (bg-gray-50 text-gray-700)
```

### 2.4 Avatar Component

**Design Specs**:
```tsx
// LeadAvatar.tsx
interface LeadAvatarProps {
  name: string
  email?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

// Sizes:
xs: 16px (h-4 w-4)
sm: 24px (h-6 w-6)
md: 32px (h-8 w-8)
lg: 40px (h-10 w-10)

// Fallback: Generate from initials + email hash
- Background: Radix UI color from hash
- Text: First + Last initial (max 2 chars)
- Font: text-xs (12px) with font-semibold (600)

// AvatarGroup (stacked):
- Max 3 avatars visible + "+N more"
- Overlap: -mr-2 (negative margin)
- Z-index: reverse order for proper stacking
- Border: ring-2 ring-background for separation
```

### 2.5 URL Pill Component

**Design Specs**:
```tsx
// URLPill.tsx
interface URLPillProps {
  url: string
  maxWidth?: number
}

// Styling:
- Height: 24px (h-6)
- Padding: px-2 (8px horizontal)
- Border radius: rounded-full (999px - pill shape)
- Border: border border-border
- Background: bg-muted/50 hover:bg-muted/80
- Text: text-xs (12px) with truncate
- Icon: ExternalLink (12px) on hover
- Opens in new tab with security attributes
```

### 2.6 Inline Editing

**Pattern** (simplified from Twenty's portal approach):
```tsx
// InlineEditCell.tsx
- Display mode: onClick → Edit mode
- Edit mode: Input with autofocus
- Save: onBlur or Enter key
- Cancel: Escape key
- Optimistic update with React Query mutation
- Error handling with toast notification
- Uses @floating-ui for positioning (if overflow)
```

### 2.7 Bulk Actions Toolbar

**Actions**:
```tsx
// LeadBulkActions.tsx
- Update Status → Dropdown selector
- Assign Owner → User picker
- Add Tags → Tag selector
- Export to CSV → Download button
- Delete → Confirmation dialog

// Shows when rows selected:
- Fixed position at bottom of table
- Slide up animation (framer-motion)
- Shows count: "3 leads selected"
- Clear selection button
```

### 2.8 Search & Filter Bar

**Components**:
```tsx
// LeadFilters.tsx
1. Search Input
   - Full-text search (name, email, company)
   - Debounced (300ms)
   - Clear button when active

2. Quick Filters (Pills)
   - Status: All | New | Contacted | Qualified
   - Verified Email: Toggle
   - Has Phone: Toggle
   - Active pills show count

3. Advanced Filters (Dropdown)
   - Industry: Multi-select
   - State: Multi-select
   - Company Size: Range
   - Intent Score: Range slider
   - Freshness: Range slider
   - Date Range: Date picker
   - Price Range: Number inputs

4. View Options
   - Columns: Show/hide picker
   - Density: Comfortable | Compact
   - Group By: None | Status | Owner
```

---

## 3. DATA LAYER

### 3.1 State Management (Zustand)

**File**: `src/lib/crm-state.ts`

```typescript
interface CRMStore {
  // Selection
  selectedLeadIds: string[]
  setSelectedLeads: (ids: string[]) => void
  clearSelection: () => void

  // Filters
  filters: LeadFilters
  setFilters: (filters: Partial<LeadFilters>) => void
  clearFilters: () => void

  // View preferences
  columnVisibility: Record<string, boolean>
  setColumnVisibility: (columns: Record<string, boolean>) => void

  // Detail panel
  detailPanelOpen: boolean
  detailPanelLeadId: string | null
  openDetailPanel: (leadId: string) => void
  closeDetailPanel: () => void

  // Bulk actions
  bulkActionInProgress: boolean
  setBulkActionInProgress: (inProgress: boolean) => void
}
```

### 3.2 React Query Hooks

**File**: `src/lib/hooks/use-leads.ts`

```typescript
// Fetch leads with filters/pagination
export function useLeads(filters: LeadFilters, pagination: Pagination) {
  return useQuery({
    queryKey: ['leads', filters, pagination],
    queryFn: () => fetchLeads(filters, pagination),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}

// Update lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string; updates: Partial<Lead> }) =>
      updateLead(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead updated')
    },
    onError: () => {
      toast.error('Failed to update lead')
    },
  })
}

// Bulk update mutation
export function useBulkUpdateLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { ids: string[]; updates: Partial<Lead> }) =>
      bulkUpdateLeads(data.ids, data.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(`${variables.ids.length} leads updated`)
    },
  })
}
```

### 3.3 API Routes

**File**: `src/app/api/crm/leads/route.ts`

```typescript
// GET /api/crm/leads
export async function GET(request: NextRequest) {
  // 1. Auth check
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  // 2. Parse & validate filters
  const filters = parseLeadFilters(request.nextUrl.searchParams)

  // 3. Fetch via repository
  const repo = new LeadRepository()
  const { leads, total } = await repo.findByWorkspace(
    user.workspace_id,
    filters
  )

  // 4. Return with pagination metadata
  return NextResponse.json({
    leads,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  })
}

// PATCH /api/crm/leads/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  const updates = await request.json()
  const schema = leadUpdateSchema.parse(updates)

  const repo = new LeadRepository()
  const lead = await repo.update(params.id, schema, user.workspace_id)

  // Audit log
  await auditService.log({
    userId: user.id,
    action: 'update',
    resourceType: 'lead',
    resourceId: params.id,
    changes: updates,
  })

  return NextResponse.json({ lead })
}

// POST /api/crm/leads/bulk
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  const { ids, action, data } = await request.json()

  // Validate bulk action
  const schema = bulkActionSchema.parse({ ids, action, data })

  const repo = new LeadRepository()
  await repo.bulkUpdate(schema.ids, schema.data, user.workspace_id)

  return NextResponse.json({ success: true, count: ids.length })
}
```

### 3.4 Repository Pattern

**File**: `src/lib/repositories/lead.repository.ts`

```typescript
export class LeadRepository {
  private supabase = createClient()

  async findByWorkspace(
    workspaceId: string,
    filters: LeadFilters
  ): Promise<{ leads: Lead[]; total: number }> {
    let query = this.supabase
      .from('leads')
      .select('*, assigned_user:users(id, full_name, email)', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('is_sold', false) // Only show unsold marketplace leads OR workspace leads

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.industries?.length) {
      query = query.in('company_industry', filters.industries)
    }

    if (filters.intentScoreMin) {
      query = query.gte('intent_score_calculated', filters.intentScoreMin)
    }

    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,` +
        `last_name.ilike.%${filters.search}%,` +
        `email.ilike.%${filters.search}%,` +
        `company_name.ilike.%${filters.search}%`
      )
    }

    // Sorting
    if (filters.orderBy) {
      query = query.order(filters.orderBy, {
        ascending: filters.orderDirection === 'asc',
      })
    }

    // Pagination
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) throw new DatabaseError(error.message)

    return {
      leads: data as Lead[],
      total: count || 0,
    }
  }

  async update(
    leadId: string,
    updates: Partial<Lead>,
    workspaceId: string
  ): Promise<Lead> {
    const { data, error } = await this.supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .eq('workspace_id', workspaceId) // Security: workspace isolation
      .select()
      .single()

    if (error) throw new DatabaseError(error.message)
    return data as Lead
  }

  async bulkUpdate(
    leadIds: string[],
    updates: Partial<Lead>,
    workspaceId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .update(updates)
      .in('id', leadIds)
      .eq('workspace_id', workspaceId)

    if (error) throw new DatabaseError(error.message)
  }
}
```

---

## 4. STYLING SYSTEM

### 4.1 Color Palette (extend shadcn/ui theme)

**File**: `tailwind.config.ts`

```typescript
// Add CRM-specific colors
colors: {
  // Status colors (using Radix UI scales)
  status: {
    new: 'hsl(var(--status-new))',
    contacted: 'hsl(var(--status-contacted))',
    qualified: 'hsl(var(--status-qualified))',
    won: 'hsl(var(--status-won))',
    lost: 'hsl(var(--status-lost))',
  },

  // Intent score colors (gradient)
  intent: {
    low: 'hsl(var(--intent-low))',      // 0-30: red
    medium: 'hsl(var(--intent-medium))', // 31-60: yellow
    high: 'hsl(var(--intent-high))',    // 61-100: green
  },
}

// CSS Variables (globals.css)
:root {
  --status-new: 217 91% 60%;      /* Blue */
  --status-contacted: 43 96% 56%; /* Yellow */
  --status-qualified: 262 83% 58%; /* Purple */
  --status-won: 142 76% 36%;      /* Green */
  --status-lost: 215 14% 34%;     /* Gray */

  --intent-low: 0 84% 60%;        /* Red */
  --intent-medium: 43 96% 56%;    /* Yellow */
  --intent-high: 142 76% 36%;     /* Green */
}
```

### 4.2 Spacing System (4px base)

```typescript
// Extend Tailwind spacing (already uses 4px)
spacing: {
  // Additional CRM-specific spacing
  'table-cell': '8px',           // Cell padding
  'table-header': '32px',        // Header height
  'table-row': '48px',           // Row height (comfortable)
  'table-row-compact': '36px',   // Row height (compact)
}
```

### 4.3 Component Variants

**Extend shadcn/ui components**:

```tsx
// components/ui/badge.tsx - Add CRM variants
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 h-5 text-sm font-medium",
  {
    variants: {
      variant: {
        // Existing variants...
        status: "bg-status-{color}/10 text-status-{color}",
      },
    },
  }
)

// Add status dot
<Badge variant="status">
  <span className="h-1 w-1 rounded-full bg-current" />
  Status Text
</Badge>
```

---

## 5. PERFORMANCE OPTIMIZATIONS

### 5.1 Virtual Scrolling

**Library**: `@tanstack/react-virtual`

```tsx
// For tables with 1000+ rows
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: leads.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 48, // Row height
  overscan: 5, // Buffer rows
})
```

### 5.2 Memoization

```tsx
// Memoize expensive operations
const columns = useMemo(() => createColumns(), [])
const sortedData = useMemo(() => sortData(data, sorting), [data, sorting])

// Memoize cell renderers
const Cell = memo(({ row, column }: CellProps) => {
  return <div>{/* Cell content */}</div>
})
```

### 5.3 Debouncing

```tsx
// Search input
const debouncedSearch = useDebouncedValue(searchQuery, 300)

// Filter changes
const debouncedFilters = useDebouncedValue(filters, 500)
```

### 5.4 Database Indexes

**Required indexes for performance**:

```sql
-- Lead querying indexes
CREATE INDEX idx_leads_workspace_status ON leads(workspace_id, status);
CREATE INDEX idx_leads_workspace_created ON leads(workspace_id, created_at DESC);
CREATE INDEX idx_leads_intent_score ON leads(intent_score_calculated DESC);
CREATE INDEX idx_leads_freshness ON leads(freshness_score DESC);
CREATE INDEX idx_leads_company_industry ON leads(company_industry);
CREATE INDEX idx_leads_state ON leads(state);

-- Full-text search
CREATE INDEX idx_leads_search ON leads USING gin(
  to_tsvector('english',
    coalesce(first_name, '') || ' ' ||
    coalesce(last_name, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(company_name, '')
  )
);
```

---

## 6. ACCESSIBILITY

### 6.1 Keyboard Navigation

- **Table**: Arrow keys for cell navigation
- **Row selection**: Space to select, Shift+Space for range
- **Actions menu**: Tab to focus, Enter to open, Arrow keys to navigate
- **Inline edit**: Enter to edit, Escape to cancel, Tab to next field
- **Bulk actions**: Keyboard shortcuts (Cmd+A for select all)

### 6.2 ARIA Labels

```tsx
<Table aria-label="Leads table">
  <TableHeader>
    <TableRow>
      <TableHead aria-sort="ascending">Name</TableHead>
    </TableRow>
  </TableHeader>
</Table>

<Button aria-label="Bulk actions" aria-expanded={isOpen}>
  Actions
</Button>
```

### 6.3 Screen Reader Support

- Announce row selection changes
- Announce filter application
- Announce sort changes
- Provide context for icon-only buttons

---

## 7. TESTING STRATEGY

### 7.1 Unit Tests

```typescript
// LeadStatusBadge.test.tsx
describe('LeadStatusBadge', () => {
  it('renders correct status color', () => {
    render(<LeadStatusBadge status="qualified" />)
    expect(screen.getByText('Qualified')).toHaveClass('bg-purple-50')
  })

  it('shows status dot', () => {
    render(<LeadStatusBadge status="new" />)
    const dot = screen.getByRole('presentation')
    expect(dot).toHaveClass('rounded-full')
  })
})
```

### 7.2 Integration Tests

```typescript
// LeadsTable.test.tsx
describe('LeadsTable', () => {
  it('filters leads by status', async () => {
    render(<LeadsTable />)

    await userEvent.click(screen.getByText('Status'))
    await userEvent.click(screen.getByText('Qualified'))

    await waitFor(() => {
      expect(screen.getAllByText('Qualified')).toHaveLength(5)
    })
  })

  it('selects multiple leads for bulk action', async () => {
    render(<LeadsTable />)

    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[1])
    await userEvent.click(checkboxes[2])

    expect(screen.getByText('2 leads selected')).toBeInTheDocument()
  })
})
```

### 7.3 E2E Tests (Playwright)

```typescript
// leads.spec.ts
test('complete lead workflow', async ({ page }) => {
  await page.goto('/crm/leads')

  // Search for lead
  await page.fill('[placeholder="Search leads..."]', 'John Doe')
  await page.waitForResponse('/api/crm/leads*')

  // Open detail panel
  await page.click('text="John Doe"')
  await expect(page.locator('[role="dialog"]')).toBeVisible()

  // Update status
  await page.click('text="New"')
  await page.click('text="Contacted"')
  await expect(page.locator('text="Contacted"')).toBeVisible()
})
```

---

## 8. SECURITY CONSIDERATIONS

### 8.1 RLS Policies

```sql
-- Leads table RLS
CREATE POLICY "Users can view leads in their workspace" ON leads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads in their workspace" ON leads
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );
```

### 8.2 Input Validation

```typescript
// Zod schemas for all mutations
const leadUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'won', 'lost']).optional(),
  assigned_user_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(20).optional(),
})

const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['update_status', 'assign', 'add_tags', 'delete']),
  data: z.record(z.any()),
})
```

### 8.3 Rate Limiting

```typescript
// Apply to all CRM endpoints
const rateLimitResult = await withRateLimit(
  request,
  'crm-operations',
  `user:${user.id}`
)
// 200 requests/minute per user
```

---

## 9. MIGRATION PLAN

### 9.1 Database Changes

**New columns for CRM features**:

```sql
-- Add CRM-specific fields to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS crm_stage VARCHAR(50) DEFAULT 'new';

-- Create indexes
CREATE INDEX idx_leads_assigned_user ON leads(assigned_user_id);
CREATE INDEX idx_leads_tags ON leads USING gin(tags);
CREATE INDEX idx_leads_crm_stage ON leads(crm_stage);
```

### 9.2 Data Seeding

```sql
-- Create test data for development
INSERT INTO leads (workspace_id, first_name, last_name, email, company_name, status, intent_score_calculated, freshness_score)
VALUES
  ('workspace-1', 'John', 'Doe', 'john@acme.com', 'Acme Corp', 'new', 85, 95),
  ('workspace-1', 'Jane', 'Smith', 'jane@techco.com', 'TechCo', 'contacted', 72, 88),
  -- ... 50+ test records
```

---

## 10. WEEK 1 SUCCESS CRITERIA

### Quality Checkpoints

**UI/UX** (95%+ match to Twenty):
- ✅ Table matches Twenty's visual design
- ✅ Status badges have colored dots
- ✅ Avatars with proper fallbacks
- ✅ URL pills styled correctly
- ✅ Spacing/typography matches
- ✅ Hover states smooth and responsive
- ✅ Loading states with skeletons
- ✅ Empty states with helpful messaging

**Functionality**:
- ✅ Sorting on all columns
- ✅ Multi-column sorting (shift+click)
- ✅ Filtering by status, industry, state
- ✅ Search across name, email, company
- ✅ Bulk selection (checkbox + shift-click)
- ✅ Inline editing (at least 3 fields)
- ✅ Row actions menu
- ✅ Pagination with page size selector

**Performance**:
- ✅ Initial load < 2 seconds
- ✅ Filter/sort response < 500ms
- ✅ Smooth scrolling (60fps)
- ✅ No layout shifts

**Security**:
- ✅ RLS policies tested
- ✅ Input validation working
- ✅ Rate limiting applied
- ✅ Audit logging enabled

---

## 11. WEEKS 2-3 ROADMAP

### Week 2: Detail Panel & Advanced Features

- Lead detail right drawer (matching Twenty's 500px width)
- Activity timeline component
- Notes section with rich text editor
- Related records (company → other leads)
- Tags management UI
- Assignment UI with user picker
- Status workflow progression
- Email/call logging

### Week 3: Views & Analytics

- Kanban view (group by status)
- List view (compact alternative)
- Saved filters/views
- Column presets
- Export functionality (CSV, Excel)
- Analytics dashboard (conversion rates, pipeline value)
- Team activity feed
- Notifications system

---

## 12. COMPONENT LIBRARY REFERENCE

### Dependencies to Install

```bash
pnpm add @tanstack/react-table@latest
pnpm add @tanstack/react-virtual@latest
pnpm add @floating-ui/react@latest
pnpm add framer-motion@latest
pnpm add cmdk@latest
pnpm add date-fns@latest
pnpm add zustand@latest
pnpm add react-hook-form@latest
pnpm add @hookform/resolvers@latest
```

### shadcn/ui Components to Use

```bash
# Install required shadcn components
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add button
npx shadcn@latest add checkbox
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add command
npx shadcn@latest add popover
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add tooltip
npx shadcn@latest add scroll-area
```

---

## IMPLEMENTATION ORDER

1. **Day 1-2**: Setup & Infrastructure
   - Install dependencies
   - Create folder structure
   - Setup state management
   - Create base components (Badge, Avatar, URLPill)

2. **Day 3-4**: Table Core
   - DataTable component with TanStack Table
   - Column definitions
   - Basic sorting/filtering
   - Pagination

3. **Day 5**: Styling & Polish
   - Match Twenty's visual design
   - Hover states, animations
   - Loading/empty states
   - Responsive design

4. **Day 6**: Bulk Actions & Inline Editing
   - Bulk selection
   - Bulk action toolbar
   - Inline edit for key fields

5. **Day 7**: API Integration & Testing
   - Connect to real data
   - Add RLS policies
   - Write tests
   - Bug fixes & polish

---

**Target Delivery**: End of Week 1 (Day 7)
**Quality Gate**: User review for 95%+ quality validation before proceeding to Week 2


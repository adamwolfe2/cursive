# Lead Management Components - Phase 4

Complete lead management system with advanced TanStack Table v8 features, filters, bulk actions, and exports.

## Components

### 1. LeadsTable (`leads-table.tsx`)

Main table component with full TanStack Table v8 implementation.

**Features:**
- ✅ Multi-column sorting (click headers to sort)
- ✅ Column filtering (intent, status, etc.)
- ✅ Global search (debounced, 300ms)
- ✅ Row selection with checkboxes
- ✅ Column visibility toggle
- ✅ Pagination (10/25/50/100 per page)
- ✅ Real-time updates with React Query
- ✅ Click row to open detail panel
- ✅ Professional zinc/emerald/red design

**Columns:**
- Select (checkbox)
- Company (name + domain, sortable)
- Intent (badge with hot/warm/cold)
- Industry (sortable)
- Location (city, state, country)
- Contact (name, title, email)
- Status (enrichment status badge)
- Created (date, sortable)
- Actions (View button)

**Usage:**
```tsx
import { LeadsTable } from '@/components/leads'

<LeadsTable
  initialFilters={{
    query_id: 'abc-123',
    intent_score: 'hot',
  }}
/>
```

### 2. LeadsTableToolbar (`leads-table-toolbar.tsx`)

Comprehensive toolbar with filters and actions.

**Features:**
- ✅ Debounced search input (300ms delay)
- ✅ Intent filter dropdown (hot/warm/cold)
- ✅ Status filter dropdown (completed/pending/failed)
- ✅ Column visibility picker (toggle columns)
- ✅ Refresh button
- ✅ Export to CSV button
- ✅ Bulk actions bar (appears when rows selected)
- ✅ Bulk delete with confirmation
- ✅ Clear filters button

**Bulk Actions:**
- Select multiple leads using checkboxes
- Bulk delete with confirmation dialog
- Shows count of selected items
- Clear selection button

**Usage:**
```tsx
<LeadsTableToolbar
  table={table}
  globalFilter={globalFilter}
  setGlobalFilter={setGlobalFilter}
  onRefresh={() => refetch()}
  selectedCount={5}
  onBulkDelete={handleBulkDelete}
  isDeleting={false}
/>
```

### 3. LeadDetailPanel (`lead-detail-panel.tsx`)

Slide-out drawer showing full lead details.

**Features:**
- ✅ Slide-out animation from right
- ✅ Company information section
- ✅ Contact details with email/LinkedIn
- ✅ Intent signals with strength badges
- ✅ Query details
- ✅ Metadata (status, dates)
- ✅ Close button and backdrop click
- ✅ Professional zinc/emerald design

**Sections:**
- Company Info (industry, employees, revenue, location, description, website)
- Contacts (up to 5 contacts with verification badges)
- Intent Signals (type, date, strength)
- Query Details (topic, category)
- Metadata (enrichment/delivery status, created/enriched dates)

**Usage:**
```tsx
<LeadDetailPanel
  lead={selectedLead}
  onClose={() => setSelectedLead(null)}
  onRefresh={() => refetch()}
/>
```

### 4. LeadStats (`lead-stats.tsx`)

Dashboard stat cards with visual distribution.

**Features:**
- ✅ Hot/Warm/Cold/Total count cards
- ✅ Percentage badges
- ✅ Progress bars for each category
- ✅ Visual distribution chart
- ✅ Platform upload stats table
- ✅ Auto-refresh every 30 seconds
- ✅ Loading skeleton states
- ✅ Empty state for no leads

**Stats Shown:**
- Hot Leads (count + percentage)
- Warm Leads (count + percentage)
- Cold Leads (count + percentage)
- Total Leads (with qualification %)
- Intent Distribution (visual bar)
- Platform Uploads (recent deliveries)

**Usage:**
```tsx
import { LeadStats } from '@/components/leads'

<LeadStats />
```

### 5. IntentBadge (`intent-badge.tsx`)

Reusable badge component for intent scores.

**Features:**
- ✅ Three variants: hot (red), warm (amber), cold (zinc)
- ✅ Three sizes: sm, md, lg
- ✅ Optional label
- ✅ Colored dot indicator
- ✅ Consistent design system

**Usage:**
```tsx
import { IntentBadge } from '@/components/leads'

<IntentBadge score="hot" size="md" />
<IntentBadge score="warm" size="sm" showLabel={false} />
```

## Design System

### Colors
- **Primary**: Emerald 600 (#10b981)
- **Hot Intent**: Red 600 (#dc2626)
- **Warm Intent**: Amber 600 (#d97706)
- **Cold Intent**: Zinc 600 (#52525b)
- **Background**: White/Zinc 50
- **Text**: Zinc 900/700/500

### Typography
- **Font Size**: 13px for body text
- **Headers**: text-base (16px) to text-2xl (24px)
- **Font Weight**: medium (500) and semibold (600)
- **Line Height**: relaxed for readability

### Spacing
- **Padding**: p-6 for cards, p-4 for compact
- **Gap**: gap-4 for grids, gap-2 for inline
- **Border Radius**: rounded-lg (8px)

### Borders
- **Color**: Zinc 200
- **Style**: border-zinc-200
- **Hover**: border-zinc-300

## API Endpoints

### GET /api/leads
Fetch leads with filters and pagination.

**Query Params:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 50)
- `search` - Search term
- `query_id` - Filter by query
- `enrichment_status` - Filter by status
- `delivery_status` - Filter by delivery
- `intent_score` - Filter by intent (hot/warm/cold)
- `date_from` - Filter by start date
- `date_to` - Filter by end date

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 50,
    "total_pages": 2
  }
}
```

### GET /api/leads/stats
Get lead statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "intent_breakdown": {
      "hot_count": 10,
      "warm_count": 25,
      "cold_count": 65,
      "total_count": 100,
      "hot_percentage": 10,
      "warm_percentage": 25
    },
    "platform_uploads": [...]
  }
}
```

### POST /api/leads/export
Export leads to CSV.

**Body:**
```json
{
  "filters": {
    "intent_score": "hot",
    "enrichment_status": "completed"
  }
}
```

**Response:**
CSV file download

### DELETE /api/leads/[id]
Delete a single lead.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Lead deleted successfully"
  }
}
```

## React Query Integration

All components use React Query for data fetching with:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Loading states
- ✅ Error handling
- ✅ Optimistic updates

**Query Keys:**
- `['leads', page, perPage, filters]` - Leads list
- `['lead-stats']` - Stats data

## TanStack Table Features

### Sorting
Click column headers to sort. Multi-column sorting supported.

```tsx
const [sorting, setSorting] = useState<SortingState>([
  { id: 'created_at', desc: true }
])
```

### Filtering
Column-level and global filtering.

```tsx
table.getColumn('intent')?.setFilterValue('hot')
setGlobalFilter('company name')
```

### Column Visibility
Toggle column visibility dynamically.

```tsx
table.getColumn('industry')?.toggleVisibility()
```

### Row Selection
Select rows with checkboxes.

```tsx
const selectedRows = table.getSelectedRowModel().rows
```

### Pagination
Server-side pagination with page size selector.

```tsx
setPagination({ pageIndex: 0, pageSize: 50 })
```

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support

## Performance

- ✅ Debounced search (300ms)
- ✅ Virtual scrolling ready
- ✅ Memoized columns
- ✅ Optimized re-renders
- ✅ React Query caching

## Testing

To test the components:

1. **Create a query** to generate leads
2. **View leads page** at `/leads`
3. **Test search** - type in search box
4. **Test filters** - select intent/status
5. **Test sorting** - click column headers
6. **Test selection** - check multiple rows
7. **Test bulk delete** - select and delete
8. **Test export** - click export button
9. **Test detail panel** - click on a row
10. **Test pagination** - navigate pages

## Future Enhancements

- [ ] Date range picker for created_at filter
- [ ] Advanced filters (industry, location)
- [ ] Saved filter presets
- [ ] Bulk export selected rows only
- [ ] Bulk edit (update status, etc.)
- [ ] Inline editing
- [ ] Drag and drop column reordering
- [ ] Virtual scrolling for 10k+ rows
- [ ] Real-time updates via websockets

## Support

For issues or questions, contact the development team or check:
- TanStack Table docs: https://tanstack.com/table/latest
- React Query docs: https://tanstack.com/query/latest

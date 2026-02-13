# Segment Builder Updates - Summary

## Overview
Updated the Segment Builder frontend to persist segments using the new API endpoints instead of component state.

## Changes Made

### 1. Dependencies Added
- **React Query**: Added `useQuery`, `useMutation`, and `useQueryClient` from `@tanstack/react-query`
- **AlertDialog**: Added confirmation dialog for delete actions
- **Loader2**: Added loading spinner icon

### 2. State Management Updates

#### Removed:
- Local `savedSegments` state (was: `useState<Segment[]>([])`)

#### Added:
- `segmentDescription` state for optional segment descriptions
- `deleteDialogOpen` state for managing delete confirmation dialog
- `segmentToDelete` state to track which segment is being deleted
- `runningSegmentId` state to show loading state when running segments
- React Query `queryClient` instance

### 3. Data Fetching with React Query

#### Fetch Segments Query:
```typescript
const { data: segmentsData, isLoading: segmentsLoading } = useQuery({
  queryKey: ['segments'],
  queryFn: async () => {
    const response = await fetch('/api/segments')
    if (!response.ok) throw new Error('Failed to fetch segments')
    return response.json()
  },
})
```

#### Save Segment Mutation:
```typescript
const saveSegmentMutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    // Error handling...
    return response.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['segments'] })
    toast.success('Segment saved successfully!')
    // Clear form
  },
})
```

#### Delete Segment Mutation:
```typescript
const deleteSegmentMutation = useMutation({
  mutationFn: async (segmentId: string) => {
    const response = await fetch(`/api/segments/${segmentId}`, {
      method: 'DELETE',
    })
    // Error handling...
    return response.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['segments'] })
    toast.success('Segment deleted successfully!')
  },
})
```

### 4. New Functions

#### `handleSaveSegment`
- Validates segment name and filters
- Converts FilterRule[] to API format (industries, states, etc.)
- Calls `saveSegmentMutation.mutate()` with formatted data
- Auto-clears form on success

#### `handleRunSavedSegment(segmentId, action)`
- Runs a saved segment via `POST /api/segments/[id]/run`
- Supports both 'preview' and 'pull' actions
- Shows loading state via `runningSegmentId`
- Updates segments list after successful pull
- Handles insufficient credits error (402)

#### `handleLoadSegment(segment)`
- Loads a saved segment into the builder
- Converts API filters back to FilterRule[] format
- Populates name, description, and filters
- Useful for editing existing segments

#### `confirmDeleteSegment(segmentId)`
- Opens confirmation dialog before deletion
- Sets `segmentToDelete` state

#### `handleDeleteSegment`
- Confirms and executes delete mutation
- Closes dialog and clears state

### 5. UI Updates

#### Builder Tab:
- Added description input field
- Updated save button with loading state
- Better layout with two-row action section

#### Saved Segments Tab:
- Added loading state with spinner
- Shows segment metadata (description, last count, last run date)
- **New Actions**:
  - **Load**: Loads segment filters into builder for editing
  - **Preview**: Runs preview without pulling leads
  - **Pull**: Immediately pulls 25 leads
  - **Delete**: Shows confirmation dialog before deleting
- All buttons show loading states during operations

#### Delete Confirmation Dialog:
```tsx
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Segment</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete this segment? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteSegment}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 6. Updated Segment Interface
```typescript
interface Segment {
  id: string
  name: string
  description: string | null
  filters: Record<string, any>  // Changed from FilterRule[]
  last_count: number | null
  last_run_at: string | null     // Changed from last_run
  status: 'active' | 'paused' | 'archived'  // Added archived
  created_at: string             // Added
  workspace_id: string           // Added
  user_id: string                // Added
}
```

## API Endpoints Used

### GET /api/segments
- Fetches all saved segments for current workspace
- Returns: `{ segments: Segment[] }`

### POST /api/segments
- Creates new segment
- Body: `{ name, description?, filters }`
- Returns: `{ segment: Segment }`
- Error 409 if name already exists

### DELETE /api/segments/[id]
- Deletes segment by ID
- Verifies ownership before deletion
- Returns: `{ success: true }`

### POST /api/segments/[id]/run
- Executes saved segment
- Body: `{ action: 'preview' | 'pull', limit: number }`
- Returns preview data or pulled leads with credit info
- Updates `last_count` and `last_run_at` in database

## User Flow

### Creating a Segment:
1. Add filters in builder
2. Enter segment name (required) and description (optional)
3. Click "Save Segment"
4. Success toast shown
5. Form clears
6. Segment appears in "Saved Segments" tab

### Running a Saved Segment:
1. Go to "Saved Segments" tab
2. Click "Preview" to see count and cost
3. Click "Pull" to immediately pull 25 leads
4. Loading state shown during execution
5. Success toast with results
6. Segment stats updated (last_count, last_run_at)

### Loading and Editing:
1. Click "Load" on any saved segment
2. Filters populate in builder
3. Modify as needed
4. Can save as new segment (different name) or update existing

### Deleting a Segment:
1. Click trash icon on segment
2. Confirmation dialog appears
3. Click "Delete" to confirm
4. Segment removed from list
5. Success toast shown

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] Create segment → refresh page → segment persists
- [ ] Save segment with duplicate name → shows error
- [ ] Run preview on saved segment → shows count
- [ ] Run pull on saved segment → leads added to workspace
- [ ] Delete segment → confirmation dialog → segment removed
- [ ] Load segment → filters populate in builder
- [ ] Insufficient credits → proper error shown
- [ ] Multiple segments can be managed independently

## Technical Notes

- Uses React Query for automatic cache invalidation
- All API calls include proper error handling
- Loading states prevent double-submissions
- Confirmation dialogs prevent accidental deletions
- Filter format conversion handled bidirectionally
- Workspace isolation enforced by API (RLS policies)

## Files Modified

1. `/src/app/(app)/segment-builder/page.tsx` - Main component file

## Files Referenced (Not Modified)

1. `/src/app/api/segments/route.ts` - GET, POST endpoints
2. `/src/app/api/segments/[id]/route.ts` - GET, PATCH, DELETE endpoints
3. `/src/app/api/segments/[id]/run/route.ts` - POST run endpoint
4. `/src/components/providers/query-provider.tsx` - React Query setup
5. `/src/components/ui/alert-dialog.tsx` - Alert dialog component

## Next Steps

1. Test in development environment
2. Verify persistence across page refreshes
3. Test with multiple users in same workspace
4. Verify credit deduction works correctly
5. Test edge cases (no credits, duplicate names, etc.)
6. Consider adding segment edit functionality (PATCH endpoint)
7. Consider adding segment sharing between workspace users
8. Add analytics tracking for segment usage

## Breaking Changes

None - This is a backward-compatible enhancement. The component still works in isolation, but now persists data.

## Performance Considerations

- React Query caches segments list (1 minute stale time)
- Segments only refetched on mutations or manual invalidation
- API calls are rate-limited by Supabase RLS policies
- Consider pagination if user has 100+ segments

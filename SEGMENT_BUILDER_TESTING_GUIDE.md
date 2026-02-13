# Segment Builder Testing Guide

## Prerequisites
- Development environment running (`pnpm dev`)
- User account with credits
- Access to `/segment-builder` page

## Test Cases

### 1. Create and Save Segment
**Steps:**
1. Navigate to `/segment-builder`
2. Click "Add Filter"
3. Select filter: Industry = Technology
4. Enter segment name: "Tech Companies"
5. Enter description: "Technology sector leads"
6. Click "Save Segment"

**Expected:**
- Success toast: "Segment saved successfully!"
- Form clears (name and description inputs empty)
- Saved Segments tab badge increments by 1

**Verify:**
1. Refresh the page
2. Go to "Saved Segments" tab
3. Segment "Tech Companies" should be visible with description

### 2. Run Saved Segment - Preview
**Steps:**
1. Go to "Saved Segments" tab
2. Find "Tech Companies" segment
3. Click "Preview" button

**Expected:**
- Loading spinner shows on Preview button
- Success toast: "Found X matching leads"
- Preview panel updates on right side
- Segment's "Last count" and "Last run" update

### 3. Run Saved Segment - Pull Leads
**Steps:**
1. Go to "Saved Segments" tab
2. Click "Pull" button on saved segment

**Expected:**
- Loading spinner shows on Pull button
- Success toast: "Successfully pulled X leads (Y credits charged)"
- Segment stats update
- Can verify leads in CRM/Leads section

### 4. Load Segment into Builder
**Steps:**
1. Go to "Saved Segments" tab
2. Click "Load" button on saved segment
3. Switch to "Build Segment" tab

**Expected:**
- Filters from saved segment appear in builder
- Segment name and description populate in inputs
- Success toast: "Segment loaded into builder"
- Can modify and save as new segment

### 5. Delete Segment
**Steps:**
1. Go to "Saved Segments" tab
2. Click trash icon on a segment
3. Confirmation dialog appears
4. Click "Delete"

**Expected:**
- Confirmation dialog with warning message
- After confirming, success toast: "Segment deleted successfully!"
- Segment removed from list
- Badge count decrements

**Test Cancel:**
1. Click trash icon
2. Click "Cancel" in dialog
3. Segment should remain in list

### 6. Persistence Test
**Steps:**
1. Create and save a segment
2. Navigate away to another page
3. Return to `/segment-builder`
4. Go to "Saved Segments" tab

**Expected:**
- Previously saved segment is still there
- All metadata intact (name, description, last run, count)

### 7. Multiple Segments
**Steps:**
1. Create segment "Healthcare NY": Industry = Healthcare, State = NY
2. Create segment "Tech California": Industry = Technology, State = CA
3. Create segment "Finance": Industry = Finance

**Expected:**
- All three segments appear in Saved Segments tab
- Each has unique name and description
- Can run each independently
- Last run stats are separate for each

### 8. Error Handling - Duplicate Name
**Steps:**
1. Save segment named "Test"
2. Try to save another segment named "Test"

**Expected:**
- Error toast: "Segment name already exists"
- Segment not created
- Form doesn't clear

### 9. Error Handling - Insufficient Credits
**Steps:**
1. Use test account with 0 credits
2. Create and save segment
3. Click "Pull" on segment

**Expected:**
- Error toast: "Insufficient credits: [error details]"
- No leads pulled
- Credits balance unchanged

### 10. Loading States
**Verify all loading indicators work:**
- Save button shows spinner while saving
- Preview button shows spinner in Saved Segments tab
- Pull button shows spinner in Saved Segments tab
- Delete button disabled while deletion in progress
- Loader shown while fetching segments on page load

### 11. Edge Cases

#### Empty State
**Steps:**
1. New user with no saved segments
2. Navigate to Saved Segments tab

**Expected:**
- Empty state message: "No saved segments yet"
- Helpful text about building and saving

#### No Filters
**Steps:**
1. Try to save segment without adding filters

**Expected:**
- Error toast: "Add at least one filter"

#### No Name
**Steps:**
1. Add filters but leave name blank
2. Click "Save Segment"

**Expected:**
- Error toast: "Please enter a segment name"

### 12. Multi-User Test (if applicable)
**Steps:**
1. User A creates segment "Test Segment"
2. User B (different workspace) tries to access User A's segments

**Expected:**
- User B cannot see User A's segments
- Workspace isolation maintained by RLS policies

## API Verification

### Check Network Tab
While testing, verify in browser DevTools Network tab:

1. **GET /api/segments**
   - Called on page load
   - Returns array of segments
   - Status 200

2. **POST /api/segments**
   - Called when saving segment
   - Sends name, description, filters
   - Returns created segment
   - Status 201

3. **POST /api/segments/[id]/run**
   - Called for preview/pull
   - Sends action and limit
   - Returns preview data or pull results
   - Status 200

4. **DELETE /api/segments/[id]**
   - Called when deleting
   - Returns success: true
   - Status 200

## Database Verification

### Query saved_segments table:
```sql
SELECT
  id,
  workspace_id,
  name,
  description,
  filters,
  last_count,
  last_run_at,
  status,
  created_at
FROM saved_segments
WHERE workspace_id = '[your-workspace-id]'
ORDER BY created_at DESC;
```

**Verify:**
- Segments are saved correctly
- Filters stored as JSONB
- last_count and last_run_at update after running
- RLS policies prevent cross-workspace access

## Performance Check

1. **Load Time**: Saved Segments tab should load instantly (React Query cache)
2. **Save Time**: < 1 second
3. **Preview Time**: 2-5 seconds (depends on AudienceLab API)
4. **Pull Time**: 5-10 seconds (depends on AudienceLab + lead insertion)

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

## Mobile Responsiveness

Test on:
- [ ] Mobile viewport (375px)
- [ ] Tablet viewport (768px)
- [ ] Desktop (1280px+)

## Regression Tests

Verify existing functionality still works:
- [ ] Manual filter building (not using saved segments)
- [ ] Preview leads from builder
- [ ] Pull leads from builder
- [ ] Filter modifications
- [ ] Add/remove filters

## Success Criteria

- ✅ All test cases pass
- ✅ No console errors
- ✅ TypeScript compilation successful
- ✅ Data persists across refreshes
- ✅ Loading states work correctly
- ✅ Error handling graceful
- ✅ API calls efficient (no unnecessary requests)
- ✅ RLS policies enforced (workspace isolation)

## Known Limitations

1. No pagination (assumes < 100 segments per workspace)
2. No segment editing (must load and save as new)
3. Cannot share segments between workspace users
4. Preview always limited to 25 leads
5. Cannot change segment name after creation (would need PATCH endpoint)

## Future Enhancements

1. Add PATCH endpoint for editing segments
2. Add segment duplication feature
3. Add bulk operations (delete multiple, archive)
4. Add segment folders/categories
5. Add segment sharing within workspace
6. Add usage analytics per segment
7. Add segment scheduling (auto-run)
8. Add export segment results

// Bulk Actions Toolbar Component
// Slides up from bottom when leads are selected

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, UserPlus, Tag, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useBulkUpdateLeads } from '@/lib/hooks/use-leads'
import { useCRMStore } from '@/lib/crm/crm-state'
import type { LeadStatus } from '@/types/crm.types'

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

interface WorkspaceUser {
  id: string
  full_name: string
  email: string
}

interface BulkActionsToolbarProps {
  availableUsers?: WorkspaceUser[]
  commonTags?: string[]
}

export function BulkActionsToolbar({
  availableUsers = [],
  commonTags = [],
}: BulkActionsToolbarProps) {
  const { selectedLeadIds, clearSelection, setBulkActionInProgress } = useCRMStore()
  const bulkUpdateMutation = useBulkUpdateLeads()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const selectedCount = selectedLeadIds.length

  const handleUpdateStatus = async (status: LeadStatus) => {
    setBulkActionInProgress(true)
    await bulkUpdateMutation.mutateAsync({
      ids: selectedLeadIds,
      action: 'update_status',
      data: { status },
    })
    setBulkActionInProgress(false)
    clearSelection()
  }

  const handleAssignUser = async (userId: string) => {
    setBulkActionInProgress(true)
    await bulkUpdateMutation.mutateAsync({
      ids: selectedLeadIds,
      action: 'assign_user',
      data: { assigned_user_id: userId },
    })
    setBulkActionInProgress(false)
    clearSelection()
  }

  const handleAddTag = async (tag: string) => {
    setBulkActionInProgress(true)
    await bulkUpdateMutation.mutateAsync({
      ids: selectedLeadIds,
      action: 'add_tag',
      data: { tag },
    })
    setBulkActionInProgress(false)
    clearSelection()
  }

  const handleDelete = async () => {
    setBulkActionInProgress(true)
    await bulkUpdateMutation.mutateAsync({
      ids: selectedLeadIds,
      action: 'delete',
      data: {},
    })
    setBulkActionInProgress(false)
    clearSelection()
    setShowDeleteDialog(false)
  }

  // Don't show toolbar if no leads selected
  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 min-w-[500px]">
            {/* Selection info */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedCount} lead{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Update Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleUpdateStatus(option.value)}
                      disabled={bulkUpdateMutation.isPending}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Assign User */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={availableUsers.length === 0}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableUsers.length === 0 ? (
                    <DropdownMenuItem disabled>No users available</DropdownMenuItem>
                  ) : (
                    availableUsers.map((user) => (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() => handleAssignUser(user.id)}
                        disabled={bulkUpdateMutation.isPending}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{user.full_name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Tag */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={commonTags.length === 0}>
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {commonTags.length === 0 ? (
                    <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
                  ) : (
                    commonTags.map((tag) => (
                      <DropdownMenuItem
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        disabled={bulkUpdateMutation.isPending}
                      >
                        {tag}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={bulkUpdateMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Clear selection */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} lead(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              leads from your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

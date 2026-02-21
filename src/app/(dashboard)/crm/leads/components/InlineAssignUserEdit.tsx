// Inline Assign User Editor
// Click to assign/unassign users to leads

'use client'

import { useState } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react'
import { Check, Loader2, UserX } from 'lucide-react'
import { LeadAvatar } from '@/app/(dashboard)/crm/components/LeadAvatar'
import { useUpdateLead } from '@/lib/hooks/use-leads'
import { cn } from '@/lib/utils'

interface AssignedUser {
  id: string
  full_name: string | null
  email: string | null
}

interface InlineAssignUserEditProps {
  leadId: string
  currentUser: AssignedUser | null
  availableUsers: AssignedUser[]
}

export function InlineAssignUserEdit({
  leadId,
  currentUser,
  availableUsers,
}: InlineAssignUserEditProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(currentUser)
  const updateMutation = useUpdateLead()

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const handleUserSelect = async (user: AssignedUser | null) => {
    if (user?.id === selectedUser?.id) {
      setIsOpen(false)
      return
    }

    const previousUser = selectedUser
    setSelectedUser(user) // optimistic update

    try {
      await updateMutation.mutateAsync({
        id: leadId,
        updates: { assigned_user_id: user?.id || null },
      })
      setIsOpen(false)
    } catch {
      setSelectedUser(previousUser) // revert on failure
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, user: AssignedUser | null) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleUserSelect(user)
    }
  }

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn(
          'inline-flex items-center gap-2 rounded-md transition-colors hover:bg-muted/50 px-2 py-1 -mx-2 -my-1 text-left w-full',
          updateMutation.isPending && 'opacity-50 cursor-wait'
        )}
        disabled={updateMutation.isPending}
        aria-label="Assign user"
      >
        {selectedUser ? (
          <>
            <LeadAvatar
              firstName={selectedUser.full_name}
              email={selectedUser.email}
              size="xs"
            />
            <span className="text-sm truncate">
              {selectedUser.full_name || selectedUser.email}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">Unassigned</span>
        )}
        {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-[300px] overflow-y-auto"
            >
              {/* Unassign option */}
              <button
                onClick={() => handleUserSelect(null)}
                onKeyDown={(e) => handleKeyDown(e, null)}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                  !selectedUser && 'bg-accent/50'
                )}
              >
                <UserX className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">Unassign</span>
                {!selectedUser && <Check className="h-4 w-4" />}
              </button>

              {/* Divider */}
              {availableUsers.length > 0 && <div className="my-1 h-px bg-border" />}

              {/* User options */}
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  onKeyDown={(e) => handleKeyDown(e, user)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    selectedUser?.id === user.id && 'bg-accent/50'
                  )}
                >
                  <LeadAvatar
                    firstName={user.full_name}
                    email={user.email}
                    size="xs"
                    className="mr-2"
                  />
                  <span className="flex-1 truncate">{user.full_name || user.email}</span>
                  {selectedUser?.id === user.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}

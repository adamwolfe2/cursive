'use client'

/**
 * User Management Components
 * OpenInfo Platform
 *
 * Admin tools for managing users and workspaces.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable, TableToolbar, Pagination } from '@/components/ui/data-table'
import { Avatar } from '@/components/ui/avatar'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '@/components/ui/modal'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPES
// ============================================

export interface AdminUser {
  id: string
  email: string
  fullName: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'pending'
  workspaceName: string
  creditsUsed: number
  creditsLimit: number
  createdAt: string
  lastActiveAt: string
}

// ============================================
// USER TABLE
// ============================================

interface UserTableProps {
  users: AdminUser[]
  loading?: boolean
  onEdit: (user: AdminUser) => void
  onSuspend: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
  onImpersonate: (user: AdminUser) => void
}

export function UserTable({
  users,
  loading,
  onEdit,
  onSuspend,
  onDelete,
  onImpersonate,
}: UserTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [planFilter, setPlanFilter] = React.useState<string>('all')

  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || user.status === statusFilter

      const matchesPlan = planFilter === 'all' || user.plan === planFilter

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [users, searchQuery, statusFilter, planFilter])

  const columns = [
    {
      id: 'user',
      header: 'User',
      cell: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size="sm" />
          <div>
            <p className="font-medium text-foreground">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'workspace',
      header: 'Workspace',
      cell: (user: AdminUser) => (
        <span className="text-sm">{user.workspaceName}</span>
      ),
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: (user: AdminUser) => (
        <Badge
          variant={
            user.plan === 'enterprise'
              ? 'success'
              : user.plan === 'pro'
                ? 'default'
                : 'secondary'
          }
        >
          {user.plan}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (user: AdminUser) => (
        <Badge
          variant={
            user.status === 'active'
              ? 'success'
              : user.status === 'suspended'
                ? 'destructive'
                : 'warning'
          }
        >
          {user.status}
        </Badge>
      ),
    },
    {
      id: 'credits',
      header: 'Credits',
      cell: (user: AdminUser) => (
        <div className="text-sm">
          <span className="font-medium">{user.creditsUsed}</span>
          <span className="text-muted-foreground"> / {user.creditsLimit}</span>
        </div>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      cell: (user: AdminUser) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (user: AdminUser) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(user)}
            aria-label="Edit user"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onImpersonate(user)}
            aria-label="Impersonate user"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onSuspend(user)}
            aria-label={user.status === 'active' ? 'Suspend user' : 'Activate user'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(user)}
            aria-label="Delete user"
            className="text-destructive hover:text-destructive"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <TableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search users..."
          filters={
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </Select>
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-32"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </div>
          }
        />
        <DataTable
          columns={columns}
          data={filteredUsers}
          keyField="id"
          loading={loading}
          loadingRows={5}
          emptyState={{
            title: 'No users found',
            description: 'Try adjusting your search or filters.',
          }}
        />
      </CardContent>
    </Card>
  )
}

// ============================================
// USER EDIT MODAL
// ============================================

interface UserEditModalProps {
  user: AdminUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (user: AdminUser, changes: Partial<AdminUser>) => void
}

export function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = React.useState({
    fullName: '',
    plan: 'free' as AdminUser['plan'],
    creditsLimit: 100,
    status: 'active' as AdminUser['status'],
  })

  React.useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        plan: user.plan,
        creditsLimit: user.creditsLimit,
        status: user.status,
      })
    }
  }, [user])

  const handleSave = () => {
    if (user) {
      onSave(user, formData)
      onClose()
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <ModalTitle>Edit User</ModalTitle>
        <ModalDescription>Update user settings and permissions</ModalDescription>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input value={user.email} disabled className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Plan</label>
            <Select
              value={formData.plan}
              onChange={(e) =>
                setFormData({ ...formData, plan: e.target.value as AdminUser['plan'] })
              }
              className="mt-1 w-full"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Daily Credit Limit
            </label>
            <Input
              type="number"
              value={formData.creditsLimit}
              onChange={(e) =>
                setFormData({ ...formData, creditsLimit: parseInt(e.target.value) })
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Status</label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as AdminUser['status'] })
              }
              className="mt-1 w-full"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </ModalFooter>
    </Modal>
  )
}

// ============================================
// CONFIRMATION MODAL
// ============================================

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  loading,
}: ConfirmActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>{title}</ModalTitle>
        <ModalDescription>{description}</ModalDescription>
      </ModalHeader>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatDateTime, formatDate, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/lib/hooks/use-toast'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'owner' | 'admin' | 'member'
  created_at: string
  last_login_at: string | null
}

interface TeamInvite {
  id: string
  email: string
  role: 'admin' | 'member'
  status: string
  created_at: string
  expires_at: string
  invited_by_user: { id: string; full_name: string | null; email: string }
}

interface CurrentUser {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  full_name: string | null
}

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

const roleColors = {
  owner: 'bg-amber-100 text-amber-700 ring-amber-200',
  admin: 'bg-blue-100 text-blue-700 ring-blue-200',
  member: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
}

async function fetchMembers(): Promise<{ members: TeamMember[] }> {
  const res = await fetch('/api/team/members')
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

async function fetchInvites(): Promise<{ invites: TeamInvite[] }> {
  const res = await fetch('/api/team/invites')
  if (!res.ok) throw new Error('Failed to fetch invites')
  return res.json()
}

async function fetchCurrentUser(): Promise<{ data: CurrentUser }> {
  const res = await fetch('/api/users/me')
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

async function createInvite(data: { email: string; role: string }) {
  const res = await fetch('/api/team/invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create invite')
  }
  return res.json()
}

async function cancelInvite(id: string) {
  const res = await fetch(`/api/team/invites/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to cancel invite')
  }
  return res.json()
}

async function updateMemberRole(id: string, role: string) {
  const res = await fetch(`/api/team/members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update role')
  }
  return res.json()
}

async function removeMember(id: string) {
  const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to remove member')
  }
  return res.json()
}

function MemberAvatar({ member }: { member: Pick<TeamMember, 'full_name' | 'email' | 'avatar_url'> }) {
  const initial = member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm flex-shrink-0">
      {initial}
    </div>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin text-zinc-400', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default function TeamSettingsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set())
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: currentUserData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: fetchCurrentUser,
  })

  const currentUser = currentUserData?.data

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: fetchMembers,
  })

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['team-invites'],
    queryFn: fetchInvites,
    // Only admins/owners can see invites — skip error for members
    retry: false,
  })

  const inviteMutation = useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites'] })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
      setInviteError(null)
      toast.success('Invitation sent successfully!')
    },
    onError: (err: Error) => {
      setInviteError(err.message)
    },
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      setCancelingIds((prev) => new Set(prev).add(id))
      try {
        return await cancelInvite(id)
      } finally {
        setCancelingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites'] })
      toast.success('Invitation cancelled.')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to cancel invitation.')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateMemberRole(id, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      toast.success(`Role updated to ${roleLabels[variables.role as keyof typeof roleLabels] || variables.role}.`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update role.')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      setRemovingIds((prev) => new Set(prev).add(id))
      try {
        return await removeMember(id)
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      toast.success('Member removed from workspace.')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove member.')
    },
  })

  const handleInvite = (e: FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  const handleRoleChange = (member: TeamMember, newRole: string) => {
    if (newRole === member.role) return
    if (!confirm(`Change ${member.full_name || member.email}'s role to ${roleLabels[newRole as keyof typeof roleLabels] || newRole}?`)) {
      return
    }
    updateRoleMutation.mutate({ id: member.id, role: newRole })
  }

  const handleRemoveMember = (member: TeamMember) => {
    if (!confirm(`Remove ${member.full_name || member.email} from the workspace? They will lose all access immediately.`)) {
      return
    }
    removeMemberMutation.mutate(member.id)
  }

  const handleCancelInvite = (invite: TeamInvite) => {
    if (!confirm(`Cancel the invitation for ${invite.email}?`)) return
    cancelInviteMutation.mutate(invite.id)
  }

  const members = membersData?.members || []
  const invites = invitesData?.invites || []
  const canManageTeam = currentUser?.role === 'owner' || currentUser?.role === 'admin'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Team</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your team members and their permissions
          </p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">
            Members {!membersLoading && `(${members.length})`}
          </h2>
        </div>

        {membersLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-5 w-5" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-600">No members found</p>
            <p className="text-xs text-zinc-400 mt-1">Invite colleagues to collaborate in your workspace.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  {canManageTeam && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((member) => {
                  const isCurrentUser = member.id === currentUser?.id
                  const isRemoving = removingIds.has(member.id)
                  const isUpdatingRole = updateRoleMutation.isPending

                  return (
                    <tr key={member.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar member={member} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-zinc-900">
                                {member.full_name || 'Unnamed'}
                              </p>
                              {isCurrentUser && (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                          roleColors[member.role]
                        )}>
                          {roleLabels[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {formatDateTime(member.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {member.last_login_at ? formatRelativeTime(member.last_login_at) : 'Never'}
                      </td>
                      {canManageTeam && (
                        <td className="px-6 py-4 text-right">
                          {member.role !== 'owner' && !isCurrentUser ? (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member, e.target.value)}
                                disabled={isUpdatingRole || isRemoving}
                                className="rounded-md border border-input text-sm py-1 px-2 focus:border-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => handleRemoveMember(member)}
                                disabled={isRemoving || isUpdatingRole}
                                className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-red-50"
                                title="Remove member"
                                aria-label={`Remove ${member.full_name || member.email}`}
                              >
                                {isRemoving ? (
                                  <LoadingSpinner className="h-4 w-4 text-red-400" />
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              {isCurrentUser ? 'You' : '—'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invites — shown to admins/owners */}
      {canManageTeam && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">
              Pending Invites {!invitesLoading && `(${invites.length})`}
            </h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              + Invite
            </button>
          </div>

          {invitesLoading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner className="h-5 w-5" />
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No pending invitations</p>
              <p className="text-xs text-zinc-400 mt-1">
                Sent invites will appear here until accepted or expired.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {invites.map((invite) => {
                    const isCanceling = cancelingIds.has(invite.id)
                    const isExpired = new Date(invite.expires_at) < new Date()

                    return (
                      <tr key={invite.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs font-medium flex-shrink-0">
                              {invite.email.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-medium text-zinc-900 text-sm">{invite.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                            roleColors[invite.role]
                          )}>
                            {roleLabels[invite.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {invite.invited_by_user?.full_name || invite.invited_by_user?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'text-sm',
                            isExpired ? 'text-red-500 font-medium' : 'text-zinc-500'
                          )}>
                            {isExpired ? 'Expired' : 'Expires'} {formatDate(invite.expires_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleCancelInvite(invite)}
                            disabled={isCanceling}
                            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isCanceling ? (
                              <>
                                <LoadingSpinner className="h-3 w-3 text-red-400" />
                                Canceling...
                              </>
                            ) : (
                              'Cancel'
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Role Permissions Reference */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">Role Permissions</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              role: 'Owner',
              color: roleColors.owner,
              perms: ['Full workspace control', 'Manage billing & plan', 'Manage all members', 'All admin permissions'],
            },
            {
              role: 'Admin',
              color: roleColors.admin,
              perms: ['Invite & remove members', 'Manage workspace settings', 'View all leads & queries', 'All member permissions'],
            },
            {
              role: 'Member',
              color: roleColors.member,
              perms: ['Create & manage queries', 'View and export leads', 'Manage own profile', 'Use integrations'],
            },
          ].map(({ role, color, perms }) => (
            <div key={role} className="bg-white rounded-lg border border-zinc-200 p-4">
              <div className="mb-3">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                  color
                )}>
                  {role}
                </span>
              </div>
              <ul className="space-y-1.5">
                {perms.map((perm) => (
                  <li key={perm} className="flex items-start gap-2 text-xs text-zinc-600">
                    <svg className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm"
              onClick={() => {
                if (!inviteMutation.isPending) {
                  setShowInviteModal(false)
                  setInviteError(null)
                }
              }}
            />
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Invite Team Member</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Send an invitation email to join your workspace.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteError(null)
                  }}
                  disabled={inviteMutation.isPending}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors rounded-md disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label htmlFor="invite-email" className="block text-sm font-medium text-zinc-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="invite-email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    disabled={inviteMutation.isPending}
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:bg-zinc-50"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="block text-sm font-medium text-zinc-700">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    disabled={inviteMutation.isPending}
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 bg-white"
                  >
                    <option value="member">Member — Can view and manage leads</option>
                    <option value="admin">Admin — Can also manage team and settings</option>
                  </select>
                </div>

                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-600">
                    The invitee will receive an email with a link to join your workspace.
                    The invitation expires in <span className="font-medium">7 days</span>.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteError(null)
                    }}
                    disabled={inviteMutation.isPending}
                    className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending || !inviteEmail}
                    className={cn(
                      'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors',
                      (inviteMutation.isPending || !inviteEmail) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {inviteMutation.isPending ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 text-white" />
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

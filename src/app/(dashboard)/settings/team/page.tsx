'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils'

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

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

const roleColors = {
  owner: 'bg-amber-100 text-amber-700 ring-amber-200',
  admin: 'bg-purple-100 text-purple-700 ring-purple-200',
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
  if (!res.ok) throw new Error('Failed to cancel invite')
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

export default function TeamSettingsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: fetchMembers,
  })

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['team-invites'],
    queryFn: fetchInvites,
  })

  const inviteMutation = useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites'] })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const cancelInviteMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invites'] })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateMemberRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  const members = membersData?.members || []
  const invites = invitesData?.invites || []

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
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-900">Members ({members.length})</h2>
        </div>

        {membersLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="h-5 w-5 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
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
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                        {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">
                          {member.full_name || 'Unnamed'}
                        </p>
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
                  <td className="px-6 py-4 text-right">
                    {member.role !== 'owner' && (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => {
                            if (confirm(`Change ${member.full_name || member.email}'s role to ${e.target.value}?`)) {
                              updateRoleMutation.mutate({ id: member.id, role: e.target.value })
                            }
                          }}
                          className="rounded-md border border-zinc-300 text-sm py-1 px-2 focus:border-emerald-500 focus:ring-emerald-500"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${member.full_name || member.email} from the team?`)) {
                              removeMemberMutation.mutate(member.id)
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Remove member"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h2 className="font-semibold text-zinc-900">Pending Invites ({invites.length})</h2>
          </div>

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
            <tbody className="divide-y divide-zinc-200">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900">{invite.email}</p>
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
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {formatRelativeTime(invite.expires_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Cancel this invitation?')) {
                          cancelInviteMutation.mutate(invite.id)
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-zinc-900">Invite Team Member</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Send an invitation to join your workspace.
              </p>

              <form onSubmit={handleInvite} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="member">Member - Can view and manage leads</option>
                    <option value="admin">Admin - Can also manage team and settings</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className={cn(
                      'flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700',
                      inviteMutation.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
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

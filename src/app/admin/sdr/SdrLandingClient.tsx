'use client'

import Link from 'next/link'
import type { Workspace } from '@/types'

interface SdrConfig {
  workspace_id: string
  human_in_the_loop: boolean
}

interface WorkspaceStats {
  workspace: Workspace
  config: SdrConfig | null
  needsApproval: number
  replies30d: number
  autoSent30d: number
}

interface SdrLandingClientProps {
  stats: WorkspaceStats[]
  totalWorkspaces: number
  totalNeedsApproval: number
  totalReplies30d: number
  totalAutoSent30d: number
}

export function SdrLandingClient({
  stats,
  totalWorkspaces,
  totalNeedsApproval,
  totalReplies30d,
  totalAutoSent30d,
}: SdrLandingClientProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">AI SDR — Inbox Managers</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage AI-powered email replies for all client workspaces
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Workspaces</p>
          <p className="text-2xl font-bold text-zinc-900">{totalWorkspaces}</p>
        </div>
        <div className={`border rounded-xl p-4 ${totalNeedsApproval > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <p className={`text-xs mb-1 ${totalNeedsApproval > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
            Needs Approval
          </p>
          <p className={`text-2xl font-bold ${totalNeedsApproval > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
            {totalNeedsApproval}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Replies (30d)</p>
          <p className="text-2xl font-bold text-zinc-900">{totalReplies30d}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Auto-Sent (30d)</p>
          <p className="text-2xl font-bold text-zinc-900">{totalAutoSent30d}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mb-6">
        <Link
          href="/admin/sdr/inbox"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Open Inbox
        </Link>
        <Link
          href="/admin/sdr/knowledge"
          className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50 text-zinc-700 transition-colors"
        >
          Knowledge Base
        </Link>
        <Link
          href="/admin/sdr/dnc"
          className="px-4 py-2 text-sm border rounded-md hover:bg-zinc-50 text-zinc-700 transition-colors"
        >
          Do Not Contact List
        </Link>
      </div>

      {/* Workspace table */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Workspace</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">HiL Mode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Needs Approval</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Replies (30d)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No workspaces found.
                </td>
              </tr>
            ) : (
              stats.map(({ workspace, config, needsApproval, replies30d }) => (
                <tr key={workspace.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-zinc-800">{workspace.name}</div>
                    <div className="text-xs text-zinc-400">{workspace.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    {config ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                        ✓ Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-500 text-xs rounded-full">
                        Not Configured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {config ? (config.human_in_the_loop ? 'ON' : 'OFF') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {needsApproval > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        {needsApproval}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{replies30d}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/sdr/inbox?workspace_id=${workspace.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Inbox
                      </Link>
                      <Link
                        href={`/admin/sdr/config/${workspace.id}`}
                        className="text-sm text-zinc-500 hover:underline"
                      >
                        Configure
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

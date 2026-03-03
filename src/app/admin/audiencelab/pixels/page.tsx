'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Link2,
  Unlink,
  ExternalLink,
  RefreshCw,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Pixel {
  pixel_id: string
  website_name: string
  website_url: string
  last_sync_status: string | null
  last_sync_count: number
  last_sync_start: string | null
  is_mapped: boolean
  workspace_id: string | null
  workspace: { id: string; name: string; slug: string } | null
  trial_status: 'trial' | 'active' | 'expired' | null
  trial_ends_at: string | null
  is_active: boolean
  visitor_count_total: number
  visitor_count_identified: number
  last_v4_synced_at: string | null
  db_created_at: string | null
}

interface Workspace {
  id: string
  name: string
  slug: string
}

interface Stats {
  total: number
  mapped: number
  unmapped: number
  active_trials: number
  active_clients: number
  expired: number
}

function trialBadge(status: Pixel['trial_status']) {
  if (status === 'trial')   return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Trial</Badge>
  if (status === 'active')  return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
  if (status === 'expired') return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
  return <Badge variant="outline" className="text-zinc-500">Unmapped</Badge>
}

function daysRemaining(trial_ends_at: string | null): string | null {
  if (!trial_ends_at) return null
  const diff = Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'Expired'
  if (diff === 0) return 'Expires today'
  return `${diff}d left`
}

function syncDot(status: string | null) {
  if (status === 'success') return <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
  if (status === 'error')   return <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
  return <Circle className="h-2.5 w-2.5 fill-zinc-300 text-zinc-300" />
}

export default function AdminPixelsPage() {
  const [pixels, setPixels]       = useState<Pixel[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [mapTarget, setMapTarget]  = useState<Pixel | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const res  = await fetch('/api/admin/audiencelab/pixels')
      const data = await res.json()
      setPixels(data.pixels || [])
      setWorkspaces(data.workspaces || [])
      setStats(data.stats || null)
    } catch {
      toast.error('Failed to load pixels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const unmap = async (pixelId: string) => {
    if (!confirm('Remove workspace mapping for this pixel?')) return
    const res = await fetch(`/api/admin/audiencelab/pixels?pixel_id=${pixelId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Mapping removed'); load() }
    else        { toast.error('Failed to remove mapping') }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">AudienceLab Pixels</h1>
          <p className="text-sm text-zinc-500 mt-1">
            All pixels from AudienceLab — map clients to workspaces, track trial status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Provision Pixel
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total',          value: stats.total,          color: '' },
            { label: 'Mapped',         value: stats.mapped,         color: '' },
            { label: 'Unmapped',       value: stats.unmapped,       color: stats.unmapped > 0 ? 'text-amber-600' : '' },
            { label: 'Active Trials',  value: stats.active_trials,  color: 'text-amber-600' },
            { label: 'Active Clients', value: stats.active_clients, color: 'text-green-600' },
            { label: 'Expired',        value: stats.expired,        color: stats.expired > 0 ? 'text-red-600' : '' },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Pixels Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Pixels ({pixels.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-400">Loading...</div>
          ) : pixels.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">No pixels found in AudienceLab</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Trial Status</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead className="text-right">Visitors (total / ID&apos;d)</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pixels.map(pixel => {
                  const days = daysRemaining(pixel.trial_ends_at)
                  return (
                    <TableRow key={pixel.pixel_id}>
                      {/* Website */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {syncDot(pixel.last_sync_status)}
                          <div>
                            <div className="font-medium text-sm">{pixel.website_name}</div>
                            {pixel.website_url && (
                              <a
                                href={pixel.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                              >
                                {new URL(pixel.website_url).hostname}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Trial Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {trialBadge(pixel.trial_status)}
                          {days && (
                            <span className={`text-xs ${
                              days === 'Expired' ? 'text-red-500' :
                              days.startsWith('Expires') ? 'text-amber-500' : 'text-zinc-400'
                            }`}>
                              {days}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Workspace */}
                      <TableCell>
                        {pixel.workspace ? (
                          <div>
                            <div className="text-sm font-medium">{pixel.workspace.name}</div>
                            <div className="text-xs text-zinc-400">/{pixel.workspace.slug}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Not mapped</span>
                        )}
                      </TableCell>

                      {/* Visitor counts */}
                      <TableCell className="text-right">
                        {pixel.is_mapped ? (
                          <div className="text-sm tabular-nums">
                            <span>{pixel.visitor_count_total.toLocaleString()}</span>
                            <span className="text-zinc-400"> / </span>
                            <span className="text-green-600">{pixel.visitor_count_identified.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </TableCell>

                      {/* Last Sync */}
                      <TableCell>
                        {pixel.last_sync_start ? (
                          <div className="text-xs text-zinc-400">
                            {new Date(pixel.last_sync_start).toLocaleDateString()}
                            <div>{pixel.last_sync_count.toLocaleString()} records</div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-300">Never</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-1.5">
                          {pixel.is_mapped ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-zinc-500 hover:text-red-600"
                              onClick={() => unmap(pixel.pixel_id)}
                              title="Remove workspace mapping"
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setMapTarget(pixel)}
                            >
                              <Link2 className="h-3.5 w-3.5 mr-1" />
                              Map
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Map Pixel Modal */}
      {mapTarget && (
        <MapModal
          pixel={mapTarget}
          workspaces={workspaces}
          onClose={() => setMapTarget(null)}
          onSuccess={() => { setMapTarget(null); load() }}
        />
      )}

      {/* Provision Pixel Modal */}
      {createOpen && (
        <CreateModal
          workspaces={workspaces}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); load() }}
        />
      )}
    </div>
  )
}

// ─── Map Modal ────────────────────────────────────────────────────────────────

function MapModal({
  pixel,
  workspaces,
  onClose,
  onSuccess,
}: {
  pixel: Pixel
  workspaces: Workspace[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [workspaceId, setWorkspaceId] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!workspaceId) return
    setSaving(true)
    const res = await fetch('/api/admin/audiencelab/pixels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'map', pixel_id: pixel.pixel_id, workspace_id: workspaceId }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { toast.success(data.message); onSuccess() }
    else        { toast.error(data.error || 'Failed to map pixel') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-base">Map Pixel to Workspace</CardTitle>
          <p className="text-sm text-zinc-500">
            Assign <span className="font-medium">{pixel.website_name}</span> to a workspace
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={workspaceId}
            onChange={e => setWorkspaceId(e.target.value)}
            placeholder="Select workspace..."
            options={workspaces.map(w => ({ value: w.id, label: `${w.name} (/${w.slug})` }))}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={!workspaceId || saving}>
              {saving ? 'Mapping...' : 'Map Pixel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  workspaces,
  onClose,
  onSuccess,
}: {
  workspaces: Workspace[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [workspaceId, setWorkspaceId] = useState('')
  const [websiteName, setWebsiteName] = useState('')
  const [websiteUrl,  setWebsiteUrl]  = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!workspaceId || !websiteName || !websiteUrl) return
    setSaving(true)
    const res = await fetch('/api/admin/audiencelab/pixels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:       'create',
        workspace_id: workspaceId,
        website_name: websiteName,
        website_url:  websiteUrl,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { toast.success(data.message); onSuccess() }
    else        { toast.error(data.error || 'Failed to provision pixel') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-base">Provision New Pixel</CardTitle>
          <p className="text-sm text-zinc-500">Creates a new AudienceLab pixel and maps it to a workspace</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Workspace</label>
            <Select
              value={workspaceId}
              onChange={e => setWorkspaceId(e.target.value)}
              placeholder="Select workspace..."
              options={workspaces.map(w => ({ value: w.id, label: w.name }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website Name</label>
            <Input
              placeholder="Acme Corp"
              value={websiteName}
              onChange={e => setWebsiteName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website URL</label>
            <Input
              placeholder="https://acmecorp.com"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={!workspaceId || !websiteName || !websiteUrl || saving}>
              {saving ? 'Provisioning...' : 'Provision Pixel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Plus, Link2 } from 'lucide-react'
import { toast } from 'sonner'

interface Pixel {
  pixel_id: string
  workspace_id: string
  website_name: string | null
  website_url: string | null
  install_url: string | null
  created_at: string
  workspaces: {
    id: string
    name: string
    slug: string
  } | null
  stats: {
    total: number
    processed: number
    unprocessed: number
  }
}

interface OrphanedPixel {
  pixel_id: string
  orphaned_count: number
}

export default function AdminPixelsPage() {
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [orphaned, setOrphaned] = useState<OrphanedPixel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedOrphan, setSelectedOrphan] = useState<OrphanedPixel | null>(null)

  const loadPixels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/audiencelab/pixels')
      const data = await response.json()
      setPixels(data.pixels || [])
      setOrphaned(data.orphaned || [])
    } catch (error) {
      toast.error('Failed to load pixels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPixels()
  }, [])

  const handleMapPixel = async (pixelId: string, workspaceId: string) => {
    try {
      const response = await fetch('/api/admin/audiencelab/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'map',
          pixel_id: pixelId,
          workspace_id: workspaceId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Pixel mapped successfully')
        setShowMapModal(false)
        setSelectedOrphan(null)
        loadPixels()
      } else {
        toast.error(data.error || 'Failed to map pixel')
      }
    } catch (error) {
      toast.error('Failed to map pixel')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading pixels...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audience Labs Pixels</h1>
          <p className="text-muted-foreground mt-2">
            Manage pixel → workspace mappings and create new pixels for customers
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Pixel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pixels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pixels.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pixels.reduce((sum, p) => sum + p.stats.total, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Orphaned Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orphaned.reduce((sum, o) => sum + o.orphaned_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {orphaned.length} unknown pixels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orphaned Pixels Alert */}
      {orphaned.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Orphaned Events Need Mapping</CardTitle>
            </div>
            <CardDescription>
              {orphaned.length} unknown pixel(s) have events that need workspace assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orphaned.map((orphan) => (
                <div
                  key={orphan.pixel_id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <code className="text-sm font-mono">{orphan.pixel_id}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      {orphan.orphaned_count} orphaned events
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOrphan(orphan)
                      setShowMapModal(true)
                    }}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Map to Workspace
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pixels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mapped Pixels</CardTitle>
          <CardDescription>All pixels currently mapped to workspaces</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pixel ID</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pixels.map((pixel) => (
                <TableRow key={pixel.pixel_id}>
                  <TableCell>
                    <code className="text-xs">{pixel.pixel_id.substring(0, 12)}...</code>
                  </TableCell>
                  <TableCell>
                    {pixel.workspaces ? (
                      <div>
                        <div className="font-medium">{pixel.workspaces.name}</div>
                        <div className="text-sm text-muted-foreground">
                          /{pixel.workspaces.slug}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pixel.website_name || pixel.website_url ? (
                      <div>
                        <div className="font-medium">{pixel.website_name}</div>
                        <div className="text-sm text-muted-foreground">{pixel.website_url}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{pixel.stats.total.toLocaleString()} total</div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {pixel.stats.processed} processed
                        </Badge>
                        {pixel.stats.unprocessed > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {pixel.stats.unprocessed} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pixel.stats.total > 0 ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Active</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No events</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(pixel.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pixels.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pixels mapped yet</p>
              <p className="text-sm mt-2">Create a pixel to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Pixel Modal */}
      {showMapModal && selectedOrphan && (
        <MapPixelModal
          pixelId={selectedOrphan.pixel_id}
          orphanedCount={selectedOrphan.orphaned_count}
          onClose={() => {
            setShowMapModal(false)
            setSelectedOrphan(null)
          }}
          onMap={handleMapPixel}
        />
      )}
    </div>
  )
}

interface MapPixelModalProps {
  pixelId: string
  orphanedCount: number
  onClose: () => void
  onMap: (pixelId: string, workspaceId: string) => void
}

function MapPixelModal({ pixelId, orphanedCount, onClose, onMap }: MapPixelModalProps) {
  const [workspaceId, setWorkspaceId] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Map Pixel to Workspace</CardTitle>
          <CardDescription>
            Assign <code className="text-xs bg-muted px-1 py-0.5 rounded">{pixelId}</code> to a workspace
            to rescue {orphanedCount} orphaned events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Workspace ID</label>
            <Input
              placeholder="Enter workspace UUID"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can find this in the workspaces table
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onMap(pixelId, workspaceId)}
              disabled={!workspaceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)}
            >
              Map Pixel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Failed Operations Admin Page
 * View and manage failed emails, webhooks, and jobs from the dead letter queue
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react'

type OperationType = 'email' | 'webhook' | 'job'

interface FailedOperation {
  id: string
  operation_type: OperationType
  operation_id: string | null
  event_data: any
  error_message: string
  error_stack: string | null
  retry_count: number
  last_retry_at: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export default function FailedOperationsPage() {
  const [operations, setOperations] = useState<FailedOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OperationType>('all')
  const [showResolved, setShowResolved] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<FailedOperation | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    loadOperations()
  }, [filter, showResolved])

  async function loadOperations() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        resolved: showResolved.toString(),
      })

      if (filter !== 'all') {
        params.append('type', filter)
      }

      const response = await fetch(`/api/admin/failed-operations?${params}`)
      if (!response.ok) throw new Error('Failed to load operations')

      const data = await response.json()
      setOperations(data.operations || [])
    } catch (error) {
      console.error('Failed to load operations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function retryOperation(id: string) {
    setRetrying(id)
    try {
      const response = await fetch(`/api/admin/failed-operations/${id}/retry`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to retry operation')

      const result = await response.json()

      if (result.success) {
        alert('Operation queued for retry')
        await loadOperations()
      } else {
        alert(`Failed to retry: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to retry operation:', error)
      alert('Failed to retry operation')
    } finally {
      setRetrying(null)
    }
  }

  async function resolveOperation(id: string) {
    setResolving(id)
    try {
      const response = await fetch(`/api/admin/failed-operations/${id}/resolve`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to resolve operation')

      alert('Operation marked as resolved')
      await loadOperations()
    } catch (error) {
      console.error('Failed to resolve operation:', error)
      alert('Failed to resolve operation')
    } finally {
      setResolving(null)
    }
  }

  function viewDetails(operation: FailedOperation) {
    setSelectedOperation(operation)
    setDetailsOpen(true)
  }

  const filteredOperations = operations.filter((op) => {
    if (filter === 'all') return true
    return op.operation_type === filter
  })

  const stats = {
    total: filteredOperations.length,
    email: operations.filter((op) => op.operation_type === 'email').length,
    webhook: operations.filter((op) => op.operation_type === 'webhook').length,
    job: operations.filter((op) => op.operation_type === 'job').length,
    unresolved: operations.filter((op) => !op.resolved_at).length,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Failed Operations</h1>
          <p className="text-muted-foreground">
            Monitor and retry failed emails, webhooks, and background jobs
          </p>
        </div>
        <Button onClick={loadOperations} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.webhook}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.job}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unresolved}</div>
          </CardContent>
        </Card>
      </div>

      {stats.unresolved > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: {stats.unresolved} unresolved operations in queue. High failure rates detected.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">Emails</TabsTrigger>
            <TabsTrigger value="webhook">Webhooks</TabsTrigger>
            <TabsTrigger value="job">Jobs</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant={showResolved ? 'default' : 'outline'}
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? 'Show Unresolved Only' : 'Show All'}
        </Button>
      </div>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Operations</CardTitle>
          <CardDescription>
            {showResolved
              ? 'All failed operations (including resolved)'
              : 'Unresolved failed operations requiring attention'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No failed operations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Operation ID</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell>
                      <Badge variant="outline">{operation.operation_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {operation.operation_id?.substring(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={operation.error_message}>
                      {operation.error_message}
                    </TableCell>
                    <TableCell>{operation.retry_count}</TableCell>
                    <TableCell>{new Date(operation.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {operation.resolved_at ? (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50">
                          <XCircle className="mr-1 h-3 w-3" />
                          Unresolved
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewDetails(operation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!operation.resolved_at && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryOperation(operation.id)}
                              disabled={retrying === operation.id}
                            >
                              <RefreshCw
                                className={`mr-1 h-3 w-3 ${retrying === operation.id ? 'animate-spin' : ''}`}
                              />
                              Retry
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveOperation(operation.id)}
                              disabled={resolving === operation.id}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
            <DialogDescription>
              Detailed information about the failed operation
            </DialogDescription>
          </DialogHeader>

          {selectedOperation && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Info</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>{' '}
                    <code className="text-xs">{selectedOperation.id}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <Badge variant="outline">{selectedOperation.operation_type}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Operation ID:</span>{' '}
                    <code className="text-xs">{selectedOperation.operation_id || 'N/A'}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retry Count:</span>{' '}
                    {selectedOperation.retry_count}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    {new Date(selectedOperation.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Retry:</span>{' '}
                    {selectedOperation.last_retry_at
                      ? new Date(selectedOperation.last_retry_at).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Error Message</h3>
                <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">
                  {selectedOperation.error_message}
                </pre>
              </div>

              {selectedOperation.error_stack && (
                <div>
                  <h3 className="font-semibold mb-2">Stack Trace</h3>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-48">
                    {selectedOperation.error_stack}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Event Data</h3>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-64">
                  {JSON.stringify(selectedOperation.event_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedOperation && !selectedOperation.resolved_at && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    retryOperation(selectedOperation.id)
                    setDetailsOpen(false)
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button
                  onClick={() => {
                    resolveOperation(selectedOperation.id)
                    setDetailsOpen(false)
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Resolved
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ImportLeadsDialog } from '@/components/crm/dialogs/ImportLeadsDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import {
  Users,
  Search,
  Filter,
  FileInput,
  MoreHorizontal,
  X,
  Eye,
  Pencil,
  Trash2,
  Copy,
  FileSpreadsheet,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Mail,
  Phone,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { LeadTableRow } from '@/types/crm.types'
import { cn } from '@/lib/utils'

interface EnhancedLeadsTableProps {
  data: LeadTableRow[]
  onRowClick?: (lead: LeadTableRow) => void
  onCreateClick?: () => void
  isLoading?: boolean
}

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'lost', 'converted']
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

export function EnhancedLeadsTable({
  data,
  onRowClick,
  onCreateClick,
  isLoading = false,
}: EnhancedLeadsTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [sourceFilter, setSourceFilter] = React.useState<string>('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)

  const hasActiveFilters = statusFilter !== 'all' || sourceFilter !== 'all'

  // Get unique sources from data
  const sources = React.useMemo(() => {
    const uniqueSources = new Set(data.map((lead) => lead.source).filter(Boolean))
    return Array.from(uniqueSources)
  }, [data])

  // Filter leads
  const filteredLeads = React.useMemo(() => {
    return data.filter((lead) => {
      const matchesSearch =
        lead.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [data, searchQuery, statusFilter, sourceFilter])

  const totalPages = Math.ceil(filteredLeads.length / pageSize)

  const paginatedLeads = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredLeads.slice(startIndex, endIndex)
  }, [filteredLeads, currentPage, pageSize])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, sourceFilter, pageSize])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setSourceFilter('all')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-amber-100 text-amber-700 border-amber-200',
      qualified: 'bg-green-100 text-green-700 border-green-200',
      lost: 'bg-gray-100 text-gray-700 border-gray-200',
      converted: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || ''
    const last = lastName?.[0] || ''
    return (first + last).toUpperCase() || '??'
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:px-6 sm:py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7 sm:size-9 shrink-0 border-gray-200"
          >
            <Users className="size-4 sm:size-5 text-gray-600" />
          </Button>
          <span className="text-sm sm:text-base font-semibold text-gray-900">Leads</span>
          <Badge
            variant="secondary"
            className="ml-1 text-[10px] sm:text-xs bg-blue-50 text-blue-700 border-blue-200"
          >
            {filteredLeads.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 w-full sm:w-[200px] lg:w-[240px] h-9 sm:h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 gap-2 border-gray-200',
                  hasActiveFilters && 'border-blue-500 bg-blue-50 text-blue-700'
                )}
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && <span className="size-2 rounded-full bg-blue-600" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-700">
                Filter by Status
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'all'}
                onCheckedChange={() => setStatusFilter('all')}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}

              {sources.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-semibold text-gray-700">
                    Filter by Source
                  </DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={sourceFilter === 'all'}
                    onCheckedChange={() => setSourceFilter('all')}
                  >
                    All Sources
                  </DropdownMenuCheckboxItem>
                  {sources.slice(0, 8).map((source) => (
                    <DropdownMenuCheckboxItem
                      key={source}
                      checked={sourceFilter === source}
                      onCheckedChange={() => setSourceFilter(source)}
                    >
                      {source}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters} className="text-red-600">
                    <X className="size-4 mr-2" />
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:block w-px h-[22px] bg-gray-200" />

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-gray-200"
            onClick={() => setImportDialogOpen(true)}
          >
            <FileInput className="size-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>

          <Button
            size="sm"
            onClick={onCreateClick}
            className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Lead</span>
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-[10px] sm:text-xs text-gray-600 font-medium">Active Filters:</span>
          {statusFilter !== 'all' && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-6 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
              onClick={() => setStatusFilter('all')}
            >
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <X className="size-3" />
            </Badge>
          )}
          {sourceFilter !== 'all' && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer text-[10px] sm:text-xs h-6 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
              onClick={() => setSourceFilter('all')}
            >
              {sourceFilter}
              <X className="size-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-gray-100">
              <TableHead className="w-[40px] font-semibold text-gray-700 text-xs">#</TableHead>
              <TableHead className="min-w-[180px] font-semibold text-gray-700 text-xs">
                Name
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[200px] font-semibold text-gray-700 text-xs">
                Email
              </TableHead>
              <TableHead className="hidden lg:table-cell min-w-[140px] font-semibold text-gray-700 text-xs">
                Company
              </TableHead>
              <TableHead className="min-w-[100px] font-semibold text-gray-700 text-xs">
                Status
              </TableHead>
              <TableHead className="hidden xl:table-cell min-w-[100px] font-semibold text-gray-700 text-xs">
                Source
              </TableHead>
              <TableHead className="hidden sm:table-cell font-semibold text-gray-700 text-xs">
                Created
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-gray-500 text-sm">
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-gray-500 text-sm">
                  No leads found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead, index) => {
                const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
                const initials = getInitials(lead.first_name, lead.last_name)

                return (
                  <TableRow
                    key={lead.id}
                    onClick={() => onRowClick?.(lead)}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors border-gray-100"
                  >
                    <TableCell className="font-medium text-xs text-gray-600">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 bg-gradient-to-br from-blue-500 to-blue-600">
                          <AvatarFallback className="text-xs font-bold text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="font-medium text-sm text-gray-900 block truncate">
                            {fullName}
                          </span>
                          <span className="text-xs text-gray-500 md:hidden">{lead.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Mail className="size-3.5 text-gray-400" />
                        {lead.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-700 text-sm">
                      {lead.company_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs font-medium', getStatusColor(lead.status))}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-gray-600 text-sm">
                      {lead.source || '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-600 text-sm">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRowClick?.(lead)}>
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="size-4 mr-2" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="size-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline font-medium">Rows per page:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="h-8 w-[70px] border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-gray-600 font-medium">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredLeads.length)} of{' '}
            {filteredLeads.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-gray-200"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-gray-200"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1 mx-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="icon"
                  className={cn(
                    'size-8',
                    currentPage === pageNum
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-8 border-gray-200"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-gray-200"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportLeadsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          // Refresh the page to show new leads
          window.location.reload()
        }}
      />
    </div>
  )
}

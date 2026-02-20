'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  User,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Contact, ContactWithCompany } from '@/types/crm.types'
import { cn } from '@/lib/utils'

interface EnhancedContactsTableProps {
  data: ContactWithCompany[]
  onRowClick?: (contact: ContactWithCompany) => void
  onCreateClick?: () => void
  isLoading?: boolean
}

const STATUS_OPTIONS = ['Active', 'Prospect', 'Inactive', 'Lost']
const SENIORITY_OPTIONS = ['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor']
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

export function EnhancedContactsTable({
  data,
  onRowClick,
  onCreateClick,
  isLoading = false,
}: EnhancedContactsTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [seniorityFilter, setSeniorityFilter] = React.useState<string>('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  // Multi-dimensional filtering
  const filteredContacts = React.useMemo(() => {
    return data.filter((contact) => {
      const fullName = contact.full_name ||
        [contact.first_name, contact.last_name].filter(Boolean).join(' ')

      const matchesSearch =
        fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
      const matchesSeniority = seniorityFilter === 'all' || contact.seniority_level === seniorityFilter

      return matchesSearch && matchesStatus && matchesSeniority
    })
  }, [data, searchQuery, statusFilter, seniorityFilter])

  // Smart pagination
  const totalPages = Math.ceil(filteredContacts.length / pageSize)
  const paginatedContacts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredContacts.slice(startIndex, endIndex)
  }, [filteredContacts, currentPage, pageSize])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, seniorityFilter, pageSize])

  // Check if filters are active
  const hasActiveFilters = statusFilter !== 'all' || seniorityFilter !== 'all'

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all')
    setSeniorityFilter('all')
    setSearchQuery('')
  }

  // Get contact initials for avatar
  const getInitials = (contact: ContactWithCompany) => {
    const fullName = contact.full_name ||
      [contact.first_name, contact.last_name].filter(Boolean).join(' ')

    if (!fullName) return '?'

    const words = fullName.trim().split(' ')
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  // Get status color (light mode + blue cursive theme)
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-100 text-green-700 border-green-200',
      Prospect: 'bg-blue-100 text-blue-700 border-blue-200',
      Inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      Lost: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Get seniority badge color
  const getSeniorityColor = (seniority?: string) => {
    const colors: Record<string, string> = {
      'C-Level': 'bg-blue-100 text-blue-700 border-blue-200',
      'VP': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Director': 'bg-blue-100 text-blue-700 border-blue-200',
      'Manager': 'bg-teal-100 text-teal-700 border-teal-200',
      'Individual Contributor': 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[seniority || ''] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisibleButtons = 5

    if (totalPages <= maxVisibleButtons) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <Button
            key={i}
            variant={currentPage === i ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentPage(i)}
            className={cn(
              'h-8 w-8 p-0',
              currentPage === i &&
                'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
            )}
          >
            {i}
          </Button>
        )
      }
    } else {
      // Smart pagination: show first, last, and pages around current
      for (let i = 0; i < Math.min(maxVisibleButtons, totalPages); i++) {
        let pageNum: number

        if (totalPages <= maxVisibleButtons) {
          pageNum = i + 1
        } else if (currentPage <= 3) {
          // Near start
          pageNum = i + 1
        } else if (currentPage >= totalPages - 2) {
          // Near end
          pageNum = totalPages - maxVisibleButtons + i + 1
        } else {
          // Middle
          pageNum = currentPage - 2 + i
        }

        buttons.push(
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentPage(pageNum)}
            className={cn(
              'h-8 w-8 p-0',
              currentPage === pageNum &&
                'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
            )}
          >
            {pageNum}
          </Button>
        )
      }
    }

    return buttons
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-sm text-gray-500">Loading contacts...</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Import Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Import from</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>CSV File</DropdownMenuItem>
                <DropdownMenuItem>Excel File</DropdownMenuItem>
                <DropdownMenuItem>CRM System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Contact Button */}
            {onCreateClick && (
              <Button
                size="sm"
                onClick={onCreateClick}
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Contact
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-start">
                <Filter className="mr-2 h-4 w-4" />
                Status
                {statusFilter !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 rounded-sm px-1 text-xs bg-blue-100 text-blue-700"
                  >
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
                  onCheckedChange={(checked) => setStatusFilter(checked ? status : 'all')}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Seniority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-start">
                <Filter className="mr-2 h-4 w-4" />
                Seniority
                {seniorityFilter !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 rounded-sm px-1 text-xs bg-blue-100 text-blue-700"
                  >
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by seniority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={seniorityFilter === 'all'}
                onCheckedChange={() => setSeniorityFilter('all')}
              >
                All Levels
              </DropdownMenuCheckboxItem>
              {SENIORITY_OPTIONS.map((seniority) => (
                <DropdownMenuCheckboxItem
                  key={seniority}
                  checked={seniorityFilter === seniority}
                  onCheckedChange={(checked) => setSeniorityFilter(checked ? seniority : 'all')}
                >
                  {seniority}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                onClick={() => setStatusFilter('all')}
              >
                Status: {statusFilter}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {seniorityFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                onClick={() => setSeniorityFilter('all')}
              >
                Seniority: {seniorityFilter}
                <X className="h-3 w-3" />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-200">
              <TableHead className="w-12">
                <input type="checkbox" className="rounded border-gray-300" />
              </TableHead>
              <TableHead className="min-w-[200px]">Name</TableHead>
              <TableHead className="hidden md:table-cell">Title</TableHead>
              <TableHead className="hidden lg:table-cell">Company</TableHead>
              <TableHead className="hidden xl:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="h-12 w-12 text-gray-300" />
                    <p className="text-sm font-medium text-gray-900">No contacts found</p>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      {hasActiveFilters
                        ? 'Try adjusting your filters to see results.'
                        : 'Contacts are created from your leads. Import leads or browse the marketplace to get started.'}
                    </p>
                    {!hasActiveFilters && (
                      <a
                        href="/leads/discover"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Browse Marketplace
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => {
                const fullName = contact.full_name ||
                  [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
                  'Unnamed Contact'
                const companyName = contact.companies?.name

                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer border-gray-100 hover:bg-blue-50/50 transition-colors"
                    onClick={() => onRowClick?.(contact)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-blue-100 text-blue-700 border border-blue-200">
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(contact)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{fullName}</div>
                          {contact.email && (
                            <div className="text-xs text-gray-500">{contact.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-700">
                        {contact.title || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-gray-700">
                        {companyName || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-sm text-gray-700">
                        {contact.email || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn('text-xs border w-fit', getStatusColor(contact.status))}>
                          {contact.status}
                        </Badge>
                        {contact.seniority_level && (
                          <Badge variant="outline" className={cn('text-xs border w-fit', getSeniorityColor(contact.seniority_level))}>
                            {contact.seniority_level}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
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
      {filteredContacts.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-16 border-gray-300">
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
            <span className="text-sm text-gray-500">
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredContacts.length)} of{' '}
              {filteredContacts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {renderPaginationButtons()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

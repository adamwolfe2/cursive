'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Filter, ArrowUpDown, Settings2, ChevronDown, ExternalLink, Plus, Mail, Phone, Building2, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { LeadTableRow } from '@/types/crm.types'
import { formatDistanceToNow } from 'date-fns'
import {
  MobileCard,
  MobileCardHeader,
  MobileCardField,
  MobileCardDivider,
  MobileCardFooter,
} from '@/components/ui/mobile-card'

interface TwentyStyleTableProps {
  data: LeadTableRow[]
  onRowClick?: (lead: LeadTableRow) => void
}

/**
 * Twenty.com CRM Table - Pixel-perfect recreation
 * Clean, minimal design with Notion-like aesthetic
 */
export function TwentyStyleTable({ data, onRowClick }: TwentyStyleTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [allSelected, setAllSelected] = useState(false)

  const toggleAllRows = () => {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((lead) => lead.id)))
    }
    setAllSelected(!allSelected)
  }

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
    setAllSelected(newSelection.size === data.length && data.length > 0)
  }

  // Get company favicon
  const getCompanyFavicon = (url: string | null) => {
    if (!url) return null
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  // Get initials for avatar
  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (firstName) return firstName.charAt(0).toUpperCase()
    if (lastName) return lastName.charAt(0).toUpperCase()
    return '?'
  }

  // Generate consistent color for avatar based on name
  const getAvatarColor = (name: string | null) => {
    if (!name) return 'bg-gray-200 text-gray-600'
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Calculate statistics for bottom bar
  const totalEmails = data.filter(l => l.email).length
  const emptyPhones = data.filter(l => !l.phone).length
  const emptyPhonePercentage = data.length > 0 ? Math.round((emptyPhones / data.length) * 100) : 0

  // Mobile card rendering helper
  const renderMobileCard = (lead: LeadTableRow) => {
    const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed'
    const initials = getInitials(lead.first_name, lead.last_name)
    const avatarColor = getAvatarColor(fullName)
    const isSelected = selectedRows.has(lead.id)

    return (
      <MobileCard
        key={lead.id}
        selected={isSelected}
        onClick={() => onRowClick?.(lead)}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleRow(lead.id, { stopPropagation: () => {} } as React.MouseEvent)}
              onClick={(e) => e.stopPropagation()}
              className="border-gray-300"
            />
          </div>

          {/* Avatar and Name */}
          <div className="flex-1 min-w-0">
            <MobileCardHeader
              title={fullName}
              subtitle={lead.job_title || undefined}
              avatar={
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  avatarColor
                )}>
                  {initials}
                </div>
              }
            />
          </div>
        </div>

        {/* Company */}
        {lead.company_name && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground truncate">{lead.company_name}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2">
          {lead.email && (
            <MobileCardField
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={
                <a
                  href={`mailto:${lead.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:underline truncate"
                >
                  {lead.email}
                </a>
              }
            />
          )}
          {lead.phone && (
            <MobileCardField
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={
                <a
                  href={`tel:${lead.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:underline"
                >
                  {lead.phone}
                </a>
              }
            />
          )}
        </div>

        {/* Location */}
        {lead.city && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{lead.city}</span>
          </div>
        )}

        <MobileCardDivider />

        {/* Footer with metadata */}
        <MobileCardFooter className="justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
          {lead.linkedin_url && (
            <a
              href={lead.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              LinkedIn
            </a>
          )}
        </MobileCardFooter>
      </MobileCard>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header Toolbar - Twenty.com style */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* View Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-sm font-normal text-gray-700 hover:bg-gray-100"
              >
                All People
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem>All People</DropdownMenuItem>
              <DropdownMenuItem>New Leads</DropdownMenuItem>
              <DropdownMenuItem>Contacted</DropdownMenuItem>
              <DropdownMenuItem>Qualified</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Row count badge */}
          <span className="flex h-5 items-center rounded-md bg-gray-100 px-1.5 text-xs font-medium text-gray-600">
            {data.length}
          </span>
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 sm:px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 sm:px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sort</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 sm:px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100 hidden sm:flex"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Options</span>
          </Button>

          {/* Separator */}
          <div className="mx-1 h-4 w-px bg-gray-300 hidden sm:block" />

          {/* New record button */}
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-gray-900 px-2 sm:px-2.5 text-sm font-normal hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New record</span>
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="flex-1 overflow-auto p-4 space-y-3 md:hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-gray-500">No people yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add leads from the marketplace or import them
            </p>
          </div>
        ) : (
          data.map(renderMobileCard)
        )}
      </div>

      {/* Desktop Table View */}
      <div className="flex-1 overflow-auto hidden md:block">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-200">
              {/* Checkbox column */}
              <th className="w-12 px-3 py-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAllRows}
                  className="border-gray-300"
                />
              </th>

              {/* Name */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Name
              </th>

              {/* Email */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Email
              </th>

              {/* Company */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Company
              </th>

              {/* Phone */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Phone
              </th>

              {/* Created */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Created
              </th>

              {/* City */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                City
              </th>

              {/* LinkedIn */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                LinkedIn
              </th>

              {/* Actions column */}
              <th className="w-8 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-500">No people yet</p>
                    <p className="text-xs text-gray-400">
                      Add leads from the marketplace or import them
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((lead) => {
                const isSelected = selectedRows.has(lead.id)
                const faviconUrl = getCompanyFavicon(lead.website_url)
                const fullName = [lead.first_name, lead.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unnamed'
                const initials = getInitials(lead.first_name, lead.last_name)
                const avatarColor = getAvatarColor(fullName)

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onRowClick?.(lead)}
                    className={cn(
                      'group cursor-pointer transition-colors hover:bg-gray-50',
                      isSelected && 'bg-blue-50/30'
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleRow(lead.id, { stopPropagation: () => {} } as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-gray-300"
                      />
                    </td>

                    {/* Name with avatar */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          avatarColor
                        )}>
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {fullName}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {lead.email || '-'}
                      </span>
                    </td>

                    {/* Company with logo */}
                    <td className="px-3 py-2.5">
                      {lead.company_name ? (
                        <div className="flex items-center gap-2">
                          {faviconUrl ? (
                            <img
                              src={faviconUrl}
                              alt=""
                              className="h-4 w-4 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="h-4 w-4 rounded bg-gray-200" />
                          )}
                          <span className="text-sm text-gray-900">
                            {lead.company_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {lead.phone || '-'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </span>
                    </td>

                    {/* City */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {lead.city || '-'}
                      </span>
                    </td>

                    {/* LinkedIn */}
                    <td className="px-3 py-2.5">
                      {lead.linkedin_url ? (
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Actions - shown on hover */}
                    <td className="px-3 py-2.5">
                      <div className="opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronDown className="h-4 w-4 rotate-90" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom statistics bar - Twenty.com style */}
      {data.length > 0 && (
        <div className="flex items-center gap-4 sm:gap-6 border-t border-gray-200 bg-gray-50 px-3 sm:px-4 py-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="font-medium text-gray-700">Emails</span>
            <span className="font-semibold text-gray-900">{totalEmails}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="font-medium text-gray-700 hidden sm:inline">Empty of</span>
            <span className="font-medium text-gray-700 sm:hidden">No</span>
            <span className="font-medium text-gray-700">Phones</span>
            <span className="font-semibold text-gray-900">{emptyPhonePercentage}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

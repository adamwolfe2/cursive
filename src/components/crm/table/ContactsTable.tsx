'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Filter, ArrowUpDown, Settings2, ChevronDown, Mail, Phone, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types/crm.types'
import { formatDistanceToNow } from 'date-fns'

interface ContactsTableProps {
  data: Contact[]
  onRowClick?: (contact: Contact) => void
  onCreateClick?: () => void
}

/**
 * Twenty.com style Contacts Table
 * Clean, minimal design matching Companies/Leads view
 */
export function ContactsTable({ data, onRowClick, onCreateClick }: ContactsTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [allSelected, setAllSelected] = useState(false)

  const toggleAllRows = () => {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((contact) => contact.id)))
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

  // Generate consistent color for avatar based on name
  const getAvatarColor = (name: string | null) => {
    if (!name) return 'bg-gray-200 text-gray-600'
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Get initials from full name
  const getInitials = (fullName: string | null) => {
    if (!fullName) return '??'
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Calculate statistics for bottom bar
  const totalEmails = data.filter((c) => c.email).length
  const emptyPhones = data.filter((c) => !c.phone).length
  const emptyPhonePercentage = data.length > 0 ? Math.round((emptyPhones / data.length) * 100) : 0

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* View Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-sm font-normal text-gray-700 hover:bg-gray-100"
              >
                All Contacts
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem>All Contacts</DropdownMenuItem>
              <DropdownMenuItem>Active</DropdownMenuItem>
              <DropdownMenuItem>Prospects</DropdownMenuItem>
              <DropdownMenuItem>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Row count badge */}
          <span className="flex h-5 items-center rounded-md bg-gray-100 px-1.5 text-xs font-medium text-gray-600">
            {data.length}
          </span>
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Options
          </Button>

          {/* Separator */}
          <div className="mx-1 h-4 w-px bg-gray-300" />

          {/* New record button */}
          <Button
            size="sm"
            onClick={onCreateClick}
            className="h-7 gap-1.5 bg-gray-900 px-2.5 text-sm font-normal hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" />
            New contact
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
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

              {/* Job Title */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Job Title
              </th>

              {/* Created */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Created
              </th>

              {/* Actions column */}
              <th className="w-8 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-500">No contacts yet</p>
                    <p className="text-xs text-gray-400">
                      Add contacts to build your network and track relationships
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((contact) => {
                const isSelected = selectedRows.has(contact.id)
                const fullName = contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed Contact'
                const initials = getInitials(fullName)
                const avatarColor = getAvatarColor(fullName)

                return (
                  <tr
                    key={contact.id}
                    onClick={() => onRowClick?.(contact)}
                    className={cn(
                      'group cursor-pointer transition-colors hover:bg-gray-50',
                      isSelected && 'bg-blue-50/30'
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(contact.id, { stopPropagation: () => {} } as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-gray-300"
                      />
                    </td>

                    {/* Name with avatar */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white",
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
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Company */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {(contact as any).companies?.name || '-'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2.5">
                      {contact.phone ? (
                        <span className="text-sm text-gray-600">{contact.phone}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Job Title */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {contact.title || '-'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                      </span>
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

      {/* Bottom statistics bar */}
      {data.length > 0 && (
        <div className="flex items-center gap-6 border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">With Email</span>
            <span className="font-semibold text-gray-900">{totalEmails}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">Empty Phone</span>
            <span className="font-semibold text-gray-900">{emptyPhonePercentage}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

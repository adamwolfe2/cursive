'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Users, Plus, Filter, ArrowUpDown, Mail, Phone } from 'lucide-react'
import { CRMPageContainer } from '@/components/crm/layout/CRMPageContainer'
import { CRMViewBar } from '@/components/crm/layout/CRMViewBar'
import { CRMThreeColumnLayout } from '@/components/crm/layout/CRMThreeColumnLayout'
import { CRMTableView } from '@/components/crm/views/CRMTableView'
import { KanbanBoard } from '@/components/crm/board/KanbanBoard'
import { RecordDrawer } from '@/components/crm/drawer/RecordDrawer'
import { EmptyState } from '@/components/crm/empty-states/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCRMViewStore } from '@/lib/stores/crm-view-store'
import { useToast } from '@/lib/hooks/use-toast'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { formatDistanceToNow } from 'date-fns'
import { CreateContactDialog } from './CreateContactDialog'
import type { Contact } from '@/types/crm.types'

interface ContactsPageClientProps {
  initialData: Contact[]
}

export function ContactsPageClient({ initialData }: ContactsPageClientProps) {
  const [contacts] = useState<Contact[]>(initialData)
  const viewType = useCRMViewStore((state) => state.getViewType('contacts'))
  const setViewType = useCRMViewStore((state) => state.setViewType)
  const toast = useToast()

  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)


  const tableColumns = [
    {
      key: 'name',
      header: 'Contact',
      width: '25%',
      render: (contact: Contact) => (
        <div>
          <div className="font-medium text-gray-900">{contact.full_name || 'Unnamed Contact'}</div>
          <div className="text-sm text-gray-500">{contact.title || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'seniority',
      header: 'Seniority',
      width: '20%',
      render: (contact: Contact) => (
        <span className="text-gray-700">{contact.seniority_level || 'N/A'}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '20%',
      render: (contact: Contact) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{contact.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      width: '15%',
      render: (contact: Contact) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{contact.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (contact: Contact) => {
        const colors = {
          Active: 'bg-green-100 text-green-800',
          Prospect: 'bg-blue-100 text-blue-800',
          Inactive: 'bg-gray-100 text-gray-800',
          Lost: 'bg-red-100 text-red-800',
        }
        return (
          <Badge className={colors[contact.status as keyof typeof colors] || ''}>
            {contact.status}
          </Badge>
        )
      },
    },
  ]

  const { boardColumns, boardData } = useMemo(() => {
    const prospectContacts = contacts.filter((c) => c.status === 'Prospect')
    const activeContacts = contacts.filter((c) => c.status === 'Active')
    const inactiveContacts = contacts.filter((c) => c.status === 'Inactive')
    const lostContacts = contacts.filter((c) => c.status === 'Lost')

    return {
      boardColumns: [
        { id: 'prospect', title: 'Prospect', color: '#3B82F6', count: prospectContacts.length },
        { id: 'active', title: 'Active', color: '#10B981', count: activeContacts.length },
        { id: 'inactive', title: 'Inactive', color: '#6B7280', count: inactiveContacts.length },
        { id: 'lost', title: 'Lost', color: '#EF4444', count: lostContacts.length },
      ],
      boardData: {
        prospect: prospectContacts,
        active: activeContacts,
        inactive: inactiveContacts,
        lost: lostContacts,
      },
    }
  }, [contacts])

  const renderCard = useCallback((contact: Contact) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-900">{contact.full_name || 'Unnamed Contact'}</div>
      <div className="text-sm text-gray-600">{contact.title || 'N/A'}</div>
      <div className="text-sm text-gray-600">{contact.seniority_level || 'N/A'}</div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Mail className="h-3 w-3" />
        {contact.email || 'N/A'}
      </div>
    </div>
  ), [])

  const handleRowClick = useCallback((contact: Contact) => {
    setSelectedContact(contact.id)
    setDrawerOpen(true)
  }, [])

  const selectedContactData = contacts.find((c) => c.id === selectedContact)

  return (
    <CRMPageContainer>
      <CRMThreeColumnLayout >
        <CRMViewBar
          title="Contacts"
          icon={<Users className="h-5 w-5" />}
          viewType={viewType}
          onViewTypeChange={(type) => setViewType('contacts', type)}
          filterButton={
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          }
          sortButton={
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          }
          actions={
            <>
              <div className="lg:hidden">
              </div>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </>
          }
        />

        <div className="flex-1 overflow-hidden">
          {contacts.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No contacts yet"
              description="Build your network by adding contacts. Track conversations, relationships, and engagement with decision makers."
              primaryAction={{
                label: 'Add Contact',
                onClick: () => setCreateDialogOpen(true),
              }}
              secondaryAction={{
                label: 'Import Contacts',
                onClick: () => toast.info('Import contacts functionality coming soon'),
              }}
            />
          ) : (
            <>
              {viewType === 'table' && (
                <CRMTableView
                  data={contacts}
                  columns={tableColumns}
                  onRowClick={handleRowClick}
                />
              )}
              {viewType === 'board' && (
                <KanbanBoard
                  columns={boardColumns}
                  data={boardData}
                  renderCard={renderCard}
                  onCardClick={handleRowClick}
                  onAddCard={(columnId) => toast.info(`Add contact to ${columnId} - coming soon`)}
                />
              )}
            </>
          )}
        </div>
      </CRMThreeColumnLayout>

      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedContactData?.full_name || 'Unnamed Contact'}
        subtitle={selectedContactData?.title}
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Contact Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Email: </span>
                <span className="text-sm text-gray-900">{selectedContactData?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone: </span>
                <span className="text-sm text-gray-900">{selectedContactData?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Seniority: </span>
                <span className="text-sm text-gray-900">{selectedContactData?.seniority_level || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Title: </span>
                <span className="text-sm text-gray-900">{selectedContactData?.title || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status: </span>
                <Badge className="ml-2">{selectedContactData?.status}</Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created: </span>
                <span className="text-sm text-gray-900">
                  {selectedContactData &&
                    formatDistanceToNow(new Date(selectedContactData.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RecordDrawer>

      <CreateContactDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </CRMPageContainer>
  )
}

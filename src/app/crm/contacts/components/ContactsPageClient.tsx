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
import { MobileMenu } from '@/components/ui/mobile-menu'
import { formatDistanceToNow } from 'date-fns'
import type { Contact } from '@/types/crm.types'

interface ContactsPageClientProps {
  initialData: Contact[]
}

export function ContactsPageClient({ initialData }: ContactsPageClientProps) {
  const [contacts] = useState<Contact[]>(initialData)
  const viewType = useCRMViewStore((state) => state.getViewType('contacts'))
  const setViewType = useCRMViewStore((state) => state.setViewType)

  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const sidebarContent = (
    <div className="flex h-full flex-col p-6">
      <h2 className="bg-gradient-cursive bg-clip-text text-xl font-semibold text-transparent">
        CRM
      </h2>
      <nav className="mt-6 space-y-1.5">
        <Link
          href="/crm/leads"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Leads
        </Link>
        <Link
          href="/crm/companies"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Companies
        </Link>
        <div className="rounded-lg bg-gradient-cursive px-3 py-2.5 font-medium text-white shadow-sm">
          Contacts
        </div>
        <Link
          href="/crm/deals"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Deals
        </Link>
      </nav>
    </div>
  )

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
      <CRMThreeColumnLayout sidebar={<div className="hidden lg:block">{sidebarContent}</div>}>
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
                <MobileMenu triggerClassName="h-9 px-3">{sidebarContent}</MobileMenu>
              </div>
              <Button size="sm">
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
                onClick: () => console.log('Add contact'),
              }}
              secondaryAction={{
                label: 'Import Contacts',
                onClick: () => console.log('Import contacts'),
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
                  onAddCard={(columnId) => console.log('Add card to', columnId)}
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
    </CRMPageContainer>
  )
}

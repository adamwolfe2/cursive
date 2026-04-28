'use client'

import { useState } from 'react'
import { EnhancedContactsTable } from '@/components/crm/table/EnhancedContactsTable'
import { RecordDrawer } from '@/components/crm/drawer/RecordDrawer'
import { CreateContactDialog } from './CreateContactDialog'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import type { Contact } from '@/types/crm.types'

interface ContactsPageClientProps {
  initialData: Contact[]
}

export function ContactsPageClient({ initialData }: ContactsPageClientProps) {
  const router = useRouter()
  const [contacts] = useState<Contact[]>(initialData)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact.id)
    setDrawerOpen(true)
  }

  const handleCreateClick = () => {
    setCreateDialogOpen(true)
  }

  const handleDialogClose = (created: boolean) => {
    setCreateDialogOpen(false)
    if (created) {
      // Refresh the page to show new contact
      router.refresh()
    }
  }

  const selectedContactData = contacts.find((c) => c.id === selectedContact)
  const fullName = selectedContactData?.full_name ||
    [selectedContactData?.first_name, selectedContactData?.last_name].filter(Boolean).join(' ') ||
    'Unnamed Contact'

  return (
    <div className="flex h-full flex-col p-6">
      {/* Enhanced square-ui inspired table */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 px-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Users className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No contacts yet</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Contacts are synced automatically as visitors are identified. Connect your integrations in{' '}
            <a href="/settings/integrations" className="text-blue-600 hover:underline">
              Settings &rarr; Integrations
            </a>{' '}
            to sync contacts automatically.
          </p>
          <div className="mt-6">
            <Button size="sm" onClick={handleCreateClick}>
              Add Contact
            </Button>
          </div>
        </div>
      ) : (
        <EnhancedContactsTable
          data={contacts}
          onRowClick={handleRowClick}
          onCreateClick={handleCreateClick}
        />
      )}

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose(false)
          else setCreateDialogOpen(true)
        }}
      />

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={fullName}
        subtitle={selectedContactData?.title || undefined}
      >
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Email</span>
                {selectedContactData?.email ? (
                  <a
                    href={`mailto:${selectedContactData.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedContactData.email}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Phone</span>
                {selectedContactData?.phone ? (
                  <a
                    href={`tel:${selectedContactData.phone}`}
                    className="text-sm text-foreground"
                  >
                    {selectedContactData.phone}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Mobile</span>
                <span className="text-sm text-foreground">
                  {selectedContactData?.mobile || '-'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Job Title</span>
                <span className="text-sm text-foreground">
                  {selectedContactData?.title || '-'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Seniority</span>
                <span className="text-sm text-foreground">
                  {selectedContactData?.seniority_level || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Metadata
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {selectedContactData?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Created</span>
                <span className="text-sm text-foreground">
                  {selectedContactData &&
                    formatDistanceToNow(new Date(selectedContactData.created_at), {
                      addSuffix: true,
                    })}
                </span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(selectedContactData?.linkedin_url || selectedContactData?.twitter_url) && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Social
              </h3>
              <div className="space-y-3">
                {selectedContactData.linkedin_url && (
                  <div className="flex items-start gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">LinkedIn</span>
                    <a
                      href={selectedContactData.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}
                {selectedContactData.twitter_url && (
                  <div className="flex items-start gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">Twitter</span>
                    <a
                      href={selectedContactData.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </RecordDrawer>
    </div>
  )
}

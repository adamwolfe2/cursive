'use client'

/**
 * Chat Toggle button — opens the right-side ChatPanel drawer.
 *
 * Lives in the workflow detail page header. Imports the ChatPanel lazily so
 * it doesn't add to initial bundle size.
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

const ChatPanel = dynamic(
  () => import('./chat-panel').then(m => m.ChatPanel),
  { ssr: false }
)

export interface ChatToggleProps {
  agentId: string
  agentName: string
}

export function ChatToggle({ agentId, agentName }: ChatToggleProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4 mr-1.5" />
        Chat
      </Button>
      {open && <ChatPanel agentId={agentId} agentName={agentName} onClose={() => setOpen(false)} />}
    </>
  )
}

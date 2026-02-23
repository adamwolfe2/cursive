import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConversationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-1">Conversation not found</h2>
      <p className="text-sm text-muted-foreground mb-6">
        This conversation may have been deleted or you don&apos;t have permission to view it.
      </p>
      <Button asChild variant="outline">
        <Link href="/conversations">Back to Conversations</Link>
      </Button>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Inbox, MessageSquare, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Outreach | Cursive',
  description: 'Manage email sequences, inbox, and conversations',
}

interface OutreachCounts {
  activeSequences: number
  unreadInbox: number
  activeConversations: number
}

async function getOutreachCounts(workspaceId: string): Promise<OutreachCounts> {
  const supabase = await createClient()

  const [sequencesResult, unreadResult, activeConversationsResult] = await Promise.all([
    supabase
      .from('email_sequences')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
    supabase
      .from('email_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gt('unread_count', 0),
    supabase
      .from('email_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
  ])

  return {
    activeSequences: sequencesResult.count ?? 0,
    unreadInbox: unreadResult.count ?? 0,
    activeConversations: activeConversationsResult.count ?? 0,
  }
}

const cards = [
  {
    title: 'Email Sequences',
    description: 'Create and manage automated email sequences to nurture leads',
    href: '/email-sequences',
    icon: Mail,
    countKey: 'activeSequences' as const,
    countLabel: 'active',
    buttonLabel: 'Manage',
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Inbox',
    description: 'Review and approve AI-drafted replies to lead responses',
    href: '/inbox',
    icon: Inbox,
    countKey: 'unreadInbox' as const,
    countLabel: 'unread',
    buttonLabel: 'View',
    accentColor: 'text-amber-600',
    accentBg: 'bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Conversations',
    description: 'Track and manage all email conversations with leads',
    href: '/conversations',
    icon: MessageSquare,
    countKey: 'activeConversations' as const,
    countLabel: 'active',
    buttonLabel: 'View',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-700',
  },
]

export default async function OutreachPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const counts = await getOutreachCounts(user.workspace_id)

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your email sequences, inbox, and conversations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const count = counts[card.countKey]
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md hover:border-border/80"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2.5 ${card.accentBg}`}>
                  <card.icon className={`h-5 w-5 ${card.accentColor}`} />
                </div>
                {count > 0 && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${card.badgeBg}`}>
                    {count} {card.countLabel}
                  </span>
                )}
              </div>

              <h2 className="text-base font-semibold text-foreground mb-1">
                {card.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {card.description}
              </p>

              <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 gap-1.5 transition-all">
                {card.buttonLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

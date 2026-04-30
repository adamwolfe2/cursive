'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageSquarePlus, Trash2, X, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/design-system'
import { CursiveOrb } from './CursiveOrb'

export interface SessionSummary {
  id: string
  title: string
  message_count: number
  last_message_at: string
  created_at: string
}

interface HistorySidebarProps {
  activeSessionId: string
  refreshKey: number
  onNewChat: () => void
  onSelectSession: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function HistorySidebar({
  activeSessionId,
  refreshKey,
  onNewChat,
  onSelectSession,
  isOpen,
  onClose,
}: HistorySidebarProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/copilot/sessions')
      if (!res.ok) return
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      // silent — sidebar is non-critical
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [refreshKey])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Delete this chat?')) return
    try {
      const res = await fetch(`/api/admin/copilot/sessions/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) return
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (id === activeSessionId) onNewChat()
    } catch {
      // silent
    }
  }

  const groups = useMemo(() => groupByRecency(sessions), [sessions])

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-transform duration-200 md:static md:z-0 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex items-center gap-2">
            <CursiveOrb size={20} />
            <span className="text-sm font-semibold text-foreground">Copilot</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/40"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>New chat</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-4 pt-2">
          {loading && sessions.length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">
              No chats yet. Start a new one.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <h3 className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {group.sessions.map((s) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      isActive={s.id === activeSessionId}
                      onClick={() => onSelectSession(s.id)}
                      onDelete={(e) => handleDelete(e, s.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}

function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: SessionSummary
  isActive: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
        isActive
          ? 'bg-muted text-foreground'
          : 'text-foreground/80 hover:bg-muted/40 hover:text-foreground'
      )}
    >
      <span className="min-w-0 flex-1 truncate">{session.title}</span>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete chat"
        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </button>
  )
}

export function SidebarToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open history"
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  )
}

// ─── Grouping helpers ────────────────────────────────────────────────────

interface Group {
  label: string
  sessions: SessionSummary[]
}

function groupByRecency(sessions: SessionSummary[]): Group[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

  const buckets: Record<string, SessionSummary[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 days': [],
    Older: [],
  }
  for (const s of sessions) {
    const t = new Date(s.last_message_at).getTime()
    if (t >= todayStart) buckets.Today.push(s)
    else if (t >= yesterdayStart) buckets.Yesterday.push(s)
    else if (t >= weekStart) buckets['Previous 7 days'].push(s)
    else buckets.Older.push(s)
  }

  return (['Today', 'Yesterday', 'Previous 7 days', 'Older'] as const)
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ label: k, sessions: buckets[k] }))
}

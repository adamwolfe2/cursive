/**
 * Real-time Utilities
 * OpenInfo Platform
 *
 * Supabase real-time subscriptions and live update hooks.
 */

'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface RealtimeFilter {
  event: RealtimeEvent
  schema?: string
  table: string
  filter?: string
}

export interface RealtimeOptions {
  enabled?: boolean
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export type RealtimeCallback<T> = (
  payload: RealtimePostgresChangesPayload<T>
) => void

// ============================================
// SUBSCRIPTION HOOK
// ============================================

/**
 * Subscribe to real-time database changes
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  filter: RealtimeFilter,
  callback: RealtimeCallback<T>,
  options: RealtimeOptions = {}
) {
  const { enabled = true, onError, onConnect, onDisconnect } = options
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    const channelName = `${filter.table}-${filter.event}-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as const,
        {
          event: filter.event,
          schema: filter.schema || 'public',
          table: filter.table,
          filter: filter.filter,
        },
        (payload) => {
          callbackRef.current(payload as RealtimePostgresChangesPayload<T>)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onConnect?.()
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          onDisconnect?.()
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [filter.event, filter.schema, filter.table, filter.filter, enabled, onConnect, onDisconnect])

  // Return unsubscribe function
  return useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])
}

// ============================================
// PRESENCE HOOK
// ============================================

export interface PresenceState {
  [key: string]: {
    presence_ref: string
    user_id: string
    online_at: string
    [key: string]: unknown
  }[]
}

export interface PresenceOptions {
  enabled?: boolean
  userId: string
  metadata?: Record<string, unknown>
  onSync?: (state: PresenceState) => void
  onJoin?: (key: string, current: PresenceState[string], newPresences: PresenceState[string]) => void
  onLeave?: (key: string, current: PresenceState[string], leftPresences: PresenceState[string]) => void
}

/**
 * Track presence (online users)
 */
export function usePresence(channelName: string, options: PresenceOptions) {
  const {
    enabled = true,
    userId,
    metadata = {},
    onSync,
    onJoin,
    onLeave,
  } = options

  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !userId) return

    const supabase = createClient()

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as PresenceState
        setPresenceState(state)
        onSync?.(state)
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
        onJoin?.(key, currentPresences, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
        onLeave?.(key, currentPresences, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata,
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [channelName, enabled, userId, metadata, onSync, onJoin, onLeave])

  return presenceState
}

// ============================================
// BROADCAST HOOK
// ============================================

export interface BroadcastMessage<T = unknown> {
  type: string
  payload: T
  sender?: string
}

export interface BroadcastOptions {
  enabled?: boolean
  onMessage?: <T>(message: BroadcastMessage<T>) => void
}

/**
 * Send and receive broadcast messages
 */
export function useBroadcast(channelName: string, options: BroadcastOptions = {}) {
  const { enabled = true, onMessage } = options
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: '*' }, ({ payload }) => {
        onMessageRef.current?.(payload as BroadcastMessage)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [channelName, enabled])

  const send = useCallback(
    async <T>(type: string, payload: T, sender?: string) => {
      if (!channelRef.current) return false

      const message: BroadcastMessage<T> = { type, payload, sender }

      const result = await channelRef.current.send({
        type: 'broadcast',
        event: type,
        payload: message,
      })

      return result === 'ok'
    },
    []
  )

  return { send }
}

// ============================================
// ENTITY SUBSCRIPTION HOOKS
// ============================================

/**
 * Subscribe to query updates
 */
export function useQueryUpdates(
  workspaceId: string,
  queryId: string | null,
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  enabled = true
) {
  return useRealtimeSubscription(
    {
      event: '*',
      table: 'queries',
      filter: queryId
        ? `id=eq.${queryId}`
        : `workspace_id=eq.${workspaceId}`,
    },
    onUpdate,
    { enabled: enabled && !!workspaceId }
  )
}

/**
 * Subscribe to lead updates
 */
export function useLeadUpdates(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  enabled = true
) {
  return useRealtimeSubscription(
    {
      event: '*',
      table: 'leads',
      filter: `workspace_id=eq.${workspaceId}`,
    },
    onUpdate,
    { enabled: enabled && !!workspaceId }
  )
}

/**
 * Subscribe to notification updates
 */
export function useNotificationUpdates(
  userId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  enabled = true
) {
  return useRealtimeSubscription(
    {
      event: 'INSERT',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    onUpdate,
    { enabled: enabled && !!userId }
  )
}

// ============================================
// CONNECTION STATUS HOOK
// ============================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Monitor Supabase realtime connection status
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastConnected, setLastConnected] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to system channel to monitor connection
    const channel = supabase
      .channel('connection-status')
      .subscribe((status) => {
        switch (status) {
          case 'SUBSCRIBED':
            setStatus('connected')
            setLastConnected(new Date())
            break
          case 'CLOSED':
            setStatus('disconnected')
            break
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
            setStatus('error')
            break
          default:
            setStatus('connecting')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { status, lastConnected }
}

// ============================================
// LIVE DATA HOOK
// ============================================

interface LiveDataOptions<T> {
  initialData?: T[]
  enabled?: boolean
  filter?: string
}

/**
 * Live data with automatic updates
 */
export function useLiveData<T extends { id: string }>(
  table: string,
  workspaceId: string,
  options: LiveDataOptions<T> = {}
) {
  const { initialData = [], enabled = true, filter } = options
  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    if (!enabled || !workspaceId) return

    const fetchData = async () => {
      setIsLoading(true)
      const supabase = createClient()

      let query = supabase
        .from(table)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (filter) {
        // Apply additional filter if provided
        query = query.or(filter)
      }

      const { data: fetchedData, error } = await query

      if (error) {
        console.error(`Error fetching ${table}:`, error)
      } else {
        setData((fetchedData || []) as T[])
      }

      setIsLoading(false)
    }

    fetchData()
  }, [table, workspaceId, filter, enabled])

  // Subscribe to changes
  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      switch (payload.eventType) {
        case 'INSERT':
          setData((prev) => [payload.new as T, ...prev])
          break
        case 'UPDATE':
          setData((prev) =>
            prev.map((item) =>
              item.id === (payload.new as T).id ? (payload.new as T) : item
            )
          )
          break
        case 'DELETE':
          setData((prev) =>
            prev.filter((item) => item.id !== (payload.old as T).id)
          )
          break
      }
    },
    []
  )

  useRealtimeSubscription<T>(
    {
      event: '*',
      table,
      filter: `workspace_id=eq.${workspaceId}`,
    },
    handleChange,
    { enabled: enabled && !!workspaceId }
  )

  return { data, isLoading, setData }
}

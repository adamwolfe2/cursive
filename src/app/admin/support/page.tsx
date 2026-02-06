'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/use-toast'
import { MessageSquare, Mail, Clock, CheckCircle, Archive, AlertCircle } from 'lucide-react'

interface SupportMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: 'unread' | 'read' | 'responded' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  source: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const toast = useToast()
  const supabase = createClient()

  // Admin role check - prevent non-admins from accessing
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/support')
      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(data.messages)
    } catch (error) {
      toast.error('Failed to load support messages')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateMessageStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update message')

      toast.success('Message status updated')
      fetchMessages()

      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: status as any })
      }
    } catch (error) {
      toast.error('Failed to update message')
      console.error(error)
    }
  }

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true
    return m.status === filter
  })

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    responded: messages.filter(m => m.status === 'responded').length,
    archived: messages.filter(m => m.status === 'archived').length
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'normal': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-zinc-600 bg-zinc-50'
      default: return 'text-zinc-600 bg-zinc-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <Mail className="h-4 w-4" />
      case 'read': return <Clock className="h-4 w-4" />
      case 'responded': return <CheckCircle className="h-4 w-4" />
      case 'archived': return <Archive className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Support Inbox</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage customer support messages and inquiries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">Total Messages</p>
              <p className="text-2xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-zinc-400" />
          </div>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600">Unread</p>
              <p className="text-2xl font-semibold text-red-700 mt-1">{stats.unread}</p>
            </div>
            <Mail className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Responded</p>
              <p className="text-2xl font-semibold text-green-700 mt-1">{stats.responded}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">Archived</p>
              <p className="text-2xl font-semibold text-zinc-900 mt-1">{stats.archived}</p>
            </div>
            <Archive className="h-8 w-8 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'unread', 'read', 'responded', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center">
              <MessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No messages found</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message)
                  if (message.status === 'unread') {
                    updateMessageStatus(message.id, 'read')
                  }
                }}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMessage?.id === message.id
                    ? 'border-blue-500 shadow-md'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                } ${message.status === 'unread' ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {message.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{message.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                    {getStatusIcon(message.status)}
                  </div>
                </div>

                {message.subject && (
                  <p className="text-sm font-medium text-zinc-700 mb-1">{message.subject}</p>
                )}

                <p className="text-sm text-zinc-600 line-clamp-2 mb-2">
                  {message.message}
                </p>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{new Date(message.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-1 bg-zinc-100 rounded">{message.source}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 sticky top-6 h-fit">
          {selectedMessage ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">{selectedMessage.name}</h2>
                  <p className="text-sm text-zinc-500">{selectedMessage.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded ${getPriorityColor(selectedMessage.priority)}`}>
                  <AlertCircle className="h-4 w-4" />
                  {selectedMessage.priority}
                </span>
              </div>

              {selectedMessage.subject && (
                <div className="mb-4 pb-4 border-b border-zinc-200">
                  <p className="text-xs text-zinc-500 mb-1">Subject</p>
                  <p className="text-sm font-medium text-zinc-900">{selectedMessage.subject}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-zinc-500 mb-2">Message</p>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="mb-4 pb-4 border-b border-zinc-200">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500">Source</p>
                    <p className="text-zinc-900 font-medium">{selectedMessage.source}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Status</p>
                    <p className="text-zinc-900 font-medium capitalize">{selectedMessage.status}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Received</p>
                    <p className="text-zinc-900 font-medium">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your message'}`}
                  className="flex-1 h-9 px-4 flex items-center justify-center gap-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Reply
                </a>

                {selectedMessage.status !== 'responded' && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'responded')}
                    className="h-9 px-4 text-sm font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                  >
                    Mark Responded
                  </button>
                )}

                {selectedMessage.status !== 'archived' && (
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                    className="h-9 px-4 text-sm font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-16 w-16 text-zinc-300 mb-3" />
              <p className="text-sm text-zinc-500">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

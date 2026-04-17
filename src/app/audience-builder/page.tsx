'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EmailGate, type LeadInfo } from './_components/EmailGate'
import { PublicChat } from './_components/PublicChat'

const TOKEN_KEY = 'audience_builder_token'
const SESSION_KEY = 'audience_builder_session_id'
const LEAD_INFO_KEY = 'audience_builder_lead_info'

interface SessionState {
  token: string
  sessionId: string
  leadInfo: LeadInfo
}

export default function AudienceBuilderPage() {
  const [session, setSession] = useState<SessionState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from sessionStorage so refresh doesn't kick user out.
  useEffect(() => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      const sessionId = sessionStorage.getItem(SESSION_KEY)
      const leadInfoRaw = sessionStorage.getItem(LEAD_INFO_KEY)
      if (token && sessionId) {
        let leadInfo: LeadInfo = { firstName: '', company: '' }
        if (leadInfoRaw) {
          try {
            const parsed = JSON.parse(leadInfoRaw) as Partial<LeadInfo>
            leadInfo = {
              firstName: parsed.firstName ?? '',
              company: parsed.company ?? '',
            }
          } catch {
            /* ignore malformed */
          }
        }
        setSession({ token, sessionId, leadInfo })
      }
    } catch {
      /* sessionStorage unavailable */
    }
    setHydrated(true)
  }, [])

  const handleStart = useCallback(
    (token: string, sessionId: string, leadInfo: LeadInfo) => {
      setSession({ token, sessionId, leadInfo })
    },
    []
  )

  const handleResetSession = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(LEAD_INFO_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
  }, [])

  const handleSessionExpired = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    // Leave lead_info in place so they don't have to retype name/company.
  }, [])

  if (!hydrated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {session ? (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PublicChat
            token={session.token}
            sessionId={session.sessionId}
            leadInfo={session.leadInfo}
            onSessionExpired={handleSessionExpired}
            onResetSession={handleResetSession}
          />
        </motion.div>
      ) : (
        <motion.div
          key="gate"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <EmailGate onStart={handleStart} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

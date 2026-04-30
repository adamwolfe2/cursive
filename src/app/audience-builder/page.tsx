'use client'

import { useCallback, useEffect, useState } from 'react'
import { PublicChat } from './_components/PublicChat'

const TOKEN_KEY = 'audience_builder_token'
const SESSION_KEY = 'audience_builder_session_id'
const LEAD_INFO_KEY = 'audience_builder_lead_info'

export interface LeadInfo {
  firstName: string | null
  company: string | null
}

interface AuthState {
  token: string | null
  sessionId: string | null
  firstName: string | null
  company: string | null
}

const EMPTY_AUTH: AuthState = {
  token: null,
  sessionId: null,
  firstName: null,
  company: null,
}

export default function AudienceBuilderPage() {
  const [authState, setAuthState] = useState<AuthState>(EMPTY_AUTH)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from sessionStorage so refresh doesn't kick user out.
  useEffect(() => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      const sessionId = sessionStorage.getItem(SESSION_KEY)
      const leadInfoRaw = sessionStorage.getItem(LEAD_INFO_KEY)
      const leadInfo: Partial<LeadInfo> | null = leadInfoRaw
        ? (() => {
            try {
              return JSON.parse(leadInfoRaw) as Partial<LeadInfo>
            } catch {
              return null
            }
          })()
        : null
      if (token && sessionId) {
        setAuthState({
          token,
          sessionId,
          firstName: leadInfo?.firstName ?? null,
          company: leadInfo?.company ?? null,
        })
      }
    } catch {
      /* sessionStorage unavailable */
    } finally {
      setHydrated(true)
    }
  }, [])

  const handleAuth = useCallback(
    (
      token: string,
      sessionId: string,
      leadInfo: { firstName?: string | null; company?: string | null }
    ) => {
      const nextFirstName = leadInfo.firstName ?? null
      const nextCompany = leadInfo.company ?? null
      try {
        sessionStorage.setItem(TOKEN_KEY, token)
        sessionStorage.setItem(SESSION_KEY, sessionId)
        sessionStorage.setItem(
          LEAD_INFO_KEY,
          JSON.stringify({ firstName: nextFirstName, company: nextCompany })
        )
      } catch {
        /* ignore */
      }
      setAuthState({
        token,
        sessionId,
        firstName: nextFirstName,
        company: nextCompany,
      })
    },
    []
  )

  const handleSessionExpired = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(LEAD_INFO_KEY)
    } catch {
      /* ignore */
    }
    setAuthState(EMPTY_AUTH)
  }, [])

  if (!hydrated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <PublicChat
      authState={authState}
      onAuth={handleAuth}
      onSessionExpired={handleSessionExpired}
    />
  )
}

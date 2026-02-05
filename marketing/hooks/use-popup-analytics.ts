/**
 * Popup Analytics Hook
 * Tracks popup interactions and sends to analytics
 */

import { useCallback } from 'react'
import { PopupFormData } from '@/lib/popup-types'

interface PopupAnalyticsOptions {
  popupId: string
  variant: string
}

export function usePopupAnalytics({ popupId, variant }: PopupAnalyticsOptions) {
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      // Send to analytics (Google Analytics, PostHog, etc.)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', eventName, {
          popup_id: popupId,
          popup_variant: variant,
          ...properties,
        })
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Popup Analytics]', eventName, {
          popupId,
          variant,
          ...properties,
        })
      }
    },
    [popupId, variant]
  )

  const trackImpression = useCallback(() => {
    trackEvent('popup_impression', {
      event_category: 'popup',
      event_label: popupId,
    })
  }, [trackEvent, popupId])

  const trackInteraction = useCallback(() => {
    trackEvent('popup_interaction', {
      event_category: 'popup',
      event_label: popupId,
      interaction_type: 'form_focus',
    })
  }, [trackEvent, popupId])

  const trackSubmission = useCallback(
    (data: PopupFormData) => {
      trackEvent('popup_submission', {
        event_category: 'popup',
        event_label: popupId,
        email_provided: !!data.email,
        company_provided: !!data.company,
      })

      // Track conversion event
      trackEvent('conversion', {
        event_category: 'lead_generation',
        event_label: `popup_${popupId}`,
        value: 1,
      })
    },
    [trackEvent, popupId]
  )

  const trackDismiss = useCallback(
    (method: 'close-button' | 'outside-click' | 'escape-key') => {
      trackEvent('popup_dismiss', {
        event_category: 'popup',
        event_label: popupId,
        dismiss_method: method,
      })
    },
    [trackEvent, popupId]
  )

  return {
    trackImpression,
    trackInteraction,
    trackSubmission,
    trackDismiss,
  }
}

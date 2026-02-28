/**
 * Onboarding Flow
 * Wraps the waitlist quiz flow with real auth + workspace creation
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useWaitlistFlow } from '@/hooks/use-waitlist-flow'
import { screenVariants } from '@/lib/utils/waitlist-animations'
import {
  businessQ1Options,
  businessQ2Options,
  businessQ3Options,
  partnerQ1Options,
  partnerQ2Options,
  partnerQ3Options,
} from '@/lib/utils/waitlist-validation'
import { createClient } from '@/lib/supabase/client'

// Screen components
import { TitleScreen } from '@/components/waitlist/title-screen'
import { BusinessIntro } from '@/components/waitlist/business-intro'
import { PartnerIntro } from '@/components/waitlist/partner-intro'
import { VSLQuestion } from '@/components/waitlist/vsl-question'
import { TransitionScreen } from '@/components/waitlist/transition-screen'
import { BusinessSignupForm } from './business-signup-form'
import { PartnerSignupForm } from './partner-signup-form'
import { OnboardingSuccess } from './onboarding-success'

import type { BusinessFormData, PartnerFormData } from '@/types/waitlist.types'

interface OnboardingFlowProps {
  isMarketplace: boolean
}

export function OnboardingFlow({ isMarketplace }: OnboardingFlowProps) {
  const router = useRouter()
  const {
    currentScreen,
    direction,
    vslAnswers,
    selectUserType,
    answerQuestion,
    goToScreen,
    goBack,
  } = useWaitlistFlow()

  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submittedIndustry, setSubmittedIndustry] = useState('')
  const [submittedLocations, setSubmittedLocations] = useState('')
  const [submittedRequiresConfirmation, setSubmittedRequiresConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBusinessSubmit = useCallback(async (data: BusinessFormData, authMethod: 'email' | 'google', password?: string) => {
    setError(null)
    setIsSubmitting(true)
    const supabase = createClient()

    if (authMethod === 'google') {
      // Save form data to localStorage so it survives OAuth window close / browser back navigation
      localStorage.setItem('cursive_onboarding', JSON.stringify({
        role: 'business',
        ...data,
        isMarketplace,
      }))
      // Use NEXT_PUBLIC_SITE_URL for consistent redirect (must match Supabase allowed redirects)
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, '')
      // Trigger Google OAuth
      const nextUrl = isMarketplace ? '/welcome?returning=true&source=marketplace' : '/welcome?returning=true'
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setIsSubmitting(false)
      }
      // Don't reset isSubmitting on success — page will redirect
      return
    }

    // Email signup
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, '')
      const nextUrl = isMarketplace ? '/welcome?returning=true&source=marketplace' : '/welcome?returning=true'
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: password!,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsSubmitting(false)
        return
      }

      if (!authData.session) {
        // Email confirmation required — store form data so AutoSubmitOnboarding
        // can complete workspace creation after the user confirms their email
        localStorage.setItem('cursive_onboarding', JSON.stringify({
          role: 'business',
          ...data,
          isMarketplace,
        }))
        setSubmittedEmail(data.email)
        setSubmittedIndustry(data.industry || '')
        setSubmittedLocations(data.targetLocations || '')
        setSubmittedRequiresConfirmation(true)
        goToScreen('business-success')
        return
      }

      // Session exists — create workspace
      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'business', ...data }),
      })

      if (res.status === 409) {
        router.push(isMarketplace ? '/marketplace' : '/dashboard')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to create account')
        setIsSubmitting(false)
        return
      }

      setSubmittedEmail(data.email)
      setSubmittedIndustry(data.industry || '')
      setSubmittedLocations(data.targetLocations || '')
      setSubmittedRequiresConfirmation(false)
      localStorage.removeItem('cursive_onboarding')
      goToScreen('business-success')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setIsSubmitting(false)
    }
  }, [isMarketplace, goToScreen, router])

  const handlePartnerSubmit = useCallback(async (data: PartnerFormData, authMethod: 'email' | 'google', password?: string) => {
    setError(null)
    setIsSubmitting(true)
    const supabase = createClient()

    if (authMethod === 'google') {
      localStorage.setItem('cursive_onboarding', JSON.stringify({
        role: 'partner',
        ...data,
        isMarketplace,
      }))
      // Use NEXT_PUBLIC_SITE_URL for consistent redirect (must match Supabase allowed redirects)
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, '')
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/welcome?returning=true')}`,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setIsSubmitting(false)
      }
      // Don't reset isSubmitting on success — page will redirect
      return
    }

    // Email signup
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, '')
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: password!,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/welcome?returning=true')}`,
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsSubmitting(false)
        return
      }

      if (!authData.session) {
        // Email confirmation required — store form data so AutoSubmitOnboarding
        // can complete workspace creation after the user confirms their email
        localStorage.setItem('cursive_onboarding', JSON.stringify({
          role: 'partner',
          ...data,
          isMarketplace,
        }))
        setSubmittedEmail(data.email)
        setSubmittedRequiresConfirmation(true)
        goToScreen('partner-success')
        return
      }

      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'partner', ...data }),
      })

      if (res.status === 409) {
        router.push(isMarketplace ? '/marketplace' : '/dashboard')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to create account')
        setIsSubmitting(false)
        return
      }

      setSubmittedEmail(data.email)
      setSubmittedRequiresConfirmation(false)
      goToScreen('partner-success')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setIsSubmitting(false)
    }
  }, [isMarketplace, goToScreen, router])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'title':
        return <TitleScreen onSelectUserType={selectUserType} />

      case 'business-intro':
        return <BusinessIntro onNext={() => goToScreen('business-q1')} onBack={goBack} />

      case 'business-q1':
        return (
          <VSLQuestion
            questionNumber={1}
            totalQuestions={3}
            question="How many qualified leads does your business need per month?"
            options={businessQ1Options}
            onAnswer={(answer) => answerQuestion(1, answer)}
            onBack={goBack}
          />
        )

      case 'business-q2':
        return (
          <VSLQuestion
            questionNumber={2}
            totalQuestions={3}
            question="What's your current monthly spend on lead generation?"
            options={businessQ2Options}
            onAnswer={(answer) => answerQuestion(2, answer)}
            onBack={goBack}
          />
        )

      case 'business-q3':
        return (
          <VSLQuestion
            questionNumber={3}
            totalQuestions={3}
            question="What's your biggest challenge with lead sources today?"
            options={businessQ3Options}
            onAnswer={(answer) => answerQuestion(3, answer)}
            onBack={goBack}
          />
        )

      case 'business-transition':
        return (
          <TransitionScreen
            message="Great! Let's get you set up with free qualified leads."
            onNext={() => goToScreen('business-form')}
            onBack={goBack}
          />
        )

      case 'business-form':
        return (
          <BusinessSignupForm
            vslAnswers={vslAnswers}
            onSubmit={handleBusinessSubmit}
            onBack={goBack}
            error={error}
            isSubmitting={isSubmitting}
          />
        )

      case 'business-success':
        return (
          <OnboardingSuccess
            userType="business"
            email={submittedEmail}
            isMarketplace={isMarketplace}
            targetIndustry={submittedIndustry}
            targetLocations={submittedLocations}
            requiresConfirmation={submittedRequiresConfirmation}
          />
        )

      case 'partner-intro':
        return <PartnerIntro onNext={() => goToScreen('partner-q1')} onBack={goBack} />

      case 'partner-q1':
        return (
          <VSLQuestion
            questionNumber={1}
            totalQuestions={3}
            question="How many verified, high-intent leads do you currently have access to?"
            options={partnerQ1Options}
            onAnswer={(answer) => answerQuestion(1, answer)}
            onBack={goBack}
          />
        )

      case 'partner-q2':
        return (
          <VSLQuestion
            questionNumber={2}
            totalQuestions={3}
            question="What verticals do your leads primarily come from?"
            options={partnerQ2Options}
            onAnswer={(answer) => answerQuestion(2, answer)}
            onBack={goBack}
          />
        )

      case 'partner-q3':
        return (
          <VSLQuestion
            questionNumber={3}
            totalQuestions={3}
            question="How much monthly revenue do you currently generate from your lead database?"
            options={partnerQ3Options}
            onAnswer={(answer) => answerQuestion(3, answer)}
            onBack={goBack}
          />
        )

      case 'partner-transition':
        return (
          <TransitionScreen
            message="Perfect! Let's set up your partner account and attribution tracking."
            onNext={() => goToScreen('partner-form')}
            onBack={goBack}
          />
        )

      case 'partner-form':
        return (
          <PartnerSignupForm
            vslAnswers={vslAnswers}
            onSubmit={handlePartnerSubmit}
            onBack={goBack}
            error={error}
            isSubmitting={isSubmitting}
          />
        )

      case 'partner-success':
        return (
          <OnboardingSuccess
            userType="partner"
            email={submittedEmail}
            isMarketplace={isMarketplace}
            requiresConfirmation={submittedRequiresConfirmation}
          />
        )

      default:
        return <TitleScreen onSelectUserType={selectUserType} />
    }
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentScreen}
        custom={direction}
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {renderScreen()}
      </motion.div>
    </AnimatePresence>
  )
}

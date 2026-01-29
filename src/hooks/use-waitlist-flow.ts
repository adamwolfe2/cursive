/**
 * Waitlist Flow State Management Hook
 * Manages navigation, state, and data collection for the VSL flow
 */

import { useState, useCallback } from 'react'
import type { Screen, UserType, VSLAnswers, BusinessFormData, PartnerFormData } from '@/types/waitlist.types'

export function useWaitlistFlow() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title')
  const [userType, setUserType] = useState<UserType | null>(null)
  const [direction, setDirection] = useState<number>(1) // 1 = forward, -1 = backward
  const [vslAnswers, setVSLAnswers] = useState<VSLAnswers>({
    q1: '',
    q2: '',
    q3: '',
  })

  // Navigation history for back button
  const [history, setHistory] = useState<Screen[]>(['title'])

  // Navigate to next screen
  const goToScreen = useCallback((screen: Screen) => {
    setDirection(1)
    setHistory((prev) => [...prev, screen])
    setCurrentScreen(screen)
  }, [])

  // Navigate back
  const goBack = useCallback(() => {
    if (history.length <= 1) return

    setDirection(-1)
    const newHistory = history.slice(0, -1)
    setHistory(newHistory)
    setCurrentScreen(newHistory[newHistory.length - 1])
  }, [history])

  // Select user type and start flow
  const selectUserType = useCallback(
    (type: UserType) => {
      setUserType(type)
      if (type === 'business') {
        goToScreen('business-intro')
      } else {
        goToScreen('partner-intro')
      }
    },
    [goToScreen]
  )

  // Save VSL answer and advance
  const answerQuestion = useCallback(
    (questionNumber: 1 | 2 | 3, answer: string) => {
      setVSLAnswers((prev) => ({
        ...prev,
        [`q${questionNumber}`]: answer,
      }))

      // Auto-advance to next screen
      if (userType === 'business') {
        const screens: Record<number, Screen> = {
          1: 'business-q2',
          2: 'business-q3',
          3: 'business-transition',
        }
        goToScreen(screens[questionNumber])
      } else if (userType === 'partner') {
        const screens: Record<number, Screen> = {
          1: 'partner-q2',
          2: 'partner-q3',
          3: 'partner-transition',
        }
        goToScreen(screens[questionNumber])
      }
    },
    [userType, goToScreen]
  )

  // Submit business form
  const submitBusinessForm = useCallback(
    (formData: BusinessFormData) => {
      const waitlistData = {
        userType: 'business' as UserType,
        vslAnswers,
        formData,
        timestamp: new Date(),
      }

      console.log('='.repeat(60))
      console.log('WAITLIST SUBMISSION (BUSINESS)')
      console.log('='.repeat(60))
      console.log(JSON.stringify(waitlistData, null, 2))
      console.log('='.repeat(60))

      goToScreen('business-success')
    },
    [vslAnswers, goToScreen]
  )

  // Submit partner form
  const submitPartnerForm = useCallback(
    (formData: PartnerFormData) => {
      const waitlistData = {
        userType: 'partner' as UserType,
        vslAnswers,
        formData,
        timestamp: new Date(),
      }

      console.log('='.repeat(60))
      console.log('WAITLIST SUBMISSION (PARTNER)')
      console.log('='.repeat(60))
      console.log(JSON.stringify(waitlistData, null, 2))
      console.log('='.repeat(60))

      goToScreen('partner-success')
    },
    [vslAnswers, goToScreen]
  )

  // Get current step progress (1-5 for each flow)
  const getCurrentStep = useCallback((): { current: number; total: number } => {
    const stepMap: Record<Screen, { current: number; total: number }> = {
      'title': { current: 0, total: 5 },
      'business-intro': { current: 1, total: 5 },
      'business-q1': { current: 2, total: 5 },
      'business-q2': { current: 2, total: 5 },
      'business-q3': { current: 2, total: 5 },
      'business-transition': { current: 4, total: 5 },
      'business-form': { current: 5, total: 5 },
      'business-success': { current: 5, total: 5 },
      'partner-intro': { current: 1, total: 5 },
      'partner-q1': { current: 2, total: 5 },
      'partner-q2': { current: 2, total: 5 },
      'partner-q3': { current: 2, total: 5 },
      'partner-transition': { current: 4, total: 5 },
      'partner-form': { current: 5, total: 5 },
      'partner-success': { current: 5, total: 5 },
    }

    return stepMap[currentScreen] || { current: 0, total: 5 }
  }, [currentScreen])

  return {
    currentScreen,
    userType,
    direction,
    vslAnswers,
    history,
    selectUserType,
    answerQuestion,
    submitBusinessForm,
    submitPartnerForm,
    goToScreen,
    goBack,
    getCurrentStep,
  }
}

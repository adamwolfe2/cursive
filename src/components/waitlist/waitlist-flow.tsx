/**
 * Waitlist Flow Orchestrator
 * Main component that manages the entire multi-step VSL experience
 */

'use client'

import { useState } from 'react'
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

// Screen components
import { TitleScreen } from './title-screen'
import { BusinessIntro } from './business-intro'
import { PartnerIntro } from './partner-intro'
import { VSLQuestion } from './vsl-question'
import { TransitionScreen } from './transition-screen'
import { BusinessForm } from './business-form'
import { PartnerForm } from './partner-form'
import { SuccessScreen } from './success-screen'

export function WaitlistFlow() {
  const {
    currentScreen,
    userType,
    direction,
    vslAnswers,
    selectUserType,
    answerQuestion,
    submitBusinessForm,
    submitPartnerForm,
    goToScreen,
    goBack,
  } = useWaitlistFlow()

  // Store email for success screen
  const [submittedEmail, setSubmittedEmail] = useState('')

  const renderScreen = () => {
    switch (currentScreen) {
      case 'title':
        return <TitleScreen onSelectUserType={selectUserType} />

      // Business Path
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
            message="Great! Let's get you set up for free qualified leads."
            onNext={() => goToScreen('business-form')}
            onBack={goBack}
          />
        )

      case 'business-form':
        return (
          <BusinessForm
            vslAnswers={vslAnswers}
            onSubmit={(data) => {
              setSubmittedEmail(data.email)
              submitBusinessForm(data)
            }}
            onBack={goBack}
          />
        )

      case 'business-success':
        return <SuccessScreen userType="business" email={submittedEmail} />

      // Partner Path
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
          <PartnerForm
            vslAnswers={vslAnswers}
            onSubmit={(data) => {
              setSubmittedEmail(data.email)
              submitPartnerForm(data)
            }}
            onBack={goBack}
          />
        )

      case 'partner-success':
        return <SuccessScreen userType="partner" email={submittedEmail} />

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

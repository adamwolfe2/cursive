/**
 * VSL Question Component (Reusable)
 * Displays a question with multiple choice answers
 */

'use client'

import { motion } from 'framer-motion'
import { buttonVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/utils/waitlist-animations'
import { BackButton } from './back-button'
import { ProgressBar } from './progress-bar'

interface VSLQuestionProps {
  questionNumber: number
  totalQuestions: number
  question: string
  options: readonly string[]
  onAnswer: (answer: string) => void
  onBack: () => void
}

export function VSLQuestion({ questionNumber, totalQuestions, question, options, onAnswer, onBack }: VSLQuestionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl">
        <BackButton onClick={onBack} />

        <ProgressBar current={2} total={5} label={`Question ${questionNumber} of ${totalQuestions}`} />

        <motion.div variants={staggerContainerVariants} className="space-y-6">
          <motion.h1 variants={staggerItemVariants} className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            {question}
          </motion.h1>

          <motion.div variants={staggerContainerVariants} className="space-y-3">
            {options.map((option) => (
              <motion.button
                key={option}
                onClick={() => onAnswer(option)}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className="w-full h-16 bg-card border-2 border-border rounded-lg text-left px-6 font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {option}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

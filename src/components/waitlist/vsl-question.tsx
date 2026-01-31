/**
 * VSL Question Component (Reusable)
 * Displays a question with multiple choice answers
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  buttonVariants,
  staggerContainerVariants,
  staggerItemVariants,
  fastStaggerContainerVariants,
  optionItemVariants,
  headingVariants,
  logoVariants,
} from '@/lib/utils/waitlist-animations'
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

        <motion.div variants={staggerContainerVariants} className="space-y-8">
          {/* Large Centered Logo */}
          <motion.div variants={logoVariants} className="flex justify-center">
            <Link href="https://meetcursive.com" className="hover:opacity-80 transition-opacity">
              <Image
                src="/cursive-logo.png"
                alt="Cursive"
                width={120}
                height={120}
                className="w-24 h-24 md:w-28 md:h-28"
              />
            </Link>
          </motion.div>

          <motion.h1 variants={headingVariants} className="text-2xl md:text-3xl font-bold text-foreground text-center">
            {question}
          </motion.h1>

          <motion.div variants={fastStaggerContainerVariants} initial="initial" animate="animate" className="space-y-3">
            {options.map((option) => (
              <motion.button
                key={option}
                onClick={() => onAnswer(option)}
                variants={optionItemVariants}
                whileHover="hover"
                whileTap="tap"
                custom={buttonVariants}
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

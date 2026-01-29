/**
 * Title/Splash Screen (Screen 1)
 * Entry point - user selects Business or Partner path
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Building2, Users } from 'lucide-react'
import { cardVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/utils/waitlist-animations'
import type { UserType } from '@/types/waitlist.types'

interface TitleScreenProps {
  onSelectUserType: (type: UserType) => void
}

export function TitleScreen({ onSelectUserType }: TitleScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo */}
      <header className="p-6">
        <div className="flex items-center gap-2.5">
          <Image src="/cursive-logo.png" alt="Cursive" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-semibold text-foreground">Cursive</span>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="flex-1 flex items-center justify-center px-6 pb-12"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="w-full max-w-2xl">
          {/* Headline */}
          <motion.h1
            variants={staggerItemVariants}
            className="text-4xl md:text-5xl font-bold text-foreground text-center mb-4"
          >
            AI Intent Systems That Never Sleep.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={staggerItemVariants}
            className="text-lg text-muted-foreground text-center mb-12 max-w-xl mx-auto leading-relaxed"
          >
            Cursive identifies real people actively searching for your service, enriches them with verified contact
            data, and activates them through automated outbound.
          </motion.p>

          {/* CTA Section */}
          <motion.div variants={staggerItemVariants} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-6">Who Are You Joining As?</h2>
            </div>

            {/* User Type Cards */}
            <div className="grid gap-4 md:gap-6">
              {/* Business Card */}
              <motion.button
                onClick={() => onSelectUserType('business')}
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className="group relative bg-card border-2 border-border rounded-xl p-6 md:p-8 text-left transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Request Access as a Business</h3>
                    <p className="text-sm text-muted-foreground">Get qualified leads delivered daily</p>
                  </div>
                </div>
              </motion.button>

              {/* Partner Card */}
              <motion.button
                onClick={() => onSelectUserType('partner')}
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className="group relative bg-card border-2 border-border rounded-xl p-6 md:p-8 text-left transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Request Access as a Partner</h3>
                    <p className="text-sm text-muted-foreground">Earn revenue from your lead database</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Footer Text */}
          <motion.p variants={staggerItemVariants} className="text-sm text-muted-foreground text-center mt-8">
            Limited to first 100 businesses and first 100 partners
          </motion.p>
        </div>
      </motion.main>
    </div>
  )
}

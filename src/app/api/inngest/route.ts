// Inngest API Route
// Serves Inngest functions for background job processing

import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import * as functions from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Lead Generation & Management
    functions.dailyLeadGeneration,
    functions.leadEnrichment,
    functions.leadEnrichmentFailure,
    functions.leadDelivery,
    functions.platformUpload,

    // System Jobs
    functions.creditReset,
    functions.weeklyTrends,
    functions.webhookRetryProcessor,

    // Marketplace Functions
    functions.processPartnerUpload,
    functions.processEmailVerification,

    // Marketplace Jobs
    functions.dailyFreshnessDecay,
    functions.dailyPartnerScoreCalculation,
    functions.monthlyVolumeBonusUpdate,
    functions.processReferralMilestones,
    functions.updatePartnerDataCompleteness,

    // Partner Payouts
    functions.weeklyPartnerPayouts,
    functions.triggerManualPayout,
    functions.dailyCommissionRelease,
    functions.reconcilePayouts,
  ],
})

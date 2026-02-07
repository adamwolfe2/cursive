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
    functions.retryStalledUploads,
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

    // Lead Routing Retry & Cleanup
    functions.processLeadRoutingRetryQueue,
    functions.triggerLeadRoutingRetry,
    functions.cleanupStaleRoutingLocks,
    functions.markExpiredLeads,
    functions.leadRoutingHealthCheck,

    // Service Subscription Reminders
    functions.sendOnboardingReminders,
    functions.sendRenewalReminders,

    // Campaign Functions
    functions.composeCampaignEmail,
    functions.batchComposeCampaignEmails,
    functions.enrichCampaignLead,
    functions.batchEnrichCampaignLeads,
    functions.processReply,
    functions.batchProcessReplies,
    functions.activateScheduledCampaigns,
    functions.autoCompleteCampaignsCron,
    functions.onCampaignStatusChange,
    functions.sendApprovedEmail,
    functions.batchSendApprovedEmails,
    functions.onEmailApproved,
    functions.processCampaignSequences,
    functions.handleAutoSendEmail,
    functions.checkSequenceCompletion,

    // Email Verification
    functions.processEmailVerificationQueue,
    functions.continueEmailVerification,
    functions.queueNewLeadsForVerification,
    functions.reverifyStaleLeads,
    functions.updatePartnerVerificationRates,

    // Daily Operations
    functions.resetDailySendCounts,
    functions.resetWorkspaceSendCount,

    // Error Handling & Retries
    functions.processRetryQueue,
    functions.cleanupFailedJobs,
    functions.onJobRetryRequested,

    // Timezone Optimization
    functions.recalculateOptimalTimes,
    functions.inferLeadTimezones,
    functions.onCampaignScheduleChanged,
    functions.updateLeadTimezoneFromEnrichment,

    // Webhook Delivery
    functions.deliverLeadWebhook,
    functions.retryWebhookDeliveries,
    functions.sendLeadEmailNotification,

    // Website Scraping
    functions.scrapeWebsite,

    // Enrichment Pipeline
    functions.processEnrichmentJob,
    functions.batchEnrichLeads,
    functions.enrichNewLead,

    // Email Sequences
    functions.processSequenceEnrollment,
    functions.processSequenceStep,
    functions.batchEnrollSequence,
    functions.processScheduledSteps,

    // Demo Nurture Sequence
    functions.demoNurtureSequence,

    // Purchase Email Sending with Retries
    functions.sendPurchaseEmail,
    functions.sendCreditPurchaseEmail,

    // Stripe Webhook Processing with Retries
    functions.processStripeWebhook,
    functions.handleWebhookFailure,

    // Operations Health Monitoring
    functions.monitorOperationsHealth,

    // Bulk Upload Processing
    functions.processBulkUpload,
    functions.enrichLeadFromDataShopper,
    functions.importLeadFromAudienceLabs,

    // Marketplace Upsell & Onboarding
    functions.marketplaceUpsellCheck,
    functions.marketplaceOnboardingSequence,
    functions.handleCustomAudienceRequest,
  ],
})

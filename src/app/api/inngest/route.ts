// Inngest API Route
// Serves Inngest functions for background job processing
// Requires Node.js runtime — Inngest functions transitively import nodemailer
// (via email-sequences → email-sender.service) which requires Node.js APIs.

export const runtime = 'nodejs'

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
    functions.nightlyBalanceAudit,
    functions.refreshEarningsView,

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

    // Lead Notifications (Slack & Zapier)
    functions.sendLeadNotifications,

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
    functions.importLeadFromAudienceLabs,

    // Marketplace Upsell & Onboarding
    functions.marketplaceUpsellCheck,
    functions.marketplaceOnboardingSequence,
    functions.handleCustomAudienceRequest,

    // AI Audit Processing
    functions.processAiAudit,

    // GHL Admin (Cursive's own GHL account automation)
    functions.ghlOnboardCustomer,
    functions.ghlCreateSubaccount,
    functions.ghlDeliverLeads,

    // GHL Client Sync (sync leads to client's own GHL via OAuth)
    functions.ghlSyncContact,
    functions.ghlBulkSync,

    // DFY Onboarding Sequence
    functions.dfyOnboardingSequence,

    // Autonomous Monitoring & Pipeline Tracking
    functions.universalFailureHandler,
    functions.ghlPipelineLifecycle,
    functions.customerLifecycleMonitor,

    // Audience Labs Event Processing
    functions.processAudienceLabEvent,

    // Audience Labs Segment Puller (cron — pulls leads from AL Audiences API)
    functions.audienceLabSegmentPuller,

    // Daily Lead Distribution (cron — distributes daily leads to users)
    functions.distributeDailyLeads,

    // Stale Lead Cleanup (nightly — removes AL-sourced leads older than 45 days)
    functions.cleanupStaleLeads,

    // Pixel Trial Drip (event-triggered email series) + daily trial expiry check
    functions.pixelTrialDrip,
    functions.checkPixelTrialExpiry,
  ],
})

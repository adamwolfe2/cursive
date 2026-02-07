// Export all Inngest functions

export { dailyLeadGeneration } from './daily-lead-generation'
export { leadEnrichment, leadEnrichmentFailure } from './lead-enrichment'
export { leadDelivery } from './lead-delivery'
export { platformUpload } from './platform-upload'
export { creditReset } from './credit-reset'
export { weeklyTrends } from './weekly-trends'

// Marketplace functions
export { processPartnerUpload, retryStalledUploads } from './partner-upload-processor'
export { processEmailVerification } from './email-verification-processor'

// Marketplace jobs (scoring, freshness, bonuses)
export {
  dailyFreshnessDecay,
  dailyPartnerScoreCalculation,
  monthlyVolumeBonusUpdate,
  processReferralMilestones,
  updatePartnerDataCompleteness,
} from './marketplace-jobs'

// Partner payout functions
export {
  weeklyPartnerPayouts,
  triggerManualPayout,
  dailyCommissionRelease,
  reconcilePayouts,
} from './partner-payouts'

// Webhook retry processor
export { webhookRetryProcessor } from './webhook-retry-processor'

// Lead routing retry and cleanup functions
export {
  processLeadRoutingRetryQueue,
  triggerLeadRoutingRetry,
  cleanupStaleRoutingLocks,
  markExpiredLeads,
  leadRoutingHealthCheck,
} from './lead-routing-retry'

// Service subscription reminder emails
export { sendOnboardingReminders } from './send-onboarding-reminders'
export { sendRenewalReminders } from './send-renewal-reminders'

// Campaign functions
export {
  composeCampaignEmail,
  batchComposeCampaignEmails,
} from './campaign-compose'

export {
  enrichCampaignLead,
  batchEnrichCampaignLeads,
} from './campaign-enrichment'

export {
  processReply,
  batchProcessReplies,
} from './campaign-reply'

export {
  activateScheduledCampaigns,
  autoCompleteCampaignsCron,
  onCampaignStatusChange,
} from './campaign-scheduler'

export {
  sendApprovedEmail,
  batchSendApprovedEmails,
  onEmailApproved,
} from './campaign-send'

export {
  processCampaignSequences,
  handleAutoSendEmail,
  checkSequenceCompletion,
} from './campaign-sequence-processor'

// Email verification functions
export {
  processEmailVerificationQueue,
  continueEmailVerification,
  queueNewLeadsForVerification,
  reverifyStaleLeads,
  updatePartnerVerificationRates,
} from './email-verification'

// Daily operations
export {
  resetDailySendCounts,
  resetWorkspaceSendCount,
} from './reset-daily-send-counts'

// Error handling and retries
export {
  processRetryQueue,
  cleanupFailedJobs,
  onJobRetryRequested,
} from './retry-failed-jobs'

// Timezone optimization
export {
  recalculateOptimalTimes,
  inferLeadTimezones,
  onCampaignScheduleChanged,
  updateLeadTimezoneFromEnrichment,
} from './timezone-optimizer'

// Webhook delivery
export {
  deliverLeadWebhook,
  retryWebhookDeliveries,
  sendLeadEmailNotification,
} from './webhook-delivery'

// Website scraping
export { scrapeWebsite } from './website-scraper'

// Enrichment pipeline
export {
  processEnrichmentJob,
  batchEnrichLeads,
  enrichNewLead,
} from './enrichment-pipeline'

// Email sequences
export {
  processSequenceEnrollment,
  processSequenceStep,
  batchEnrollSequence,
  processScheduledSteps,
} from './email-sequences'

// Demo nurture sequence
export { demoNurtureSequence } from './demo-nurture-sequence'

// Purchase email sending with retries
export { sendPurchaseEmail, sendCreditPurchaseEmail } from './send-purchase-email'

// Stripe webhook processing with retries
export { processStripeWebhook, handleWebhookFailure } from './process-stripe-webhook'

// Operations health monitoring
export { monitorOperationsHealth } from './monitor-operations-health'

// Alert monitoring
// NOTE: checkAlerts from ../monitoring/check-alerts.ts is NOT registered because
// it imports checkAlertRules from @/lib/monitoring/alerts which does not exist.
// The function needs to be implemented before it can be registered.

// Bulk upload processing
export {
  processBulkUpload,
  enrichLeadFromDataShopper,
  importLeadFromAudienceLabs,
} from '@/lib/inngest/functions/bulk-upload-processor'

// Marketplace upsell and onboarding
export { marketplaceUpsellCheck } from './marketplace-upsell'
export { marketplaceOnboardingSequence } from './marketplace-onboarding'
export { handleCustomAudienceRequest } from './custom-audience-request'

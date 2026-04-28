// Export all Inngest functions

export { refreshWorkspaceStats } from './refresh-workspace-stats'
export { dailyLeadGeneration } from './daily-lead-generation'
export { leadEnrichment, leadEnrichmentFailure } from './lead-enrichment'
export { leadDelivery } from './lead-delivery'
export { platformUpload } from './platform-upload'
export { creditReset } from './credit-reset'
export { weeklyTrends } from './weekly-trends'

// Marketplace functions
export { processPartnerUpload, retryStalledUploads } from './partner-upload-processor'
export { processEmailVerification } from './email-verification-processor'
export { marketplaceLeadRefresh } from './marketplace-lead-refresh'

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

// Partner balance audit (nightly verification)
export { nightlyBalanceAudit } from './nightly-balance-audit'

// Partner earnings view refresh (hourly)
export { refreshEarningsView } from './refresh-earnings-view'

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

// Outbound webhook fan-out (multi-endpoint subscription system)
export { deliverOutboundWebhooks } from './outbound-webhook-delivery'

// Lead notifications (Slack & Zapier)
export { sendLeadNotifications } from './lead-notifications'

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

// Alert monitoring (runs every 5 minutes — checks webhook backlogs, platform alerts, email failures)
export { checkAlerts } from '../monitoring/check-alerts'

// Bulk upload processing
export {
  processBulkUpload,
  importLeadFromAudienceLabs,
} from '@/lib/inngest/functions/bulk-upload-processor'

// Marketplace upsell and onboarding
export { marketplaceUpsellCheck } from './marketplace-upsell'
export { marketplaceOnboardingSequence } from './marketplace-onboarding'
export { handleCustomAudienceRequest } from './custom-audience-request'

// Post-purchase nurture drip (3-email sequence after credit purchase)
export { postPurchaseSequence } from './post-purchase-sequence'

// Credit auto-recharge (triggered on credit-purchased or credits-low)
export { creditAutoRecharge } from './credit-auto-recharge'

// AI Audit Processing
export { processAiAudit } from './process-ai-audit'

// GHL Admin (Cursive's own GHL account automation)
export { ghlOnboardCustomer } from './ghl-onboard-customer'
export { ghlCreateSubaccount } from './ghl-create-subaccount'
export { ghlDeliverLeads } from './ghl-deliver-leads'

// GHL Client Sync (sync leads to client's own GHL via OAuth)
export { ghlSyncContact, ghlBulkSync } from './ghl-sync-contact'

// GHL Marketplace App — visitor sync (6h cron, post-marketplace-install)
export { marketplaceGhlSync } from './marketplace-ghl-sync'

// Shopify Marketplace App — metafield writeback (6h cron)
export { marketplaceShopifyMetafields } from './marketplace-shopify-metafields'

// DFY Onboarding Sequence (post-onboarding form drip)
export { dfyOnboardingSequence } from './dfy-onboarding-sequence'

// Universal Failure Handler (catches ALL Inngest failures → Slack)
export { universalFailureHandler } from './inngest-failure-handler'

// GHL Pipeline Lifecycle (auto-moves contacts through pipeline)
export { ghlPipelineLifecycle } from './ghl-pipeline-lifecycle'

// Customer Health Monitor (daily cron for stuck customers)
export { customerLifecycleMonitor } from './customer-lifecycle-monitor'

// Audience Labs Event Processing
export { processAudienceLabEvent } from './audiencelab-processor'

// Audience Labs Segment Puller (cron — pulls leads from AL Audiences API)
export { audienceLabSegmentPuller } from './audiencelab-segment-puller'

// Audience Labs Workspace Provisioner (event — immediate first-pull for new signups)
export { provisionWorkspaceAudience } from './provision-workspace-audience'

// Daily Lead Distribution (cron — distributes daily leads to users)
export { distributeDailyLeads } from './distribute-daily-leads'

// Stale Lead Cleanup (nightly — removes AL-sourced leads older than 45 days)
export { cleanupStaleLeads } from './cleanup-stale-leads'

// Pixel Trial Drip (event-triggered 6-email series) + daily trial expiry check
export { pixelTrialDrip, checkPixelTrialExpiry } from './pixel-trial-drip'

// Inactive user re-engagement
export { inactiveUserReengagement } from './inactive-reengagement'

// Abandoned onboarding recovery (daily — re-engages users who haven't finished setup)
export { abandonedOnboardingRecovery } from './abandoned-onboarding'

// Abandoned cart recovery (every 4h — sends recovery emails for incomplete Stripe checkouts)
export { abandonedCartRecovery } from './abandoned-cart-recovery'

// AI SDR Follow-up Cron (9am CT weekdays)
export { sdrFollowupCron } from './sdr-followup'

// Weekly Summary Email (Monday 9am CT — activity digest per workspace)
export { weeklySummaryEmail } from './weekly-summary-email'

// Monthly Summary Email (1st of each month 9am UTC — full month results per workspace)
export { monthlySummaryEmail } from './monthly-summary-email'

// Partner Stripe Connect Validation (daily 10am CT — reminds partners to complete Stripe onboarding)
export { partnerStripeValidation } from './partner-stripe-validation'

// Credit Alert Checker (twice daily — emails workspace owners when balance below threshold)
export { creditAlertChecker } from './credit-alert-checker'

// Cal.com no-show recovery (2-email sequence when prospect misses the call)
export { calNoShowRecovery } from './no-show-recovery'

// Pixel V4 Pull-Sync (every 2h — enriches leads with DNC flags, intent scores, department)
export { pixelV4Sync } from './pixel-v4-sync'

// Intelligence Pack (on-demand Tier 2 + Tier 3 enrichment)
export { intelligencePack } from './intelligence-pack'

// First Leads Arrived notification (onboarding milestone — sends email when workspace gets first leads)
export { firstLeadsArrived } from './first-leads-arrived'

// Trial countdown emails (daily cron — -7d, -3d, day-of reminders before pixel trial expiry)
export { trialCountdownEmails } from './trial-countdown-emails'

// DFY Upsell Trigger (daily 10am UTC — targets workspaces with 50+ leads and $0 managed spend)
export { dfyUpsellTrigger } from './dfy-upsell-trigger'

// Rate limit logs cleanup (hourly — deletes entries older than 2h to prevent unbounded table growth)
export { cleanupRateLimitLogs } from './cleanup-rate-limit-logs'

// Webhook events cleanup (daily — deletes events older than 30 days to prevent unbounded table growth)
export { cleanupWebhookEvents } from './cleanup-webhook-events'

// Audit logs cleanup (daily 4am UTC — deletes entries older than 90 days)
export { cleanupAuditLogs } from './cleanup-audit-logs'

// Failed operations cleanup (daily 4:30am UTC — deletes resolved entries older than 30 days)
export { cleanupFailedOperations } from './cleanup-failed-operations'

// Client Onboarding Pipeline
export { onboardingIntakePipeline } from './onboarding-intake-pipeline'
export { onboardingCopyRegeneration } from './onboarding-copy-regeneration'
export { onboardingRetryEnrichment } from './onboarding-retry-enrichment'
export { onboardingEmailBisonPush } from './onboarding-emailbison-push'

// Autoresearch (Karpathy loop: generate -> wait -> evaluate -> repeat)
export {
  startAutoresearchProgram,
  generateAutoresearchExperiment,
  evaluateAutoresearchExperiment,
} from './autoresearch-orchestrator'
export { autoresearchReplySync } from './autoresearch-reply-sync'

// AI SDR Inbox Sync (every 15 min — processes new replies through AI reply engine)
export { sdrInboxSync } from './sdr-inbox-sync'

// User lead cap resets (daily/weekly/monthly — prevents leads from permanently stopping)
export {
  resetUserDailyLeadCaps,
  resetUserWeeklyLeadCaps,
  resetUserMonthlyLeadCaps,
} from './reset-user-lead-caps'

// Outbound Agent (Rox-inspired AI revenue agent)
export { outboundWorkflowRun } from './outbound-workflow-run'
export {
  outboundStatsRefresherCron,
  outboundStatsRefresherEvent,
} from './outbound-stats-refresher'

// Gmail Reply Poller (Phase 2.5 — tracks replies for Gmail-sent emails)
export {
  gmailReplyPollerCron,
  gmailReplyPollerPerAccount,
} from './gmail-reply-poller'

// AudienceLab DFY Fulfillment Automation
// Weekly Monday refresh of DFY client audiences (net-new leads)
export { alAudienceRefresh } from './al-audience-refresh'
// Every-5-min poller for pending batch enrichment jobs
export { alEnrichmentPoller } from './al-enrichment-poller'

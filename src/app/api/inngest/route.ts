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

    // Campaign Functions (Sales.co)
    functions.enrichCampaignLead,
    functions.batchEnrichCampaignLeads,
    functions.composeCampaignEmail,
    functions.batchComposeCampaignEmails,
    functions.sendApprovedEmail,
    functions.batchSendApprovedEmails,
    functions.onEmailApproved,
    functions.processReply,
    functions.batchProcessReplies,
    functions.activateScheduledCampaigns,
    functions.autoCompleteCampaignsCron,
    functions.onCampaignStatusChange,
    functions.processCampaignSequences,
    functions.handleAutoSendEmail,
    functions.checkSequenceCompletion,
    functions.resetDailySendCounts,
    functions.resetWorkspaceSendCount,
    functions.recalculateOptimalTimes,
    functions.inferLeadTimezones,
    functions.onCampaignScheduleChanged,
    functions.updateLeadTimezoneFromEnrichment,

    // System Jobs
    functions.creditReset,
    functions.weeklyTrends,
    functions.processRetryQueue,
    functions.cleanupFailedJobs,
    functions.onJobRetryRequested,
    functions.webhookRetryProcessor,

    // Webhook Delivery
    functions.deliverLeadWebhook,
    functions.retryWebhookDeliveries,
    functions.sendLeadEmailNotification,
  ],
})

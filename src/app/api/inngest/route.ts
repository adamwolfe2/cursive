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

    // System Jobs
    functions.creditReset,
    functions.weeklyTrends,

    // Webhook Delivery
    functions.deliverLeadWebhook,
    functions.retryWebhookDeliveries,
    functions.sendLeadEmailNotification,
  ],
})

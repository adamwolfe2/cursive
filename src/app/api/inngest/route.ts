// Inngest API Route
// Serves Inngest functions for background job processing

import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import * as functions from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    functions.dailyLeadGeneration,
    functions.leadEnrichment,
    functions.leadEnrichmentFailure,
    functions.leadDelivery,
    functions.platformUpload,
    functions.creditReset,
    functions.weeklyTrends,
  ],
})

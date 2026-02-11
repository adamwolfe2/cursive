/**
 * Audience Labs Integration
 *
 * AL integration has two modes:
 *   A) Push (webhooks) — canonical ingestion for real-time data:
 *      1. SuperPixel events → /api/webhooks/audiencelab/superpixel
 *      2. AudienceSync HTTP destination → /api/webhooks/audiencelab/audiencesync
 *      3. Batch export imports → /api/audiencelab/import
 *   B) Pull (REST API) — provisioning, enrichment, and audience queries:
 *      - Pixel creation: POST /pixels (automated B2B onboarding)
 *      - Audience attributes: GET /audiences/attributes/{attr} (discover segments, industries)
 *      - Audience preview: POST /audiences/preview (count + sample)
 *      - Audience create: POST /audiences (build segment query)
 *      - Audience fetch: GET /audiences/{id} (paginated record pull)
 *      - Single enrichment: POST /enrich
 *      - Batch enrichment: POST /enrichments (job-based)
 *
 * REST API client: src/lib/audiencelab/api-client.ts
 * Schemas: src/lib/audiencelab/schemas.ts
 * Field normalization: src/lib/audiencelab/field-map.ts
 */

import crypto from 'crypto'

// Re-export schemas and field-map for convenience
export { SuperPixelEventSchema, AudienceSyncEventSchema, ExportRowSchema } from '@/lib/audiencelab/schemas'
export { normalizeALPayload, computeDeliverabilityScore } from '@/lib/audiencelab/field-map'

/**
 * Verify AL webhook secret (shared secret or HMAC signature).
 * Used by both superpixel and audiencesync webhook handlers.
 */
export function verifyAudienceLabWebhook(
  rawBody: string,
  headers: {
    secret?: string | null
    signature?: string | null
  }
): boolean {
  const webhookSecret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!webhookSecret) return false

  // Check shared secret header
  if (headers.secret) {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(headers.secret),
        Buffer.from(webhookSecret)
      )
    } catch {
      return false
    }
  }

  // Check HMAC signature
  if (headers.signature) {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')
    const provided = headers.signature.replace(/^sha256=/, '')
    try {
      return crypto.timingSafeEqual(
        Buffer.from(provided),
        Buffer.from(expected)
      )
    } catch {
      return false
    }
  }

  return false
}

/**
 * Get the configured AL pixel ID (optional — can also be derived from events).
 */
export function getPixelId(): string | null {
  return process.env.AUDIENCELAB_PIXEL_ID || null
}

/**
 * Get the AL account API key for REST API access.
 * Used by src/lib/audiencelab/api-client.ts for pixel provisioning,
 * audience listing, and on-demand enrichment.
 */
export function getAccountApiKey(): string | null {
  return process.env.AUDIENCELAB_ACCOUNT_API_KEY || null
}

// Re-export REST API client for convenience
export {
  createPixel,
  listPixels,
  listAudiences,
  enrich,
  provisionCustomerPixel,
  healthCheck as alHealthCheck,
  // Audience builder
  getAudienceAttributes,
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  // Batch enrichment
  createBatchEnrichment,
  getBatchEnrichmentStatus,
} from '@/lib/audiencelab/api-client'

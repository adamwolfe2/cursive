/**
 * ICP audience sync — weekly, plus on demand via `icp/audience.sync`.
 *
 * For every workspace whose ICP has an audience configured
 * (workspaces.settings.icp.audience.enabled), build a fresh AudienceLab
 * audience of people researching the workspace's intent topics this week at
 * companies in its industries and seniority, then deliver only records that
 * score as ICP matches. Deduped per workspace by email, so each run adds
 * net-new in-market contacts.
 */
import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createIntentAudience,
  fetchAudienceRecords,
  AudienceLabUnfilteredError,
} from '@/lib/audiencelab/api-client'
import { bulkInsertALRecords } from '@/lib/audiencelab/lead-inserter'
import { parseWorkspaceIcp } from '@/lib/icp/profile'
import { buildIcpAudienceRequest } from '@/lib/icp/audience'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[ICP Audience Sync]'
const PAGE_SIZE = 100
const MAX_PAGES = 20

export const icpAudienceSync = inngest.createFunction(
  {
    id: 'icp-audience-sync',
    name: 'ICP Audience Weekly Sync',
    retries: 1,
    timeouts: { finish: '30m' },
    concurrency: { limit: 1 },
  },
  [{ cron: '0 9 * * 1' }, { event: 'icp/audience.sync' }],
  async ({ event, step }) => {
    if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
      return { skipped: true, reason: 'no_api_key' }
    }
    const onlyWorkspace = (event?.data as { workspaceId?: string } | undefined)?.workspaceId

    const workspaces = await step.run('load-icp-workspaces', async () => {
      let query = createAdminClient()
        .from('workspaces')
        .select('id, settings')
        .eq('settings->icp->audience->>enabled', 'true')
      if (onlyWorkspace) query = query.eq('id', onlyWorkspace)
      const { data, error } = await query
      if (error) throw new Error(`load workspaces: ${error.message}`)
      return (data || []).map(w => ({ id: w.id as string, settings: w.settings as unknown }))
    })

    const results: Array<{ workspaceId: string; inserted: number; scanned: number; error?: string }> = []

    for (const ws of workspaces) {
      const icp = parseWorkspaceIcp(ws.settings)
      const request = icp ? buildIcpAudienceRequest(icp) : null
      if (!icp || !request) {
        results.push({ workspaceId: ws.id, inserted: 0, scanned: 0, error: 'invalid_icp' })
        continue
      }

      const audienceId = await step.run(`create-audience-${ws.id}`, async () => {
        const created = await createIntentAudience({ ...request, name: `cursive-icp-${ws.id}-${Date.now()}` })
        if (!created.audienceId) throw new Error('AudienceLab returned no audienceId')
        await createAdminClient().from('al_audiences').insert({
          workspace_id: ws.id,
          al_audience_id: created.audienceId,
          name: 'ICP in-market audience',
          filters: { kind: 'icp_intent', ...request },
          refresh_enabled: false,
        })
        return created.audienceId
      })

      // AL materializes the audience asynchronously; records were readable ~20s after create in testing.
      await step.sleep(`wait-audience-${ws.id}`, '60s')

      const result = await step.run(`pull-audience-${ws.id}`, async () => {
        let inserted = 0
        let scanned = 0
        try {
          for (let page = 1; page <= MAX_PAGES && inserted < icp.audience.weeklyLimit; page++) {
            const response = await fetchAudienceRecords(audienceId, page, PAGE_SIZE)
            const records = response.data || []
            if (records.length === 0) break
            scanned += records.length
            const batch = await bulkInsertALRecords(records, {
              workspaceId: ws.id,
              sourceTag: 'audiencelab_pull',
              extraTags: ['icp-audience', 'in-market'],
              icp,
              maxRecords: icp.audience.weeklyLimit - inserted,
            })
            inserted += batch.inserted
            if (records.length < PAGE_SIZE) break
          }
        } catch (err) {
          if (!(err instanceof AudienceLabUnfilteredError)) throw err
          safeError(`${LOG_PREFIX} unfiltered response for workspace ${ws.id}; stopped`, err)
          return { inserted, scanned, error: 'unfiltered' }
        }
        await createAdminClient()
          .from('al_audiences')
          .update({ leads_imported: inserted, last_refreshed_at: new Date().toISOString() })
          .eq('al_audience_id', audienceId)
          .eq('workspace_id', ws.id)
        return { inserted, scanned }
      })

      safeLog(`${LOG_PREFIX} workspace ${ws.id}: ${result.inserted} ICP leads from ${result.scanned} in-market records`)
      results.push({ workspaceId: ws.id, ...result })
    }

    return { workspaces: results.length, results }
  }
)

/**
 * Workspace ICP profile — stored at workspaces.settings.icp.
 *
 * One definition drives three things: scoring every identified pixel visitor,
 * gating AudienceLab audience records, and building the weekly in-market ICP
 * audience (intent segments + firmographic filters).
 */
import { z } from 'zod'

const list = z.array(z.string().trim().min(1).max(120)).max(200).default([])

export const icpProfileSchema = z.object({
  /** AudienceLab taxonomy industry names, lowercase ("wholesale", "plastics manufacturing"). */
  industries: list,
  /** AudienceLab seniority values: cxo, vp, director, manager, staff, owner, partner, founder, president, ceo, cfo, cto, coo. */
  seniority: list,
  /** Whole-word title matches that signal a buyer ("ecommerce", "digital", "operations"). */
  titleKeywords: list,
  /** Whole-word title matches that disqualify ("intern", "student"). */
  excludeTitleKeywords: list,
  /** Domains never to deliver (own company, competitors, vendors). */
  excludeDomains: list,
  employeeMin: z.number().int().min(0).optional(),
  employeeMax: z.number().int().min(1).optional(),
  /** Industry is decisive: without an industry match a lead is never an ICP match (score capped below minScore). */
  requireIndustry: z.boolean().default(false),
  /** B2B workspace: make the work email the primary contact when one exists. */
  preferWorkEmail: z.boolean().default(true),
  /** Score at or above which a lead counts as an ICP match (0-100). */
  minScore: z.number().int().min(0).max(100).default(60),
  audience: z
    .object({
      enabled: z.boolean().default(false),
      /** Exact AudienceLab B2B intent segment ids ("b2b_15263"). */
      intentSegments: z.array(z.string().regex(/^b2b_\d{1,7}$/)).max(25).default([]),
      /** AL intent strength: low | medium | high. */
      intentScores: z.array(z.enum(['low', 'medium', 'high'])).max(3).default([]),
      weeklyLimit: z.number().int().min(1).max(1000).default(200),
    })
    .default({ enabled: false, intentSegments: [], intentScores: [], weeklyLimit: 200 }),
})

export type IcpProfile = z.output<typeof icpProfileSchema>

/** Returns the parsed ICP, or null when the workspace has none (or it is malformed). */
export function parseWorkspaceIcp(settings: unknown): IcpProfile | null {
  if (!settings || typeof settings !== 'object') return null
  const raw = (settings as Record<string, unknown>).icp
  if (!raw) return null
  const parsed = icpProfileSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

type SettingsReader = {
  from: (table: 'workspaces') => {
    select: (cols: 'settings') => {
      eq: (col: 'id', v: string) => { maybeSingle: () => PromiseLike<{ data: { settings: unknown } | null; error: unknown }> }
    }
  }
}

export async function loadWorkspaceIcp(supabase: unknown, workspaceId: string): Promise<IcpProfile | null> {
  const { data, error } = await (supabase as SettingsReader)
    .from('workspaces')
    .select('settings')
    .eq('id', workspaceId)
    .maybeSingle()
  if (error || !data) return null
  return parseWorkspaceIcp(data.settings)
}

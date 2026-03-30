/**
 * Email Accounts API
 * GET  /api/email-accounts — list workspace email accounts
 * POST /api/email-accounts — add SMTP account
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  success,
  created,
} from '@/lib/utils/api-error-handler'
import { EmailAccountRepository } from '@/lib/repositories/email-account.repository'

const createSmtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'From name is required').max(100),
  smtp_host: z.string().min(1, 'SMTP host is required').max(255),
  smtp_port: z
    .number()
    .int()
    .min(1)
    .max(65535)
    .or(z.string().regex(/^\d+$/).transform(Number))
    .pipe(z.number().int().min(1).max(65535)),
  smtp_username: z.string().min(1, 'SMTP username is required').max(255),
  smtp_password: z.string().min(1, 'SMTP password is required').max(500),
  daily_send_limit: z
    .number()
    .int()
    .min(1)
    .max(10000)
    .optional()
    .default(50),
})

/**
 * GET /api/email-accounts
 * List all email accounts for the current workspace (no tokens/passwords returned)
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new EmailAccountRepository()
    const accounts = await repo.findByWorkspace(user.workspace_id)

    return success({ accounts })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/email-accounts
 * Add a new SMTP email account
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = createSmtpSchema.parse(body)

    const repo = new EmailAccountRepository()
    const account = await repo.createSmtp({
      workspaceId: user.workspace_id,
      email: validated.email,
      name: validated.name,
      smtpHost: validated.smtp_host,
      smtpPort: validated.smtp_port,
      smtpUsername: validated.smtp_username,
      smtpPassword: validated.smtp_password,
      dailySendLimit: validated.daily_send_limit,
    })

    return created({ account })
  } catch (error) {
    return handleApiError(error)
  }
}

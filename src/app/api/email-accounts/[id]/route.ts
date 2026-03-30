/**
 * Email Account Detail API
 * PATCH /api/email-accounts/[id] — set as primary or test connection
 * DELETE /api/email-accounts/[id] — remove account
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import * as nodemailer from 'nodemailer'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  success,
  noContent,
  notFound,
  badRequest,
} from '@/lib/utils/api-error-handler'
import { EmailAccountRepository } from '@/lib/repositories/email-account.repository'

const patchSchema = z.object({
  action: z.enum(['set_primary', 'test_connection']),
})

/**
 * PATCH /api/email-accounts/[id]
 * set_primary: make this the workspace's default sending account
 * test_connection: send a test email via the stored SMTP credentials
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const { action } = patchSchema.parse(body)

    const repo = new EmailAccountRepository()

    if (action === 'set_primary') {
      await repo.setPrimary(id, user.workspace_id)
      return success({ message: 'Email account set as primary' })
    }

    if (action === 'test_connection') {
      const creds = await repo.getSmtpCredentials(id, user.workspace_id)
      if (!creds) return notFound('Email account not found')

      try {
        const transporter = nodemailer.createTransport({
          host: creds.smtp_host,
          port: creds.smtp_port,
          secure: creds.smtp_port === 465,
          auth: {
            user: creds.smtp_username,
            pass: creds.smtp_password,
          },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
        })

        await transporter.verify()

        // Send actual test email to the account's own address
        await transporter.sendMail({
          from: `"${creds.name ?? 'Cursive'}" <${creds.email}>`,
          to: creds.email,
          subject: 'Cursive — SMTP Connection Test',
          text: 'This is a test email from Cursive confirming your SMTP connection is working.',
          html: '<p>This is a test email from <strong>Cursive</strong> confirming your SMTP connection is working.</p>',
        })

        // Mark as verified now that we know it works
        await repo.markVerified(id, user.workspace_id)

        return success({ message: `Test email sent to ${creds.email}` })
      } catch (smtpErr) {
        const msg =
          smtpErr instanceof Error ? smtpErr.message : 'Connection failed'
        return badRequest(`SMTP connection failed: ${msg}`)
      }
    }

    return badRequest('Unknown action')
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/email-accounts/[id]
 * Remove an email account (verifies workspace ownership first)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await params

    const repo = new EmailAccountRepository()

    // findByIdAndWorkspace is called inside repo.delete — ownership verified there
    await repo.delete(id, user.workspace_id)

    return noContent()
  } catch (error) {
    return handleApiError(error)
  }
}

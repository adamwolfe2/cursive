// Email Send API
// Send transactional emails via Resend

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.string(),
  data: z.record(z.any()),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    const validated = emailSchema.parse(body)

    // TODO: Implement actual email sending via Resend
    // This endpoint currently returns success but doesn't send emails
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'OpenInfo <noreply@openinfo.com>',
    //   to: validated.to,
    //   subject: validated.subject,
    //   react: EmailTemplate({ template: validated.template, data: validated.data })
    // })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error) {
    console.error('Error sending email:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

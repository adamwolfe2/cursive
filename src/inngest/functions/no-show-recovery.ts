/**
 * Cal.com No-Show Recovery
 *
 * Triggered when someone books Darren's calendar. Waits 1 hour after the
 * meeting end time, checks if they attended (pixel provisioned for their
 * domain = attended signal), and if not sends 2 recovery emails 24h apart.
 *
 * Automatically cancelled if a BOOKING_CANCELLED webhook arrives before
 * emails send (via Inngest cancelOn).
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const GENERIC_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'mail.com', 'live.com', 'msn.com',
  'googlemail.com', 'ymail.com',
])

/**
 * Attendance check: did Darren provision a pixel for this person's domain
 * during or after the scheduled meeting? If yes, they showed up.
 */
async function checkAttended(attendeeEmail: string, bookingStartTime: string): Promise<boolean> {
  const domain = attendeeEmail.split('@')[1]?.toLowerCase()
  if (!domain || GENERIC_DOMAINS.has(domain)) return false

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('audiencelab_pixels')
      .select('id')
      .eq('domain', domain)
      .eq('trial_status', 'trial')
      .not('workspace_id', 'is', null)
      .gte('updated_at', bookingStartTime)
      .limit(1)
      .maybeSingle()

    return !!data
  } catch (err) {
    safeError('[NoShow] Attendance check failed (non-fatal):', err)
    return false
  }
}

export const calNoShowRecovery = inngest.createFunction(
  {
    id: 'cal-no-show-recovery',
    retries: 2,
    timeouts: { finish: '15m' },
    cancelOn: [
      {
        event: 'cal/booking.cancelled',
        match: 'data.booking_uid',
      },
    ],
  },
  { event: 'cal/booking.created' },
  async ({ event, step }) => {
    const { booking_uid, attendee_name, attendee_email, end_time, start_time } = event.data

    const firstName = (attendee_name.split(' ')[0] || attendee_name).trim()

    // Wait until 1 hour after the meeting should have ended
    const waitUntil = new Date(new Date(end_time).getTime() + 60 * 60 * 1000)

    await step.sleepUntil('wait-for-meeting-to-end', waitUntil)

    // Check if they attended (pixel provisioned = attended)
    const attended = await step.run('check-attended', () =>
      checkAttended(attendee_email, start_time)
    )

    if (attended) {
      safeLog('[NoShow] Pixel provisioned — skipping no-show emails for:', attendee_email)
      return { skipped: true, reason: 'attended' }
    }

    // Email 1: warm missed-connection
    await step.run('send-email-1', async () => {
      await sendNoShowEmail1(attendee_email, firstName)
      safeLog('[NoShow] Sent email 1 to:', attendee_email)
    })

    // Wait 24 hours
    await step.sleep('wait-24h', '24h')

    // Check again — maybe they installed the pixel and signed up late
    const attendedLate = await step.run('check-attended-late', () =>
      checkAttended(attendee_email, start_time)
    )

    if (attendedLate) {
      safeLog('[NoShow] Late attendance — skipping email 2 for:', attendee_email)
      return { skipped_email2: true }
    }

    // Email 2: last-chance
    await step.run('send-email-2', async () => {
      await sendNoShowEmail2(attendee_email, firstName)
      safeLog('[NoShow] Sent email 2 to:', attendee_email)
    })

    return { booking_uid, emails_sent: 2 }
  }
)

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const RESCHEDULE_URL = 'https://cal.com/gotdarrenhill/30min'
const FROM = 'Darren at Cursive <darren@meetcursive.com>'

async function sendNoShowEmail1(to: string, firstName: string) {
  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hey ${firstName},
    </p>
    <p class="email-text">
      Looks like we missed each other today — completely fine, things come up.
    </p>
    <p class="email-text">
      I was looking forward to showing you what's actually happening on your site:
      the real people who visited, what pages they spent time on, and exactly who
      to reach out to first. It usually only takes a few minutes before you're seeing
      live data.
    </p>
    <p class="email-text">
      If you want to reschedule, grab any open slot below. 30 minutes and you'll
      leave with your SuperPixel installed and your first leads showing up in real time —
      free 14-day trial, no credit card.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${RESCHEDULE_URL}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Pick a New Time →
          </a>
        </td>
      </tr>
    </table>

    <div class="email-signature">
      <p style="margin:0 0 4px;">Darren<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
    </div>
  `

  return sendEmail({
    to,
    from: FROM,
    subject: `Hey ${firstName}, missed you today`,
    html: createEmailTemplate({
      preheader: `Grab a new time — 30 min and your first leads will be live.`,
      title: 'Missed you today',
      content,
    }),
    text: [
      `Hey ${firstName},`,
      ``,
      `Looks like we missed each other today — completely fine, things come up.`,
      ``,
      `I was looking forward to showing you the real people visiting your site and who to reach out to first.`,
      ``,
      `If you want to reschedule: ${RESCHEDULE_URL}`,
      ``,
      `30 minutes, free 14-day trial, no credit card.`,
      ``,
      `— Darren`,
      `Cursive · https://meetcursive.com`,
    ].join('\n'),
  })
}

async function sendNoShowEmail2(to: string, firstName: string) {
  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hey ${firstName},
    </p>
    <p class="email-text">
      Sending one last note in case you're still interested in seeing who's
      visiting your site.
    </p>
    <p class="email-text">
      No pressure at all — if the timing isn't right, completely understood.
      But if you want to turn your anonymous website traffic into identified leads
      with a name, email, and company attached, I'm still here.
    </p>
    <p class="email-text">
      30 minutes. Free 14-day trial. No credit card.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
      <tr>
        <td style="background-color:#111827;border-radius:8px;">
          <a href="${RESCHEDULE_URL}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Book a Time →
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#9ca3af;margin:0;">
      If now isn&apos;t the right time, no worries — I won&apos;t keep following up.
    </p>

    <div class="email-signature">
      <p style="margin:12px 0 4px;">Darren<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
    </div>
  `

  return sendEmail({
    to,
    from: FROM,
    subject: `Last note, ${firstName}`,
    html: createEmailTemplate({
      preheader: `Still happy to help — just say the word.`,
      title: 'One last note',
      content,
    }),
    text: [
      `Hey ${firstName},`,
      ``,
      `Sending one last note in case you're still interested.`,
      ``,
      `No pressure — if timing isn't right, completely understood. But if you want to turn your anonymous traffic into identified leads, I'm still here.`,
      ``,
      `30 minutes. Free 14-day trial. No credit card.`,
      ``,
      `${RESCHEDULE_URL}`,
      ``,
      `If now isn't the right time, no worries — I won't keep following up.`,
      ``,
      `— Darren`,
    ].join('\n'),
  })
}

/**
 * Pixel Trial Email Templates
 *
 * 6-email drip series for the 14-day SuperPixel trial.
 * Goal: show value → tease upsells → convert to Pro.
 *
 * Series:
 *  Day 0  — "Your pixel is live" (sent immediately on provision)
 *  Day 3  — First visitor report / install nudge
 *  Day 7  — Mid-trial: results so far + lookalike audience tease
 *  Day 10 — Warning: 4 days left
 *  Day 13 — Last chance: upgrade offer
 *  Day 14 — Trial expired: reclaim your data
 */

import { emailLayout, ctaButton, secondaryButton, divider, footnote, escapeHtml, BRAND, URLS } from './layout'

// ============================================
// TYPES
// ============================================

export interface PixelTrialEmailData {
  userName: string
  userEmail: string
  domain: string
  pixelId: string
  visitorCount?: number
  identifiedCount?: number
  topVisitors?: VisitorPreview[]
  trialEndsAt?: string   // ISO date
  daysLeft?: number
}

export interface VisitorPreview {
  name: string
  company?: string | null
  title?: string | null
  city?: string | null
}

// ============================================
// HELPERS
// ============================================

function visitorRow(v: VisitorPreview): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
        <div style="font-weight:600;color:${BRAND.text};font-size:14px;">${escapeHtml(v.name)}</div>
        ${v.company ? `<div style="color:${BRAND.textSecondary};font-size:13px;">${escapeHtml(v.company)}${v.title ? ` · ${escapeHtml(v.title)}` : ''}</div>` : ''}
        ${v.city ? `<div style="color:${BRAND.textMuted};font-size:12px;">📍 ${escapeHtml(v.city)}</div>` : ''}
      </td>
    </tr>`
}

function statBlock(value: string | number, label: string, color: string = BRAND.primary): string {
  return `
    <td style="text-align:center;padding:16px 24px;">
      <div style="font-size:32px;font-weight:700;color:${color};letter-spacing:-1px;">${value}</div>
      <div style="font-size:12px;color:${BRAND.textMuted};margin-top:2px;">${label}</div>
    </td>`
}

function urgencyBadge(text: string, color: string = BRAND.warning): string {
  return `<span style="display:inline-block;background:${color}1A;color:${color};border:1px solid ${color}40;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;letter-spacing:0.5px;">${text}</span>`
}

// ============================================
// DAY 0 — Pixel Live
// ============================================

export function pixelTrialWelcomeEmail(data: PixelTrialEmailData) {
  const subject = `🎯 Your SuperPixel is live on ${data.domain}`
  const html = emailLayout({
    preheader: `Your 14-day SuperPixel trial just started. Here's how to get the most out of it.`,
    content: `
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">Your SuperPixel is live ⚡</h2>
      <p style="margin:0 0 24px;color:${BRAND.textSecondary};font-size:15px;">
        Hi ${escapeHtml(data.userName)}, your pixel for <strong>${escapeHtml(data.domain)}</strong> is active and tracking visitors in real time.
      </p>

      <div style="background:${BRAND.backgroundMuted};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">What your pixel does</p>
        <table style="width:100%;border-collapse:collapse;">
          ${[
            ['🔍', 'Identifies anonymous visitors to your website', 'Turns traffic into named, enriched leads'],
            ['📊', 'Scores every visitor by intent', 'Prioritizes who to reach out to first'],
            ['🎯', 'Matches visitors to 280M+ profiles', 'Email, phone, company, LinkedIn — ready to use'],
          ].map(([icon, title, desc]) => `
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;font-size:18px;">${icon}</td>
              <td style="padding:8px 0 8px 8px;vertical-align:top;">
                <div style="font-weight:600;color:${BRAND.text};font-size:14px;">${title}</div>
                <div style="color:${BRAND.textMuted};font-size:13px;">${desc}</div>
              </td>
            </tr>`).join('')}
        </table>
      </div>

      ${ctaButton('View Your Pixel Dashboard', `${URLS.base}/settings/pixel`)}

      ${divider()}

      <p style="color:${BRAND.textMuted};font-size:13px;text-align:center;margin-bottom:8px;">
        <strong style="color:${BRAND.warning};">⏱ Trial ends in 14 days.</strong> We'll email you visitor reports every few days.
      </p>
      <p style="color:${BRAND.textMuted};font-size:13px;text-align:center;">
        After 14 days, upgrade to Pro to keep your pixel running forever and unlock lookalike audiences + outbound campaigns.
      </p>
    `,
  })
  return { subject, html, text: `Your SuperPixel is live on ${data.domain}. Your 14-day trial has started. View your dashboard at ${URLS.base}/settings/pixel` }
}

// ============================================
// DAY 3 — First Visitor Report
// ============================================

export function pixelTrialDay3Email(data: PixelTrialEmailData) {
  const hasVisitors = (data.identifiedCount ?? 0) > 0
  const subject = hasVisitors
    ? `👀 ${data.identifiedCount} visitors identified on ${data.domain}`
    : `Is your pixel installed? Quick 2-min check`

  const html = emailLayout({
    preheader: hasVisitors
      ? `Real people visited your site. Here's who we found.`
      : `We haven't seen any visitors yet — let's make sure your pixel is firing.`,
    content: hasVisitors ? `
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">Your first visitors are in 🎯</h2>
      <p style="margin:0 0 24px;color:${BRAND.textSecondary};font-size:15px;">
        Hi ${escapeHtml(data.userName)}, here's a snapshot of who visited <strong>${escapeHtml(data.domain)}</strong> in the last 3 days.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          ${statBlock(data.visitorCount ?? 0, 'Total Visitors')}
          ${statBlock(data.identifiedCount ?? 0, 'Identified', BRAND.success)}
          ${statBlock(`${Math.round(((data.identifiedCount ?? 0) / Math.max(data.visitorCount ?? 1, 1)) * 100)}%`, 'Match Rate', BRAND.primary)}
        </tr>
      </table>

      ${data.topVisitors?.length ? `
        <p style="font-size:13px;font-weight:600;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Recently Identified</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${data.topVisitors.slice(0, 3).map(visitorRow).join('')}
        </table>
      ` : ''}

      ${ctaButton('View All Visitors', `${URLS.base}/analytics`)}

      ${divider()}
      <p style="color:${BRAND.textMuted};font-size:13px;text-align:center;">
        ${urgencyBadge('11 days left in trial', BRAND.warning)} Upgrade to Pro to keep these leads flowing.
      </p>
    ` : `
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">Quick check-in on your pixel 🔍</h2>
      <p style="margin:0 0 24px;color:${BRAND.textSecondary};font-size:15px;">
        Hi ${escapeHtml(data.userName)}, we haven't detected any visitors on <strong>${escapeHtml(data.domain)}</strong> yet. Let's make sure your pixel is firing correctly.
      </p>

      <div style="background:${BRAND.warningBg};border:1px solid ${BRAND.warningBorder};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-weight:600;color:${BRAND.text};">Common install issues:</p>
        <ul style="margin:0;padding-left:20px;color:${BRAND.textSecondary};font-size:14px;line-height:1.8;">
          <li>Pixel snippet not added to <code>&lt;head&gt;</code> on all pages</li>
          <li>Script blockers or browser extensions interfering</li>
          <li>Caching layer serving old HTML without the pixel</li>
        </ul>
      </div>

      ${ctaButton('Get Install Instructions', `${URLS.base}/settings/pixel`)}
    `,
  })
  return { subject, html, text: subject }
}

// ============================================
// DAY 7 — Mid-Trial Results + Tease
// ============================================

export function pixelTrialDay7Email(data: PixelTrialEmailData) {
  const subject = `📈 Week 1 recap: ${data.identifiedCount ?? 0} leads from your pixel`
  const html = emailLayout({
    preheader: `Here's what your SuperPixel found in its first week — and a preview of what Pro unlocks.`,
    content: `
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">Your pixel's first week ⚡</h2>
      <p style="margin:0 0 24px;color:${BRAND.textSecondary};font-size:15px;">
        Hi ${escapeHtml(data.userName)}, here's your mid-trial summary for <strong>${escapeHtml(data.domain)}</strong>.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          ${statBlock(data.visitorCount ?? 0, 'Visitors Tracked')}
          ${statBlock(data.identifiedCount ?? 0, 'Leads Found', BRAND.success)}
          ${statBlock(`$${Math.round((data.identifiedCount ?? 0) * 47)}`, 'Est. Lead Value', BRAND.primary)}
        </tr>
      </table>

      ${divider()}

      <p style="font-size:15px;font-weight:700;color:${BRAND.text};margin:0 0 16px;">What Pro unlocks after your trial 🚀</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${[
          ['♾️', 'Pixel stays on forever', 'Never miss another visitor after 14 days'],
          ['🎯', 'Lookalike audiences', 'Build lists of people just like your best visitors and target them with ads'],
          ['📧', 'Outbound campaigns on autopilot', 'We reach out to identified visitors on your behalf — you just close'],
          ['🔁', 'Daily enrichment runs', '1,000 enrichments/day to fill in missing lead data'],
        ].map(([icon, title, desc]) => `
          <tr>
            <td style="padding:10px 0;vertical-align:top;width:28px;font-size:18px;">${icon}</td>
            <td style="padding:10px 0 10px 8px;vertical-align:top;">
              <div style="font-weight:600;color:${BRAND.text};font-size:14px;">${title}</div>
              <div style="color:${BRAND.textMuted};font-size:13px;">${desc}</div>
            </td>
          </tr>`).join('')}
      </table>

      ${ctaButton('Upgrade to Pro — Keep Your Pixel', `${URLS.base}/settings/billing`)}
      ${secondaryButton('View Your Leads', `${URLS.base}/analytics`)}

      ${divider()}
      <p style="color:${BRAND.textMuted};font-size:13px;text-align:center;">
        ${urgencyBadge(`${data.daysLeft ?? 7} days left in trial`, BRAND.warning)}
      </p>
    `,
  })
  return { subject, html, text: subject }
}

// ============================================
// DAY 10 — Urgency Warning
// ============================================

export function pixelTrialDay10Email(data: PixelTrialEmailData) {
  const subject = `⚠️ 4 days left — your pixel goes dark soon`
  const html = emailLayout({
    preheader: `Your SuperPixel trial ends in 4 days. Don't lose the leads you've built up.`,
    content: `
      <div style="text-align:center;margin-bottom:28px;">
        ${urgencyBadge('⚠️  4 DAYS LEFT', BRAND.warning)}
      </div>

      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};text-align:center;">Your pixel goes dark in 4 days</h2>
      <p style="margin:0 0 28px;color:${BRAND.textSecondary};font-size:15px;text-align:center;">
        After ${data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'your trial ends'}, your pixel on <strong>${escapeHtml(data.domain)}</strong> will stop identifying visitors.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          ${statBlock(data.identifiedCount ?? 0, 'Leads Found So Far', BRAND.success)}
          ${statBlock(`$${Math.round((data.identifiedCount ?? 0) * 47)}`, 'Value Generated', BRAND.primary)}
        </tr>
      </table>

      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0;font-weight:600;color:#991b1b;font-size:15px;">If you don't upgrade:</p>
        <ul style="margin:8px 0 0;padding-left:20px;color:#b91c1c;font-size:14px;line-height:1.8;">
          <li>Your pixel stops firing on ${data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'trial end'}</li>
          <li>New visitors go unidentified — forever</li>
          <li>You lose the competitive edge you built this week</li>
        </ul>
      </div>

      ${ctaButton('Upgrade Now — Keep Your Pixel', `${URLS.base}/settings/billing`)}

      ${divider()}
      <p style="color:${BRAND.textMuted};font-size:13px;text-align:center;">
        Pro starts at just a fraction of what one qualified lead is worth. The math is easy.
      </p>
    `,
  })
  return { subject, html, text: subject }
}

// ============================================
// DAY 13 — Last Chance
// ============================================

export function pixelTrialDay13Email(data: PixelTrialEmailData) {
  const subject = `🚨 Last chance — pixel goes dark tomorrow`
  const html = emailLayout({
    preheader: `Your 14-day SuperPixel trial ends tomorrow. One-click upgrade to keep it running forever.`,
    content: `
      <div style="text-align:center;margin-bottom:28px;">
        ${urgencyBadge('🚨  TOMORROW IS THE LAST DAY', '#ef4444')}
      </div>

      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};text-align:center;">Your pixel goes dark tomorrow</h2>
      <p style="margin:0 0 28px;color:${BRAND.textSecondary};font-size:15px;text-align:center;">
        This is your last chance to upgrade before your pixel on <strong>${escapeHtml(data.domain)}</strong> stops working.
      </p>

      <div style="background:${BRAND.backgroundMuted};border:2px solid ${BRAND.primary};border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">What you've built in 13 days</p>
        <p style="margin:0;font-size:36px;font-weight:700;color:${BRAND.primary};">${data.identifiedCount ?? 0} leads</p>
        <p style="margin:4px 0 0;font-size:13px;color:${BRAND.textMuted};">identified from anonymous website traffic</p>
      </div>

      <p style="font-size:15px;color:${BRAND.textSecondary};margin:0 0 24px;">
        Every day without a pixel is traffic you'll never get back. One of those visitors could be your next best customer.
      </p>

      ${ctaButton('Upgrade to Pro — Keep My Pixel', `${URLS.base}/settings/billing`)}

      ${divider()}

      <p style="font-size:14px;font-weight:600;color:${BRAND.text};margin:0 0 12px;">What else Pro unlocks:</p>
      <p style="font-size:14px;color:${BRAND.textSecondary};line-height:1.7;margin:0;">
        🎯 <strong>Lookalike audiences</strong> — build ad audiences that mirror your best visitors<br>
        📧 <strong>Outbound on autopilot</strong> — we run campaigns to identified visitors for you<br>
        🔁 <strong>1,000 enrichments/day</strong> — fill in missing data on every new lead<br>
        ♾️ <strong>Pixel runs forever</strong> — no more trial limits, ever
      </p>
    `,
  })
  return { subject, html, text: subject }
}

// ============================================
// DAY 14 — Trial Expired
// ============================================

export function pixelTrialExpiredEmail(data: PixelTrialEmailData) {
  const subject = `Your pixel trial ended — here's what you found (and what you're missing)`
  const html = emailLayout({
    preheader: `Your 14-day trial is over. Upgrade to reactivate your pixel and keep identifying visitors.`,
    content: `
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">Your trial has ended 🔒</h2>
      <p style="margin:0 0 24px;color:${BRAND.textSecondary};font-size:15px;">
        Hi ${escapeHtml(data.userName)}, your SuperPixel trial on <strong>${escapeHtml(data.domain)}</strong> has ended. Your pixel is now paused.
      </p>

      <div style="background:${BRAND.backgroundMuted};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Your 14-day results</p>
        <table style="width:100%;">
          <tr>
            ${statBlock(data.visitorCount ?? 0, 'Visitors Tracked')}
            ${statBlock(data.identifiedCount ?? 0, 'Leads Identified', BRAND.success)}
            ${statBlock(`$${Math.round((data.identifiedCount ?? 0) * 47)}`, 'Est. Lead Value', BRAND.primary)}
          </tr>
        </table>
      </div>

      ${data.topVisitors?.length ? `
        <p style="font-size:13px;font-weight:600;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Your last identified visitors</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${data.topVisitors.slice(0, 3).map(visitorRow).join('')}
        </table>
        <p style="font-size:13px;color:${BRAND.textMuted};margin:0 0 24px;">
          These are the last leads your pixel found before it went dark. Reactivate now to keep seeing visitors like these.
        </p>
      ` : ''}

      ${ctaButton('Reactivate My Pixel — Upgrade to Pro', `${URLS.base}/settings/billing`)}

      ${divider()}

      <p style="font-size:14px;color:${BRAND.textSecondary};line-height:1.7;margin:0 0 16px;">
        <strong>Why one qualified lead justifies the entire plan:</strong> The average B2B lead is worth $150–$500+. Your pixel identified ${data.identifiedCount ?? 0} potential buyers. Even one closed deal pays for months of Pro.
      </p>

      <p style="font-size:13px;color:${BRAND.textMuted};text-align:center;">
        Questions? Reply to this email — we're here to help.
      </p>
    `,
  })
  return { subject, html, text: subject }
}

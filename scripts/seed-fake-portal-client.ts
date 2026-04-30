// Seed Fake Portal Client
//
// Creates a fully-onboarded Cursor onboarding client so we can preview the
// portal UI and the post-approval flow end-to-end without polluting
// EmailBison. The client is flagged is_test_client=true so the EmailBison
// push runs in dry-run mode (synthesized campaign IDs, no real API calls).
//
// Usage:
//   pnpm seed:portal                            # uses adamwolfe100@gmail.com
//   pnpm seed:portal -- --email=you@x.com       # use a different account
//   pnpm seed:portal -- --reset                 # delete prior test client first
//
// After running, log into /portal as the chosen email to see the dashboard.
// On the admin side, visit /admin/onboarding to see the new "Cursor (TEST)"
// row, open it, pick a workspace, and click Approve All.

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function getArg(flag: string): string | undefined {
  const prefix = `--${flag}=`
  const found = process.argv.find((a) => a.startsWith(prefix))
  return found?.slice(prefix.length)
}

const email = getArg('email') ?? 'adamwolfe100@gmail.com'
const reset = process.argv.includes('--reset')
const TEST_TAG = 'CURSOR (TEST PORTAL CLIENT)'

// ---------------------------------------------------------------------------
// Cursor-themed draft sequences (matches DraftSequences shape)
// ---------------------------------------------------------------------------

const draftSequences = {
  sequences: [
    {
      sequence_name: 'AI-Native Dev Velocity',
      strategy:
        'Lead with concrete velocity gain (PRs shipped, time-to-merge) for engineering leaders at AI-forward companies. Anchor on a real metric, not a generic productivity claim.',
      angle: {
        category: 'Velocity / Throughput',
        core_insight:
          'Engineering leaders are measured on shipped output, not lines of code, and AI-native IDEs are now the dominant lever for that metric.',
        emotional_driver:
          'Pressure to outpace competitors who already adopted AI tooling.',
      },
      emails: [
        {
          step: 1,
          delay_days: 0,
          subject_line: '{{Quick|Fast}} {{question|q}} on {{your team|engineering}} velocity',
          preview_text: 'A 3-line note about how your engineers are shipping faster',
          purpose: 'Open the loop with a sharp, role-relevant question.',
          word_count: 78,
          why_it_works:
            'Short subject, role-anchored question, concrete proof point. Asks a yes/no instead of pitching.',
          spintax_test_notes: 'Testing Quick vs Fast in subject for open-rate signal.',
          body: `Hey {{first_name}},

I noticed {{company}} is {{shipping fast|moving quickly}} — saw the recent {{launch|release}} on the changelog.

Quick question: are your engineers using Cursor (or another AI-native IDE) yet, or is the team still on VS Code + Copilot?

Reason I ask: teams that switch are seeing 30-50% faster time-to-merge on non-trivial PRs. Happy to share the data if useful.

— {{sender_name}}`,
        },
        {
          step: 2,
          delay_days: 3,
          subject_line: 'Re: {{your team|engineering}} velocity',
          preview_text: 'One concrete number you can share with your CTO',
          purpose: 'Add proof and lower the ask.',
          word_count: 92,
          why_it_works:
            'Specific number from a comparable company; ends with a low-friction ask (a 1-pager, not a meeting).',
          spintax_test_notes: 'Testing reply-thread style subject vs new subject.',
          body: `Bumping this up — wanted to share one number.

{{Vercel|Linear}}'s eng team measured a 41% drop in time-to-PR after rolling Cursor out org-wide. The bigger surprise: senior engineers used it more than juniors, because the {{agent loop|composer}} handles the multi-file refactors they used to dread.

Want me to send the 1-pager? No call needed.

— {{sender_name}}`,
        },
        {
          step: 3,
          delay_days: 5,
          subject_line: 'Last note from me',
          preview_text: 'Closing the loop — happy to circle back next quarter',
          purpose: 'Permission-to-close. Surfaces the offer one more time without pressure.',
          word_count: 64,
          why_it_works:
            'Polite close beats a fourth pitch. Often pulls a reply from prospects who were just busy.',
          spintax_test_notes: 'No spintax in subject for this step — clean closer.',
          body: `Last one from me, {{first_name}} — I know the inbox is full.

If AI-native dev tooling isn't a 2026 priority, no worries, I'll close this out. If it is and timing's just off, just reply "Q2" and I'll {{circle back then|reach out then}}.

— {{sender_name}}`,
        },
      ],
    },
    {
      sequence_name: 'Hiring Cost Substitution',
      strategy:
        'Reframe Cursor as a cheaper alternative to a marginal hire. Targets VPs of Eng and CTOs who own headcount budgets in 2026 belt-tightening cycles.',
      angle: {
        category: 'Cost / Budget',
        core_insight:
          'A $20/seat/month tool that adds 30% capacity is mathematically equivalent to hiring at a 100x discount.',
        emotional_driver:
          'Pressure to do more with the headcount they already have.',
      },
      emails: [
        {
          step: 1,
          delay_days: 0,
          subject_line: '{{1 senior eng|0.3 of a senior eng}} for {{$240/yr|the price of lunch}}',
          preview_text: 'The math on AI-native IDEs vs. a marginal hire',
          purpose: 'Frame the offer as a budget calculation, not a software pitch.',
          word_count: 88,
          why_it_works:
            'Subject is a hook (number). Body does the math in two lines. Anchors against headcount, not other tools.',
          spintax_test_notes: 'Testing two cost framings — one absolute, one relative.',
          body: `{{first_name}},

Quick math for your 2026 plan:

A 20-engineer team running Cursor at $20/seat/mo = $4,800/yr. Teams measure ~30% more PRs shipped after rollout. That's the equivalent of {{6 extra engineers|adding a senior IC}} for the cost of one lunch.

Worth a 15-min look at how {{Notion|Ramp}} structured their rollout?

— {{sender_name}}`,
        },
        {
          step: 2,
          delay_days: 4,
          subject_line: 'Forwarded: how {{Notion|Ramp}} rolled out Cursor',
          preview_text: 'Their internal playbook (with permission)',
          purpose: 'Provide value asset; lower the ask to a forward, not a meeting.',
          word_count: 85,
          why_it_works:
            'Curiosity-gap subject + one specific deliverable. No call ask.',
          spintax_test_notes: 'Subject implies social proof from a peer company.',
          body: `Followed up on the math above — figured the playbook would land better than another pitch.

{{Notion|Ramp}}'s eng leadership wrote up how they rolled Cursor out to 80+ engineers without disrupting the existing review process. {{Spoiler|TL;DR}}: they piloted with one squad first and let velocity numbers do the selling internally.

Want me to send it? Just say "yes."

— {{sender_name}}`,
        },
        {
          step: 3,
          delay_days: 6,
          subject_line: 'Closing this out',
          preview_text: 'No pitch — just a clean exit',
          purpose: 'Permission-to-close.',
          word_count: 55,
          why_it_works:
            'Releases pressure. Often pulls "yes send it" from people who genuinely meant to reply.',
          spintax_test_notes: 'No spintax in this step.',
          body: `Closing the loop, {{first_name}}.

If Cursor isn't on your 2026 short-list, all good — I'll stop the bumps. If it is, reply with anything and I'll send the playbook over.

— {{sender_name}}`,
        },
      ],
    },
  ],
  global_notes: {
    tone: 'Direct, low-effort, peer-to-peer. No salesy hedging.',
    cta_strategy:
      'No meeting asks until step 4+. Asks are: "want the data?" "send the playbook?" — frictionless.',
    fallback_behavior:
      'If no reply by step 3, permission-to-close. Never a 4th pitch in this preview.',
  },
  quality_check: {
    passed: true,
    issues: [],
  },
  angle_selection: {
    chosen_angles: ['Velocity / Throughput', 'Cost / Budget'],
    rationale:
      'Two distinct emotional drivers (pressure vs budget) covering both engineering and finance buyer perspectives.',
  },
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nSeeding fake portal client for: ${email}`)
  console.log(`Reset mode: ${reset ? 'YES (will delete prior test rows for this email)' : 'no'}`)

  if (reset) {
    const { error: deleteError } = await supabase
      .from('onboarding_clients')
      .delete()
      .eq('primary_contact_email', email)
      .eq('is_test_client', true)

    if (deleteError) {
      console.error('Failed to delete prior test rows:', deleteError.message)
      process.exit(1)
    }
    console.log('  Removed prior test rows for this email')
  }

  const insert = {
    status: 'setup' as const,
    company_name: 'Cursor (TEST)',
    company_website: 'https://cursor.com',
    industry: 'Developer Tools / AI',
    primary_contact_name: 'Test Contact',
    primary_contact_email: email,
    primary_contact_phone: '+1-555-0100',
    communication_channel: 'email',
    referral_source: 'inbound',

    packages_selected: ['outbound'],

    // Commercial — pretend everything is signed and paid
    setup_fee: 5000,
    recurring_fee: 4500,
    billing_cadence: 'monthly',
    outbound_tier: 'standard',
    payment_method: 'stripe',
    invoice_email: email,
    domain_cost_acknowledged: true,
    audience_cost_acknowledged: true,
    pixel_cost_acknowledged: true,
    additional_audience_noted: false,

    // ICP intake
    icp_description:
      'VP of Engineering, CTOs, Heads of Platform at Series B-D companies (50-500 engineers) shipping software daily.',
    target_industries: ['SaaS', 'Developer Tools', 'AI/ML', 'Fintech'],
    target_company_sizes: ['51-200', '201-500', '501-1000'],
    target_titles: ['VP of Engineering', 'CTO', 'Head of Platform', 'Director of Engineering'],
    target_geography: ['United States', 'Canada', 'United Kingdom'],
    pain_points:
      'Pressure to outship competitors with same headcount; AI tooling adoption decisions; engineering velocity measurement.',
    intent_keywords: ['Cursor', 'AI IDE', 'Copilot alternative', 'engineering velocity'],

    // Outbound setup
    sending_volume: 'medium',
    lead_volume: '5000',
    start_timeline: 'immediate',
    sender_names: 'Alex Chen, Jordan Park',
    domain_variations: 'try-cursor.com, hello-cursor.io',
    domain_provider: 'Cloudflare',
    copy_tone: 'Direct, peer-to-peer, no salesy hedging',
    primary_cta: 'reply-only',
    calendar_link: 'https://cal.com/cursor-test',
    reply_routing_email: email,
    backup_reply_email: email,

    // Content approvals
    copy_approval: true,
    sender_identity_approval: true,

    // Legal — fully signed
    sow_signed: true,
    payment_confirmed: true,
    data_usage_ack: true,
    privacy_ack: true,
    billing_terms_ack: true,
    signature_name: 'Test Contact',
    signature_date: new Date().toISOString().slice(0, 10),
    additional_notes: TEST_TAG,

    intake_source: 'internal_intake' as const,

    // Pipeline status — copy is generated and waiting on review
    enrichment_status: 'complete' as const,
    copy_generation_status: 'complete' as const,
    copy_approval_status: 'pending' as const,
    draft_sequences: draftSequences,

    // Notifications already "sent"
    slack_notification_sent: true,
    confirmation_email_sent: true,
    onboarding_complete: true,
    crm_sync_status: 'synced' as const,

    // Test flag — push runs as dry-run
    is_test_client: true,
    assigned_workspace_id: null,
    campaign_deployed: false,
    emailbison_campaign_ids: [],
  }

  const { data, error } = await supabase
    .from('onboarding_clients')
    .insert(insert)
    .select('id, company_name, primary_contact_email')
    .single()

  if (error) {
    console.error('\nInsert failed:', error.message)
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.error('\nThe migration for is_test_client / assigned_workspace_id has not run yet.')
      console.error('Apply: supabase/migrations/20260428000000_onboarding_workspace_assignment.sql')
    }
    process.exit(1)
  }

  console.log('\nCreated test client:')
  console.log('  id:    ', data.id)
  console.log('  name:  ', data.company_name)
  console.log('  email: ', data.primary_contact_email)
  console.log('\nNext steps:')
  console.log('  1. Open /admin/onboarding — find "Cursor (TEST)" in the kanban')
  console.log(`  2. Open /admin/onboarding/${data.id}`)
  console.log('  3. Pick a workspace from the new picker above the Approve buttons')
  console.log('  4. Click "Approve All" — push will run in dry-run mode (no real EB calls)')
  console.log(`  5. Sign in as ${email} and visit /portal to see the client view`)
  console.log('\nTo remove this test client later:')
  console.log(`  pnpm seed:portal -- --email=${email} --reset`)
  console.log('  (then re-run without --reset to recreate, or skip the second step)')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

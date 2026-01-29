// Seed Test Users, Partners, and Credits
// Creates complete test environment for E2E testing

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test workspaces from seed-leads.ts
const WORKSPACES = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'healthcare',
    name: 'Healthcare/Med Spas Marketplace',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'hvac',
    name: 'Home Services/HVAC Marketplace',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    slug: 'door-to-door',
    name: 'Door-to-Door Sales Platform',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    slug: 'solar',
    name: 'Solar & Renewable Energy',
  },
]

// Test users for each workspace
const TEST_USERS = [
  {
    email: 'buyer@healthcare.com',
    password: 'TestPass123!',
    workspaceId: '00000000-0000-0000-0000-000000000001',
    fullName: 'Healthcare Buyer',
    role: 'owner',
    isPartner: false,
  },
  {
    email: 'partner@healthcare.com',
    password: 'TestPass123!',
    workspaceId: '00000000-0000-0000-0000-000000000001',
    fullName: 'Healthcare Partner',
    role: 'member',
    isPartner: true,
  },
  {
    email: 'buyer@hvac.com',
    password: 'TestPass123!',
    workspaceId: '00000000-0000-0000-0000-000000000002',
    fullName: 'HVAC Buyer',
    role: 'owner',
    isPartner: false,
  },
  {
    email: 'partner@hvac.com',
    password: 'TestPass123!',
    workspaceId: '00000000-0000-0000-0000-000000000002',
    fullName: 'HVAC Partner',
    role: 'member',
    isPartner: true,
  },
  {
    email: 'buyer@d2d.com',
    password: 'TestPass123!',
    workspaceId: '00000000-0000-0000-0000-000000000003',
    fullName: 'D2D Buyer',
    role: 'owner',
    isPartner: false,
  },
  {
    email: 'partner@solar.com',
    password: 'TestPass123!',
    workspaceId: '00000000-0000-0000-0000-000000000004',
    fullName: 'Solar Partner',
    role: 'member',
    isPartner: true,
  },
]

async function seedTestData() {
  console.log('🌱 Seeding test users, partners, and credits...\n')

  // Step 1: Create test auth users and database users
  console.log('👥 Creating test users...')
  const createdUsers: Array<{ email: string; authId: string; userId: string }> = []

  for (const testUser of TEST_USERS) {
    try {
      // Check if auth user already exists
      const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
      const existingAuth = existingAuthUsers?.users?.find((u) => u.email === testUser.email)

      let authUserId: string

      if (existingAuth) {
        console.log(`   ⚠️  Auth user ${testUser.email} already exists, using existing`)
        authUserId = existingAuth.id

        // Delete old database user record if exists
        await supabase.from('users').delete().eq('auth_user_id', authUserId)
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
        })

        if (authError) {
          console.error(`   ❌ Failed to create auth user ${testUser.email}:`, authError)
          continue
        }

        authUserId = authData.user!.id
        console.log(`   ✅ Created auth user: ${testUser.email}`)
      }

      // Create database user record
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          workspace_id: testUser.workspaceId,
          email: testUser.email,
          full_name: testUser.fullName,
          role: testUser.role,
          plan: 'pro',
          daily_credit_limit: 1000,
          daily_credits_used: 0,
        })
        .select('id')
        .single()

      if (dbError) {
        console.error(`   ❌ Failed to create db user ${testUser.email}:`, dbError)
        continue
      }

      console.log(`   ✅ Created database user: ${testUser.email} (${testUser.role})`)

      createdUsers.push({
        email: testUser.email,
        authId: authUserId,
        userId: dbUser.id,
      })
    } catch (error) {
      console.error(`   ❌ Error creating user ${testUser.email}:`, error)
    }
  }

  console.log(`\n✅ Created ${createdUsers.length}/${TEST_USERS.length} users`)

  // Step 2: Create partner records for partner users
  console.log('\n🤝 Creating partner records...')
  const createdPartners: Array<{ email: string; partnerId: string }> = []

  for (const testUser of TEST_USERS.filter((u) => u.isPartner)) {
    const user = createdUsers.find((u) => u.email === testUser.email)
    if (!user) {
      console.log(`   ⚠️  Skipping partner for ${testUser.email} (user not created)`)
      continue
    }

    try {
      // Check if partner already exists
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('email', testUser.email)
        .single()

      let partnerId: string

      if (existingPartner) {
        partnerId = existingPartner.id
        console.log(`   ⚠️  Partner ${testUser.email} already exists`)
      } else {
        // Create partner record
        const { data: partner, error: partnerError } = await supabase
          .from('partners')
          .insert({
            name: testUser.fullName,
            company_name: `${testUser.fullName}'s Company`,
            email: testUser.email,
            status: 'active',
            partner_tier: 'standard',
            partner_score: 75,
            base_commission_rate: 0.3,
            bonus_commission_rate: 0.0,
            verification_pass_rate: 0.95,
            duplicate_rate: 0.05,
            total_leads_uploaded: 0,
            total_leads_sold: 0,
            total_earnings: 0,
            payout_rate: 0.30,
            is_active: true,
          })
          .select('id')
          .single()

        if (partnerError) {
          console.error(`   ❌ Failed to create partner ${testUser.email}:`, partnerError)
          continue
        }

        partnerId = partner.id
        console.log(`   ✅ Created partner: ${testUser.email}`)
      }

      // Link user to partner
      const { error: linkError } = await supabase
        .from('users')
        .update({ linked_partner_id: partnerId })
        .eq('id', user.userId)

      if (linkError) {
        console.error(`   ❌ Failed to link user to partner:`, linkError)
      } else {
        console.log(`   ✅ Linked user ${testUser.email} to partner`)
      }

      createdPartners.push({ email: testUser.email, partnerId })
    } catch (error) {
      console.error(`   ❌ Error creating partner for ${testUser.email}:`, error)
    }
  }

  console.log(`\n✅ Created ${createdPartners.length} partner records`)

  // Step 3: Add initial credits to buyer workspaces
  console.log('\n💰 Adding initial credits to workspaces...')

  for (const workspace of WORKSPACES) {
    try {
      // Check if credits already exist
      const { data: existingCredits } = await supabase
        .from('workspace_credits')
        .select('id, balance')
        .eq('workspace_id', workspace.id)
        .single()

      if (existingCredits) {
        console.log(
          `   ⚠️  Credits for ${workspace.slug} already exist (balance: $${existingCredits.balance})`
        )
        continue
      }

      // Create credits record with 50000 cents ($500) initial balance
      const { error: creditsError } = await supabase.from('workspace_credits').insert({
        workspace_id: workspace.id,
        balance: 50000,
        total_purchased: 50000,
        total_used: 0,
        total_earned: 0,
      })

      if (creditsError) {
        console.error(`   ❌ Failed to create credits for ${workspace.slug}:`, creditsError)
        continue
      }

      console.log(`   ✅ Added $500 credits to ${workspace.slug}`)
    } catch (error) {
      console.error(`   ❌ Error creating credits for ${workspace.slug}:`, error)
    }
  }

  // Step 4: Summary
  console.log('\n📊 Summary:')
  console.log(`   Test Users: ${createdUsers.length}`)
  console.log(`   Partners: ${createdPartners.length}`)
  console.log(`   Workspaces with Credits: ${WORKSPACES.length}`)

  console.log('\n🔑 Test Credentials:')
  console.log('   Buyers:')
  TEST_USERS.filter((u) => !u.isPartner).forEach((u) => {
    console.log(`     - ${u.email} / ${u.password}`)
  })
  console.log('   Partners:')
  TEST_USERS.filter((u) => u.isPartner).forEach((u) => {
    console.log(`     - ${u.email} / ${u.password}`)
  })

  console.log('\n🎉 Test data seeded successfully!')
}

seedTestData().catch(console.error)

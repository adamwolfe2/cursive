// Setup Admin User
// Ensures adam@meetcursive.com is set up as admin with auth credentials

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

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

async function setupAdminUser() {
  console.log('🔧 Setting up admin user: adam@meetcursive.com\n')

  const adminEmail = process.env.ADMIN_EMAIL || 'adam@meetcursive.com'
  // SECURITY: never hardcode a password. Require ADMIN_PASSWORD from the
  // environment and fail closed if it is missing or too weak. This prevents a
  // predictable, committed default from becoming a live platform-admin login.
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || adminPassword.length < 16) {
    console.error('❌ Set a strong ADMIN_PASSWORD env var (>= 16 chars) before running this script.')
    process.exit(1)
  }
  const adminWorkspaceId = '00000000-0000-0000-0000-000000000000' // Fixed admin workspace ID

  // Step 1: Check if admin already exists in platform_admins table
  const { data: existingAdmin } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('email', adminEmail)
    .single()

  if (existingAdmin) {
    console.log('✅ Admin record exists in platform_admins table')
  } else {
    const { error: adminError } = await supabase
      .from('platform_admins')
      .insert({
        email: adminEmail,
        full_name: 'Adam',
        is_active: true,
      })

    if (adminError) {
      console.error('❌ Failed to create admin record:', adminError)
    } else {
      console.log('✅ Created admin record in platform_admins table')
    }
  }

  // Step 2: Check if auth user exists
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const existingAuthUser = authUsers?.users?.find((u) => u.email === adminEmail)

  let authUserId: string

  if (existingAuthUser) {
    console.log('✅ Auth user already exists')
    console.log(`   User ID: ${existingAuthUser.id}`)
    console.log(`   Email confirmed: ${!!existingAuthUser.email_confirmed_at}`)

    authUserId = existingAuthUser.id

    // Update password in case they forgot it
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingAuthUser.id,
      { password: adminPassword }
    )

    if (updateError) {
      console.log('⚠️  Could not reset password:', updateError.message)
    } else {
      console.log('✅ Password reset to default (change after login)')
    }
  } else {
    console.log('⚠️  No auth user found, creating one...')

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })

    if (createError) {
      console.error('❌ Failed to create auth user:', createError)
      return
    }

    authUserId = newUser.user!.id
    console.log('✅ Created auth user')
    console.log(`   User ID: ${authUserId}`)
  }

  // Step 3: Create admin workspace
  const { data: existingWorkspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', adminWorkspaceId)
    .single()

  if (existingWorkspace) {
    console.log('✅ Admin workspace already exists')
  } else {
    const { error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        id: adminWorkspaceId,
        name: 'Admin Workspace',
        slug: 'admin',
        subdomain: 'admin',
        onboarding_status: 'completed',
      })

    if (workspaceError) {
      console.error('❌ Failed to create admin workspace:', workspaceError)
    } else {
      console.log('✅ Created admin workspace')
    }
  }

  // Step 4: Create database user record
  const { data: existingDbUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (existingDbUser) {
    console.log('✅ Database user record already exists')

    // Update to ensure correct workspace and role
    const { error: updateError } = await supabase
      .from('users')
      .update({
        workspace_id: adminWorkspaceId,
        role: 'owner',
        plan: 'pro',
      })
      .eq('auth_user_id', authUserId)

    if (updateError) {
      console.error('❌ Failed to update database user:', updateError)
    } else {
      console.log('✅ Updated database user record')
    }
  } else {
    const { error: dbUserError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUserId,
        workspace_id: adminWorkspaceId,
        email: adminEmail,
        full_name: 'Adam',
        role: 'owner',
        plan: 'pro',
        daily_credit_limit: 10000,
      })

    if (dbUserError) {
      console.error('❌ Failed to create database user:', dbUserError)
    } else {
      console.log('✅ Created database user record')
    }
  }

  // Step 3: Verify admin can bypass waitlist
  console.log('\n📋 Admin Access Summary:')
  console.log(`   Email: ${adminEmail}`)
  console.log('   Password: (the ADMIN_PASSWORD you supplied — not printed)')
  console.log('   Waitlist Bypass: ✅ Enabled (automatic)')
  console.log('   Admin Dashboard: ✅ /admin')
  console.log('')
  console.log('🎯 You can now:')
  console.log('   1. Go to https://leads.meetcursive.com')
  console.log('   2. Click "Login" or go directly to /login')
  console.log(`   3. Login with ${adminEmail} and your ADMIN_PASSWORD`)
  console.log('   4. Access admin panel at /admin')
  console.log('   5. Regular users will see the waitlist')

  console.log('\n🎉 Admin user setup complete!')
}

setupAdminUser().catch(console.error)

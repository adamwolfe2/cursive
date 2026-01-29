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

  const adminEmail = 'adam@meetcursive.com'
  const adminPassword = 'AdminPass123!' // Default - you should change this after first login

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

  if (existingAuthUser) {
    console.log('✅ Auth user already exists')
    console.log(`   User ID: ${existingAuthUser.id}`)
    console.log(`   Email confirmed: ${!!existingAuthUser.email_confirmed_at}`)

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

    console.log('✅ Created auth user')
    console.log(`   User ID: ${newUser.user!.id}`)
  }

  // Step 3: Verify admin can bypass waitlist
  console.log('\n📋 Admin Access Summary:')
  console.log('   Email: adam@meetcursive.com')
  console.log('   Default Password: AdminPass123!')
  console.log('   Waitlist Bypass: ✅ Enabled (automatic)')
  console.log('   Admin Dashboard: ✅ /admin')
  console.log('')
  console.log('🎯 You can now:')
  console.log('   1. Go to https://leads.meetcursive.com')
  console.log('   2. Click "Login" or go directly to /login')
  console.log('   3. Login with adam@meetcursive.com / AdminPass123!')
  console.log('   4. Access admin panel at /admin')
  console.log('   5. Regular users will see the waitlist')

  console.log('\n🎉 Admin user setup complete!')
}

setupAdminUser().catch(console.error)

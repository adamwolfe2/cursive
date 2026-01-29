/**
 * Create Admin Account
 * Creates adam@meetcursive.com with full owner access
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminAccount() {
  console.log('Creating admin account...')

  const adminEmail = 'adam@meetcursive.com'
  const adminPassword = 'Idie9epla!'
  const adminName = 'Adam Wolfe'

  try {
    // 1. Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === adminEmail)

    let authUserId: string

    if (existingUser) {
      console.log(`User ${adminEmail} already exists in auth`)
      authUserId = existingUser.id

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password: adminPassword,
      })
      if (updateError) {
        console.error('Failed to update password:', updateError)
        throw updateError
      }
      console.log('✅ Password updated')
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: adminName,
          name: adminName,
        },
      })

      if (authError || !authData.user) {
        console.error('Failed to create auth user:', authError)
        throw authError
      }

      authUserId = authData.user.id
      console.log('✅ Auth user created:', authUserId)
    }

    // 2. Check if workspace exists
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .eq('slug', 'admin')
      .single()

    let workspaceId: string

    if (existingWorkspace) {
      console.log(`Workspace 'admin' already exists:`, existingWorkspace.id)
      workspaceId = existingWorkspace.id
    } else {
      // Create admin workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: 'Admin Workspace',
          slug: 'admin',
          subdomain: 'admin',
          industry_vertical: 'Technology',
          allowed_industries: ['Technology', 'Software', 'Services'],
          allowed_regions: ['US'],
          onboarding_status: 'completed',
          routing_config: {
            enabled: true,
            industry_filter: [],
            geographic_filter: {
              countries: ['US'],
              states: [],
              regions: [],
            },
            lead_assignment_method: 'round_robin',
          },
        })
        .select()
        .single()

      if (workspaceError || !workspace) {
        console.error('Failed to create workspace:', workspaceError)
        throw workspaceError
      }

      workspaceId = workspace.id
      console.log('✅ Workspace created:', workspaceId)
    }

    // 3. Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id, role, plan')
      .eq('auth_user_id', authUserId)
      .single()

    if (existingProfile) {
      console.log('User profile already exists, updating...')

      // Update to ensure owner role and pro plan
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          workspace_id: workspaceId,
          email: adminEmail,
          full_name: adminName,
          role: 'owner',
          plan: 'pro',
          daily_credit_limit: 999999,
        })
        .eq('auth_user_id', authUserId)

      if (updateUserError) {
        console.error('Failed to update user profile:', updateUserError)
        throw updateUserError
      }
      console.log('✅ User profile updated')
    } else {
      // Create user profile
      const { error: userError } = await supabase.from('users').insert({
        auth_user_id: authUserId,
        workspace_id: workspaceId,
        email: adminEmail,
        full_name: adminName,
        role: 'owner',
        plan: 'pro',
        daily_credit_limit: 999999,
      })

      if (userError) {
        console.error('Failed to create user profile:', userError)
        throw userError
      }
      console.log('✅ User profile created')
    }

    // 4. Create platform admin entry
    const { error: adminError } = await supabase
      .from('platform_admins')
      .upsert(
        {
          email: adminEmail,
          full_name: adminName,
          is_active: true,
        },
        { onConflict: 'email' }
      )

    if (adminError) {
      console.error('Failed to create platform admin:', adminError)
      throw adminError
    }
    console.log('✅ Platform admin created')

    // 5. Initialize credits
    const { error: creditsError } = await supabase.from('marketplace_credits').upsert(
      {
        workspace_id: workspaceId,
        balance: 500.0,
      },
      { onConflict: 'workspace_id' }
    )

    if (creditsError) {
      console.error('Failed to initialize credits:', creditsError)
      // Non-blocking error
    } else {
      console.log('✅ Credits initialized')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ ADMIN ACCOUNT CREATED SUCCESSFULLY')
    console.log('='.repeat(60))
    console.log(`Email:     ${adminEmail}`)
    console.log(`Password:  ${adminPassword}`)
    console.log(`Role:      owner`)
    console.log(`Plan:      pro`)
    console.log(`Workspace: ${workspaceId}`)
    console.log(`Auth ID:   ${authUserId}`)
    console.log('='.repeat(60))
    console.log('\nYou can now login at: http://localhost:3000/login')
    console.log('Or use Supabase URL if deployed.')
  } catch (error) {
    console.error('\n❌ Failed to create admin account:', error)
    process.exit(1)
  }
}

createAdminAccount()

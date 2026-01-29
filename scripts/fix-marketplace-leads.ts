// Fix Marketplace Leads
// Update seeded leads to be marketplace-listed with proper verification status and pricing

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMarketplaceLeads() {
  console.log('🔧 Fixing marketplace leads...\n')

  // Step 1: Check current state
  console.log('📊 Current state of seeded leads:')
  const { data: currentState, error: stateError } = await supabase
    .from('leads')
    .select('id, is_marketplace_listed, verification_status, marketplace_price')
    .eq('source', 'test-seed')

  if (stateError) {
    console.error('❌ Error checking current state:', stateError)
    process.exit(1)
  }

  const total = currentState?.length || 0
  const marketplaceListed = currentState?.filter((l) => l.is_marketplace_listed).length || 0
  const valid = currentState?.filter((l) => l.verification_status === 'valid').length || 0
  const hasPrice = currentState?.filter((l) => l.marketplace_price !== null).length || 0

  console.log(`   Total leads: ${total}`)
  console.log(`   Marketplace listed: ${marketplaceListed}`)
  console.log(`   Verified as valid: ${valid}`)
  console.log(`   Has marketplace price: ${hasPrice}\n`)

  if (total === 0) {
    console.log('⚠️  No seeded leads found. Run seed-leads.ts first.')
    return
  }

  // Step 2: Update leads to be marketplace-ready
  console.log('🔄 Updating leads for marketplace...')

  // First, let's get all seeded leads with their details to calculate prices
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, intent_score_calculated, freshness_score, phone, verification_status')
    .eq('source', 'test-seed')

  if (fetchError) {
    console.error('❌ Error fetching leads:', fetchError)
    process.exit(1)
  }

  // Update leads in batches
  let updated = 0
  const batchSize = 100

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize)

    // Calculate prices for each lead
    for (const lead of batch) {
      const hasPhone = !!lead.phone
      const intentScore = lead.intent_score_calculated || 50
      const freshnessScore = lead.freshness_score || 50

      // Use the RPC function to calculate price
      const { data: price, error: priceError } = await supabase.rpc(
        'calculate_lead_marketplace_price',
        {
          p_intent_score: intentScore,
          p_freshness_score: freshnessScore,
          p_has_phone: hasPhone,
          p_verification_status: 'valid',
        }
      )

      if (priceError) {
        console.error(`   ⚠️  Error calculating price for lead ${lead.id}:`, priceError)
        // Use fallback price
        const fallbackPrice = 0.05
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            is_marketplace_listed: true,
            verification_status: 'valid',
            marketplace_price: fallbackPrice,
            verified_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        if (!updateError) updated++
      } else {
        // Update with calculated price
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            is_marketplace_listed: true,
            verification_status: 'valid',
            marketplace_price: price,
            verified_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        if (!updateError) updated++
      }
    }

    console.log(`   Updated ${Math.min(i + batchSize, leads.length)}/${leads.length} leads...`)
  }

  console.log(`\n✅ Successfully updated ${updated} leads`)

  // Step 3: Verify the updates
  console.log('\n📊 Updated state:')
  const { data: updatedState } = await supabase
    .from('leads')
    .select('id, is_marketplace_listed, verification_status, marketplace_price')
    .eq('source', 'test-seed')

  const updatedMarketplaceListed =
    updatedState?.filter((l) => l.is_marketplace_listed).length || 0
  const updatedValid =
    updatedState?.filter((l) => l.verification_status === 'valid').length || 0
  const updatedHasPrice =
    updatedState?.filter((l) => l.marketplace_price !== null).length || 0

  console.log(`   Marketplace listed: ${updatedMarketplaceListed}`)
  console.log(`   Verified as valid: ${updatedValid}`)
  console.log(`   Has marketplace price: ${updatedHasPrice}`)

  // Step 4: Show sample prices
  const { data: samplePrices } = await supabase
    .from('leads')
    .select('id, marketplace_price, intent_score_calculated, freshness_score, phone')
    .eq('source', 'test-seed')
    .not('marketplace_price', 'is', null)
    .order('marketplace_price', { ascending: false })
    .limit(5)

  console.log('\n💰 Sample marketplace prices (top 5):')
  samplePrices?.forEach((lead) => {
    console.log(
      `   $${lead.marketplace_price?.toFixed(2)} - Intent: ${lead.intent_score_calculated}, Freshness: ${lead.freshness_score}, Phone: ${lead.phone ? 'Yes' : 'No'}`
    )
  })

  console.log('\n🎉 Marketplace leads fixed!')
}

fixMarketplaceLeads().catch(console.error)

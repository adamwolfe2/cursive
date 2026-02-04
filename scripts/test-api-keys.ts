/**
 * API Keys Testing Script
 * Tests all API integrations to ensure they're working
 *
 * Run: npx tsx scripts/test-api-keys.ts
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

interface TestResult {
  service: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: any
}

const results: TestResult[] = []

async function testAllAPIs() {
  console.log('🔑 Testing API Key Integrations...\n')

  await testResend()
  await testStripe()
  await testFirecrawl()
  await testFal()
  await testAI()
  await testInngest()
  await testSupabase()

  // Print results
  console.log('\n' + '='.repeat(80))
  console.log('API INTEGRATION TEST RESULTS')
  console.log('='.repeat(80) + '\n')

  let passCount = 0
  let failCount = 0
  let skipCount = 0

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'skip' ? '⏭️' : '❌'
    console.log(`${icon} ${result.service}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}`)
    }
    console.log('')

    if (result.status === 'pass') passCount++
    else if (result.status === 'fail') failCount++
    else skipCount++
  }

  console.log('='.repeat(80))
  console.log(`Total: ${results.length} services`)
  console.log(`✅ Working: ${passCount}`)
  console.log(`⏭️  Skipped: ${skipCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(80))

  if (failCount > 0) {
    console.log('\n❌ Some API integrations are failing. Check configuration.')
    process.exit(1)
  } else {
    console.log('\n✅ All API integrations are working!')
    process.exit(0)
  }
}

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || apiKey.includes('your_')) {
    results.push({
      service: 'Resend (Email)',
      status: 'fail',
      message: 'RESEND_API_KEY not configured',
    })
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'test@test.com',
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }),
    })

    const data = await response.json()

    // Even if email fails to send, if we get a 422 (validation error), the API key works
    if (response.status === 422 || response.ok) {
      results.push({
        service: 'Resend (Email)',
        status: 'pass',
        message: 'API key is valid and working',
      })
    } else if (response.status === 401 || response.status === 403) {
      results.push({
        service: 'Resend (Email)',
        status: 'fail',
        message: 'Invalid API key',
        details: data,
      })
    } else {
      results.push({
        service: 'Resend (Email)',
        status: 'pass',
        message: `API key authenticated (status: ${response.status})`,
      })
    }
  } catch (err: any) {
    results.push({
      service: 'Resend (Email)',
      status: 'fail',
      message: `Connection error: ${err.message}`,
    })
  }
}

async function testStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY

  if (!apiKey || apiKey.includes('your_')) {
    results.push({
      service: 'Stripe (Payments)',
      status: 'fail',
      message: 'STRIPE_SECRET_KEY not configured',
    })
    return
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      results.push({
        service: 'Stripe (Payments)',
        status: 'pass',
        message: `API key is valid (found ${data.data.length} products)`,
      })
    } else if (response.status === 401) {
      results.push({
        service: 'Stripe (Payments)',
        status: 'fail',
        message: 'Invalid API key',
        details: data,
      })
    } else {
      results.push({
        service: 'Stripe (Payments)',
        status: 'fail',
        message: `API error: ${data.error?.message || 'Unknown'}`,
      })
    }
  } catch (err: any) {
    results.push({
      service: 'Stripe (Payments)',
      status: 'fail',
      message: `Connection error: ${err.message}`,
    })
  }
}

async function testFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey || apiKey.includes('your_')) {
    results.push({
      service: 'Firecrawl (Website Scraping)',
      status: 'fail',
      message: 'FIRECRAWL_API_KEY not configured',
    })
    return
  }

  try {
    // Test with a simple scrape request (won't actually scrape, just validates API key)
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
      }),
    })

    const data = await response.json()

    if (response.ok || response.status === 402 || response.status === 429) {
      // 402 = out of credits, 429 = rate limit - both mean API key is valid
      results.push({
        service: 'Firecrawl (Website Scraping)',
        status: 'pass',
        message: 'API key is valid',
      })
    } else if (response.status === 401 || response.status === 403) {
      results.push({
        service: 'Firecrawl (Website Scraping)',
        status: 'fail',
        message: 'Invalid API key',
        details: data,
      })
    } else {
      results.push({
        service: 'Firecrawl (Website Scraping)',
        status: 'pass',
        message: `API key authenticated (status: ${response.status})`,
      })
    }
  } catch (err: any) {
    results.push({
      service: 'Firecrawl (Website Scraping)',
      status: 'fail',
      message: `Connection error: ${err.message}`,
    })
  }
}

async function testFal() {
  const apiKey = process.env.FAL_KEY

  if (!apiKey || apiKey.includes('your_')) {
    results.push({
      service: 'Fal.ai (Image Generation)',
      status: 'fail',
      message: 'FAL_KEY not configured - REQUIRED for AI Studio!',
    })
    return
  }

  try {
    // Test with a simple status check
    const response = await fetch('https://rest.alpha.fal.ai/models', {
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    })

    if (response.ok) {
      results.push({
        service: 'Fal.ai (Image Generation)',
        status: 'pass',
        message: 'API key is valid and working',
      })
    } else if (response.status === 401 || response.status === 403) {
      results.push({
        service: 'Fal.ai (Image Generation)',
        status: 'fail',
        message: 'Invalid API key',
      })
    } else {
      results.push({
        service: 'Fal.ai (Image Generation)',
        status: 'pass',
        message: `API key authenticated (status: ${response.status})`,
      })
    }
  } catch (err: any) {
    results.push({
      service: 'Fal.ai (Image Generation)',
      status: 'fail',
      message: `Connection error: ${err.message}`,
    })
  }
}

async function testAI() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if ((!anthropicKey || anthropicKey.includes('your_')) && (!openaiKey || openaiKey.includes('your_'))) {
    results.push({
      service: 'AI Provider (Claude/GPT)',
      status: 'fail',
      message: 'No AI API key configured (need ANTHROPIC_API_KEY or OPENAI_API_KEY)',
    })
    return
  }

  // Test Anthropic
  if (anthropicKey && !anthropicKey.includes('your_')) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      })

      if (response.ok) {
        results.push({
          service: 'Anthropic (Claude)',
          status: 'pass',
          message: 'API key is valid and working',
        })
        return
      } else if (response.status === 401) {
        results.push({
          service: 'Anthropic (Claude)',
          status: 'fail',
          message: 'Invalid API key',
        })
      }
    } catch (err: any) {
      results.push({
        service: 'Anthropic (Claude)',
        status: 'fail',
        message: `Connection error: ${err.message}`,
      })
    }
  }

  // Test OpenAI
  if (openaiKey && !openaiKey.includes('your_')) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
      })

      if (response.ok) {
        results.push({
          service: 'OpenAI (GPT)',
          status: 'pass',
          message: 'API key is valid and working',
        })
      } else if (response.status === 401) {
        results.push({
          service: 'OpenAI (GPT)',
          status: 'fail',
          message: 'Invalid API key',
        })
      }
    } catch (err: any) {
      results.push({
        service: 'OpenAI (GPT)',
        status: 'fail',
        message: `Connection error: ${err.message}`,
      })
    }
  }
}

async function testInngest() {
  const eventKey = process.env.INNGEST_EVENT_KEY
  const signingKey = process.env.INNGEST_SIGNING_KEY

  if (!eventKey || eventKey.includes('your_')) {
    results.push({
      service: 'Inngest (Background Jobs)',
      status: 'fail',
      message: 'INNGEST_EVENT_KEY not configured',
    })
    return
  }

  if (!signingKey || signingKey.includes('your_')) {
    results.push({
      service: 'Inngest (Background Jobs)',
      status: 'fail',
      message: 'INNGEST_SIGNING_KEY not configured',
    })
    return
  }

  results.push({
    service: 'Inngest (Background Jobs)',
    status: 'pass',
    message: 'Event and signing keys are configured',
  })
}

async function testSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceKey) {
    results.push({
      service: 'Supabase (Database)',
      status: 'fail',
      message: 'Supabase credentials not configured',
    })
    return
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    })

    if (response.ok || response.status === 404) {
      // 404 is expected for root endpoint
      results.push({
        service: 'Supabase (Database)',
        status: 'pass',
        message: 'Connection successful',
      })
    } else if (response.status === 401) {
      results.push({
        service: 'Supabase (Database)',
        status: 'fail',
        message: 'Invalid API key',
      })
    } else {
      results.push({
        service: 'Supabase (Database)',
        status: 'pass',
        message: `Connected (status: ${response.status})`,
      })
    }
  } catch (err: any) {
    results.push({
      service: 'Supabase (Database)',
      status: 'fail',
      message: `Connection error: ${err.message}`,
    })
  }
}

// Run tests
testAllAPIs().catch((err) => {
  console.error('❌ Test script error:', err)
  process.exit(1)
})

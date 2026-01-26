/**
 * Seed Sales.co Email Templates
 *
 * This script seeds the email_templates table with templates from sales-co-templates.json
 *
 * Usage:
 *   npx tsx scripts/seed-templates.ts
 *
 * Options:
 *   --workspace-id <id>  Required. The workspace ID to seed templates for.
 *   --dry-run            Show what would be inserted without actually inserting.
 *   --clear              Clear existing templates before seeding (use with caution).
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Parse command line arguments
const args = process.argv.slice(2)
const workspaceId = args.find((_, i) => args[i - 1] === '--workspace-id')
const dryRun = args.includes('--dry-run')
const clearFirst = args.includes('--clear')

if (!workspaceId) {
  console.error('Error: --workspace-id is required')
  console.error('Usage: npx tsx scripts/seed-templates.ts --workspace-id <id>')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TemplateData {
  name: string
  subject: string
  body_html: string
  body_text: string
  tone: string
  structure: string
  cta_type: string
  target_seniority: string[]
  company_types: string[]
  variables: string[]
}

interface TemplatesFile {
  metadata: {
    source: string
    version: string
    total_templates: number
    taxonomy: {
      tones: string[]
      structures: string[]
      cta_types: string[]
      seniorities: string[]
    }
  }
  templates: TemplateData[]
}

async function seedTemplates() {
  console.log('🌱 Sales.co Template Seeder')
  console.log('===========================')
  console.log(`Workspace ID: ${workspaceId}`)
  console.log(`Dry Run: ${dryRun}`)
  console.log(`Clear First: ${clearFirst}`)
  console.log('')

  // Load templates from JSON file
  const templatesPath = path.join(__dirname, 'data', 'sales-co-templates.json')

  if (!fs.existsSync(templatesPath)) {
    console.error(`Error: Templates file not found at ${templatesPath}`)
    process.exit(1)
  }

  const fileContent = fs.readFileSync(templatesPath, 'utf-8')
  const templatesFile: TemplatesFile = JSON.parse(fileContent)

  console.log(`📄 Loaded ${templatesFile.templates.length} templates from ${templatesFile.metadata.source}`)
  console.log(`   Version: ${templatesFile.metadata.version}`)
  console.log('')

  // Clear existing templates if requested
  if (clearFirst && !dryRun) {
    console.log('🗑️  Clearing existing sales_co templates...')
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('source', 'sales_co')

    if (deleteError) {
      console.error('Error clearing templates:', deleteError.message)
      process.exit(1)
    }
    console.log('   Done.')
    console.log('')
  }

  // Prepare templates for insertion
  const templatesToInsert = templatesFile.templates.map((template) => ({
    workspace_id: workspaceId,
    name: template.name,
    subject: template.subject,
    body_html: template.body_html,
    body_text: template.body_text,
    variables: { fields: template.variables },
    tone: template.tone,
    structure: template.structure,
    cta_type: template.cta_type,
    target_seniority: template.target_seniority,
    company_types: template.company_types,
    source: 'sales_co',
    is_active: true,
    emails_sent: 0,
    total_replies: 0,
    positive_replies: 0,
    reply_rate: 0,
    positive_reply_rate: 0,
  }))

  if (dryRun) {
    console.log('🔍 Dry run - would insert the following templates:')
    console.log('')
    templatesToInsert.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name}`)
      console.log(`      Tone: ${t.tone} | Structure: ${t.structure} | CTA: ${t.cta_type}`)
      console.log(`      Seniority: ${t.target_seniority.join(', ')}`)
      console.log('')
    })
    console.log(`Total: ${templatesToInsert.length} templates`)
    return
  }

  // Insert templates in batches of 50
  const batchSize = 50
  let inserted = 0
  let failed = 0

  for (let i = 0; i < templatesToInsert.length; i += batchSize) {
    const batch = templatesToInsert.slice(i, i + batchSize)
    console.log(`📦 Inserting batch ${Math.floor(i / batchSize) + 1}...`)

    const { data, error } = await supabase
      .from('email_templates')
      .insert(batch)
      .select('id, name')

    if (error) {
      console.error(`   Error: ${error.message}`)
      failed += batch.length
    } else {
      inserted += data.length
      console.log(`   ✅ Inserted ${data.length} templates`)
    }
  }

  console.log('')
  console.log('===========================')
  console.log(`✅ Completed: ${inserted} templates inserted`)
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} templates`)
  }

  // Show summary by category
  console.log('')
  console.log('📊 Summary by Category:')

  const byTone: Record<string, number> = {}
  const byStructure: Record<string, number> = {}
  const byCtaType: Record<string, number> = {}

  templatesToInsert.forEach((t) => {
    byTone[t.tone] = (byTone[t.tone] || 0) + 1
    byStructure[t.structure] = (byStructure[t.structure] || 0) + 1
    byCtaType[t.cta_type] = (byCtaType[t.cta_type] || 0) + 1
  })

  console.log('')
  console.log('   By Tone:')
  Object.entries(byTone).forEach(([tone, count]) => {
    console.log(`     - ${tone}: ${count}`)
  })

  console.log('')
  console.log('   By Structure:')
  Object.entries(byStructure).forEach(([structure, count]) => {
    console.log(`     - ${structure}: ${count}`)
  })

  console.log('')
  console.log('   By CTA Type:')
  Object.entries(byCtaType).forEach(([cta, count]) => {
    console.log(`     - ${cta}: ${count}`)
  })
}

// Run the seeder
seedTemplates().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

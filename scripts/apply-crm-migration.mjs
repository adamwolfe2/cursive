import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read env vars from .env.local
const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('🔗 Connecting to Supabase:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20260130000001_crm_tables.sql')
    const sql = readFileSync(migrationPath, 'utf8')
    
    console.log('📝 Applying CRM tables migration...')
    console.log('   - companies table')
    console.log('   - contacts table')
    console.log('   - deals table')
    console.log('   - activities table')
    
    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`\n🔧 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Some errors are OK (like "already exists")
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('does not exist')
          )) {
            console.log(`   ⚠️  Skipped (already exists): statement ${i + 1}`)
          } else {
            console.error(`   ❌ Error on statement ${i + 1}:`, error.message)
            throw error
          }
        } else {
          if ((i + 1) % 10 === 0) {
            console.log(`   ✓ Executed ${i + 1}/${statements.length} statements`)
          }
        }
      } catch (err) {
        console.error(`\n❌ Failed on statement ${i + 1}:`)
        console.error(statement.substring(0, 200) + '...')
        throw err
      }
    }
    
    console.log('\n✅ Migration completed!')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    
    const tables = ['companies', 'contacts', 'deals', 'activities']
    for (const tableName of tables) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`   ✓ ${tableName}: exists (${count || 0} rows)`)
      }
    }
    
    console.log('\n✨ CRM tables are ready!')
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    process.exit(1)
  }
}

applyMigration()

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function auditSecurity() {
  console.log('🔒 SECURITY AUDIT\n')

  try {
    // 1. Check tables WITHOUT RLS enabled
    console.log('⚠️  Checking tables WITHOUT RLS enabled...\n')
    const { data: noRls, error: noRlsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = 'public'
        )
        WHERE schemaname = 'public'
        AND NOT c.relrowsecurity
        ORDER BY tablename;
      `,
    })

    if (noRlsError) {
      console.log('Note: exec_sql RPC may not exist. Using alternative query...\n')
      // Alternative approach without RPC
      const { data: tables } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')

      console.log(`Total tables in public schema: ${tables?.length || 0}`)
      console.log(
        '\nNote: Cannot check RLS status without exec_sql RPC. Please run this query manually in Supabase SQL Editor:'
      )
      console.log(`
        SELECT
          schemaname,
          tablename,
          CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `)
    } else {
      console.log('Tables WITHOUT RLS:')
      console.table(noRls)
    }

    // 2. Check policy count per table
    console.log('\n📋 Checking policy count per table...\n')
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          tablename,
          COUNT(*) as policy_count,
          array_agg(policyname) as policies
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY policy_count DESC;
      `,
    })

    if (policiesError) {
      console.log('Note: Run this query manually to check policies:')
      console.log(`
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY policy_count DESC;
      `)
    } else {
      console.log('Policy counts:')
      console.table(policies)
    }

    // 3. Check for missing indexes on foreign keys
    console.log('\n⚡ Checking for missing indexes on foreign keys...\n')
    const { data: missingIndexes, error: indexError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          tc.table_name,
          kcu.column_name,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = tc.table_name
          AND indexdef LIKE '%' || kcu.column_name || '%'
        )
        ORDER BY tc.table_name, kcu.column_name;
      `,
    })

    if (indexError) {
      console.log('Note: Run this query manually to check missing indexes')
    } else {
      console.log('Foreign keys without indexes:')
      console.table(missingIndexes)
      console.log(`Total: ${missingIndexes?.length || 0}`)
    }

    // 4. Check for tables with high row counts
    console.log('\n📊 Checking largest tables...\n')
    const { data: largeTables, error: largeError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          relname as table_name,
          n_live_tup as row_count,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
        LIMIT 20;
      `,
    })

    if (largeError) {
      console.log('Note: Run this query manually to check table sizes')
    } else {
      console.log('Largest tables:')
      console.table(largeTables)
    }

    // 5. Check for indexes on frequently queried columns
    console.log('\n🔍 Checking existing indexes...\n')
    const { data: indexes, error: indexListError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `,
    })

    if (indexListError) {
      console.log('Note: Run this query manually to list indexes')
    } else {
      console.log(`Total indexes: ${indexes?.length || 0}`)
      // Group by table
      const byTable = indexes?.reduce(
        (acc: any, idx: any) => {
          if (!acc[idx.tablename]) acc[idx.tablename] = []
          acc[idx.tablename].push(idx.indexname)
          return acc
        },
        {} as Record<string, string[]>
      )
      console.log('\nIndexes by table:')
      Object.entries(byTable || {}).forEach(([table, idxs]) => {
        console.log(`  ${table}: ${(idxs as string[]).length} indexes`)
      })
    }

    console.log('\n✅ Security audit complete!')
    console.log('\nNext steps:')
    console.log('1. Review tables without RLS and add policies')
    console.log('2. Add indexes for foreign keys without them')
    console.log('3. Run security_hardening.sql migration')
    console.log('4. Run performance_indexes.sql migration')
  } catch (error) {
    console.error('Error running audit:', error)
    console.log('\nIf exec_sql RPC is not available, run the queries manually in Supabase SQL Editor')
  }
}

auditSecurity().catch(console.error)

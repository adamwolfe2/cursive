#!/bin/bash

# Load environment variables
source .env.local

# Check credentials
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing Supabase credentials"
  exit 1
fi

echo "🔗 Connecting to Supabase..."
echo "📝 Applying CRM migration via SQL editor..."

# Read migration file
MIGRATION_SQL=$(cat supabase/migrations/20260130000001_crm_tables.sql)

# Execute via Supabase REST API
curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | jq -Rs .)}" \
  2>&1 | head -50

echo ""
echo "✅ Migration execution attempted"

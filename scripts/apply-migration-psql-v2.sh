#!/bin/bash

# Load environment variables
source .env.local

# Extract project ref
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | cut -d'/' -f3 | cut -d'.' -f1)

# Construct PostgreSQL connection string
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

echo "🔗 Attempting Supabase PostgreSQL connection..."
echo "   Project: $PROJECT_REF"
echo ""
echo "⚠️  Note: This requires the database password, not the API key."
echo "   If you don't have it set in .env.local as SUPABASE_DB_PASSWORD,"
echo "   you can find it in the Supabase Dashboard under Project Settings > Database."
echo ""

# Check for DB password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ SUPABASE_DB_PASSWORD not found in .env.local"
    echo ""
    echo "As an alternative, you can apply this migration through the Supabase Dashboard:"
    echo "   1. Go to https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
    echo "   2. Copy the contents of: supabase/migrations/20260130000001_crm_tables.sql"
    echo "   3. Paste into the SQL Editor and click 'Run'"
    echo ""
    echo "Or add SUPABASE_DB_PASSWORD=your_db_password to .env.local and re-run this script."
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed"
    echo ""
    echo "Alternative: Apply via Supabase Dashboard SQL Editor"
    echo "   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
    exit 1
fi

echo "📝 Applying CRM tables migration..."

# Apply migration
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
  "postgresql://${DB_USER}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
  -f supabase/migrations/20260130000001_crm_tables.sql \
  2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🔍 Verifying tables..."
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
      "postgresql://${DB_USER}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
      -c "\dt companies; \dt contacts; \dt deals; \dt activities;" \
      2>&1 | grep -E "(companies|contacts|deals|activities|table)"
else
    echo ""
    echo "❌ Migration failed"
    echo ""
    echo "Please apply manually via Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
fi

exit $EXIT_CODE

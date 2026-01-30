#!/bin/bash

# Load environment variables
source .env.local

# Extract project ref
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | cut -d'/' -f3 | cut -d'.' -f1)

# Use direct connection (not pooler)
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "🔗 Connecting to Supabase (Direct Connection)..."
echo "   Project: $PROJECT_REF"
echo "   Host: $DB_HOST"
echo ""

if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed"
    echo "   Install with: brew install postgresql@15"
    exit 1
fi

echo "📝 Applying CRM tables migration..."
echo ""

# Apply migration with direct connection
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f supabase/migrations/20260130000001_crm_tables.sql \
  2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🔍 Verifying tables..."
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c "\dt companies; \dt contacts; \dt deals; \dt activities;" \
      2>&1 | grep -E "(List of relations|companies|contacts|deals|activities|table)"
else
    echo ""
    echo "❌ Migration failed (exit code: $EXIT_CODE)"
fi

exit $EXIT_CODE

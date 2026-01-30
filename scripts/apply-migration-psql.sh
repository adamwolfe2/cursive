#!/bin/bash

# Load environment variables
source .env.local

# Extract project ref
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | cut -d'/' -f3 | cut -d'.' -f1)

# Construct PostgreSQL connection string
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="6543"  # Supabase uses port 6543 for connection pooler
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

echo "🔗 Connecting to Supabase PostgreSQL..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""
echo "📝 Applying CRM tables migration..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo ""
    echo "For macOS: brew install postgresql@15"
    echo "For Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Apply migration
PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -d "$DB_NAME" \
  -U "$DB_USER" \
  -f supabase/migrations/20260130000001_crm_tables.sql \
  2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
else
    echo ""
    echo "❌ Migration failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE

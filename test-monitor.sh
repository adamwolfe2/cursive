#!/bin/bash

# AI Studio Test Monitor
# Watches database for changes during testing

echo "🧪 AI Studio Test Monitor Started"
echo "=================================="
echo ""
echo "This will check the database every 5 seconds for new entries."
echo "Press Ctrl+C to stop monitoring."
echo ""

while true; do
    clear
    echo "🧪 AI Studio Test Monitor - $(date '+%H:%M:%S')"
    echo "=================================="
    echo ""

    echo "📊 WORKSPACES:"
    npx supabase db remote query "
        SELECT
            LEFT(id::text, 8) as id,
            name,
            extraction_status,
            CASE
                WHEN brand_data->>'screenshot' IS NOT NULL THEN '✓ Has screenshot'
                ELSE '✗ No screenshot'
            END as screenshot_status,
            created_at::timestamp(0)
        FROM brand_workspaces
        ORDER BY created_at DESC
        LIMIT 3;
    " 2>/dev/null || echo "⚠️  Database not connected or query failed"

    echo ""
    echo "👥 CUSTOMER PROFILES:"
    npx supabase db remote query "
        SELECT COUNT(*) as total_profiles
        FROM customer_profiles;
    " 2>/dev/null || echo "⚠️  Query failed"

    echo ""
    echo "🎁 OFFERS:"
    npx supabase db remote query "
        SELECT COUNT(*) as total_offers
        FROM offers
        WHERE source = 'extracted';
    " 2>/dev/null || echo "⚠️  Query failed"

    echo ""
    echo "🎨 CREATIVES:"
    npx supabase db remote query "
        SELECT COUNT(*) as total_creatives
        FROM ad_creatives;
    " 2>/dev/null || echo "⚠️  Query failed"

    echo ""
    echo "📢 CAMPAIGNS:"
    npx supabase db remote query "
        SELECT
            LEFT(id::text, 8) as id,
            tier,
            payment_status,
            campaign_status,
            created_at::timestamp(0)
        FROM ad_campaigns
        ORDER BY created_at DESC
        LIMIT 2;
    " 2>/dev/null || echo "⚠️  Query failed"

    echo ""
    echo "Refreshing in 5 seconds... (Ctrl+C to stop)"
    sleep 5
done

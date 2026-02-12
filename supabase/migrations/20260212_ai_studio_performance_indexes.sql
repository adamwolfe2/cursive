-- ============================================================================
-- Migration: AI Studio Performance Indexes
-- Date: 2026-02-12
-- Description: Add composite indexes for AI Studio tables to optimize common
--              query patterns (workspace filtering + status/date sorting)
-- ============================================================================

-- ============================================================================
-- 1. OFFERS: brand_workspace_id + status + created_at
-- ============================================================================
-- Pattern: GET /api/ai-studio/offers?workspace={id}
-- Query filters by brand_workspace_id and status='active', orders by created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_brand_workspace_status_created
  ON offers(brand_workspace_id, status, created_at DESC);

-- ============================================================================
-- 2. CUSTOMER_PROFILES: brand_workspace_id + created_at
-- ============================================================================
-- Pattern: GET /api/ai-studio/profiles?workspace={id}
-- Query filters by brand_workspace_id, orders by created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_profiles_brand_workspace_created
  ON customer_profiles(brand_workspace_id, created_at DESC);

-- ============================================================================
-- 3. BRAND_WORKSPACES: workspace_id + url (duplicate detection)
-- ============================================================================
-- Pattern: POST /api/ai-studio/brand/extract checks for existing workspace by URL
-- Query filters by workspace_id and url to prevent duplicate extractions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_workspaces_workspace_url
  ON brand_workspaces(workspace_id, url);

-- ============================================================================
-- 4. BRAND_WORKSPACES: workspace_id + created_at (listing)
-- ============================================================================
-- Pattern: GET /api/ai-studio/workspaces lists workspaces by workspace_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_workspaces_workspace_created
  ON brand_workspaces(workspace_id, created_at DESC);

-- ============================================================================
-- 5. AD_CREATIVES: brand_workspace_id + created_at
-- ============================================================================
-- Pattern: GET /api/ai-studio/creatives?workspace={id}
-- Query filters by brand_workspace_id, orders by created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_creatives_brand_workspace_created
  ON ad_creatives(brand_workspace_id, created_at DESC)
  WHERE brand_workspace_id IS NOT NULL;

-- ============================================================================
-- 6. AD_CAMPAIGNS: brand_workspace_id + status + created_at
-- ============================================================================
-- Pattern: GET /api/ai-studio/campaigns filters by workspace and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_campaigns_brand_workspace_status_created
  ON ad_campaigns(brand_workspace_id, status, created_at DESC)
  WHERE brand_workspace_id IS NOT NULL;

-- ============================================================================
-- 7. CREDIT_PURCHASES: workspace_id + status + created_at
-- ============================================================================
-- Pattern: Marketplace credit purchase queries filter by workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_purchases_workspace_status_created
  ON credit_purchases(workspace_id, status, created_at DESC);

-- ============================================================================
-- 8. MARKETPLACE_PURCHASES: workspace_id + status + created_at
-- ============================================================================
-- Pattern: Lead purchase queries filter by workspace (buyer)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_purchases_workspace_created
  ON marketplace_purchases(buyer_workspace_id, created_at DESC);

-- Partner view of their sales
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_purchases_partner_created
  ON marketplace_purchases(partner_id, created_at DESC)
  WHERE partner_id IS NOT NULL;

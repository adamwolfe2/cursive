# Performance Sanity Check

Date: 2026-01-28
Branch: claude/build-lead-marketplace-WUiyf

## Overview

This document records the performance sanity check for the Lead Marketplace feature.

## Top Marketplace Query Patterns

### 1. Browse Leads (Most Common)

**Query Pattern:**
```sql
SELECT id, first_name, last_name, job_title, company_name, company_industry,
       company_size, city, state, seniority_level, intent_score_calculated,
       freshness_score, verification_status, phone, email, marketplace_price
FROM leads
WHERE is_marketplace_listed = true
  AND verification_status IN ('valid', 'catch_all')
  [AND company_industry IN (...)]
  [AND state_code IN (...)]
  [AND company_size IN (...)]
  [AND seniority_level IN (...)]
  [AND intent_score_calculated >= X]
  [AND freshness_score >= Y]
ORDER BY freshness_score DESC
LIMIT 20 OFFSET 0
```

**Supporting Indexes:**
| Index | Purpose |
|-------|---------|
| `idx_leads_marketplace_listed` | Partial index for listed leads |
| `idx_leads_verification_status` | Filter by verification status |
| `idx_leads_intent_score` | Intent score range queries |
| `idx_leads_freshness_score` | Freshness ordering |
| `idx_leads_company_industry` | Industry filter |
| `idx_leads_state_code` | State filter |
| `idx_leads_company_size` | Company size filter |
| `idx_leads_seniority` | Seniority filter |

**Status:** ✅ Indexes exist for all common filter patterns

### 2. Hash Key Lookup (Deduplication)

**Query Pattern:**
```sql
SELECT id FROM leads
WHERE hash_key = $1
LIMIT 1
```

**Supporting Index:**
| Index | Purpose |
|-------|---------|
| `idx_leads_hash_key` | Fast duplicate detection |

**Status:** ✅ Index exists

### 3. Purchase History

**Query Pattern:**
```sql
SELECT * FROM marketplace_purchases
WHERE buyer_workspace_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Supporting Indexes:**
| Index | Purpose |
|-------|---------|
| `idx_marketplace_purchases_workspace` | Filter by workspace |
| `idx_marketplace_purchases_created` | Created date ordering |

**Status:** ✅ Indexes exist

### 4. Commission Processing

**Query Pattern:**
```sql
SELECT * FROM marketplace_purchase_items
WHERE commission_status = 'pending_holdback'
  AND commission_payable_at <= NOW()
```

**Supporting Indexes:**
| Index | Purpose |
|-------|---------|
| `idx_mpi_commission_status` | Filter by status |
| `idx_mpi_payable_at` | Partial index for pending items |

**Status:** ✅ Indexes exist

### 5. Partner Lead Lookup

**Query Pattern:**
```sql
SELECT * FROM leads
WHERE partner_id = $1
  AND created_at >= $2
```

**Supporting Indexes:**
| Index | Purpose |
|-------|---------|
| `idx_leads_partner_id` | Partial index for partner leads |
| `idx_leads_created_at` | Date range filtering |

**Status:** ✅ Indexes exist

## Index Summary

### Leads Table
Total marketplace-related indexes: 15+

Key indexes for browse performance:
```sql
-- Partial index for marketplace-listed leads
CREATE INDEX idx_leads_marketplace_listed
  ON leads(is_marketplace_listed)
  WHERE is_marketplace_listed = true;

-- Composite index for common filters
CREATE INDEX idx_leads_marketplace
  ON leads(workspace_id, is_marketplace_listed, created_at DESC);

-- Score indexes for ordering
CREATE INDEX idx_leads_intent_score ON leads(intent_score_calculated);
CREATE INDEX idx_leads_freshness_score ON leads(freshness_score);

-- Filter indexes
CREATE INDEX idx_leads_company_industry ON leads(company_industry);
CREATE INDEX idx_leads_state_code ON leads(state_code);
CREATE INDEX idx_leads_company_size ON leads(company_size);
CREATE INDEX idx_leads_seniority ON leads(seniority_level);
CREATE INDEX idx_leads_verification_status ON leads(verification_status);

-- Deduplication index
CREATE INDEX idx_leads_hash_key ON leads(hash_key);
```

### Marketplace Purchases Table
```sql
CREATE INDEX idx_marketplace_purchases_workspace
  ON marketplace_purchases(buyer_workspace_id);
CREATE INDEX idx_marketplace_purchases_status
  ON marketplace_purchases(status);
CREATE INDEX idx_marketplace_purchases_created
  ON marketplace_purchases(created_at DESC);
```

### Purchase Items Table
```sql
CREATE INDEX idx_mpi_purchase ON marketplace_purchase_items(purchase_id);
CREATE INDEX idx_mpi_lead ON marketplace_purchase_items(lead_id);
CREATE INDEX idx_mpi_partner ON marketplace_purchase_items(partner_id)
  WHERE partner_id IS NOT NULL;
CREATE INDEX idx_mpi_commission_status
  ON marketplace_purchase_items(commission_status);
CREATE INDEX idx_mpi_payable_at
  ON marketplace_purchase_items(commission_payable_at)
  WHERE commission_status = 'pending_holdback';
```

## Query Optimization Notes

### Partial Indexes
Several partial indexes are used to reduce index size and improve performance:

1. `idx_leads_marketplace_listed WHERE is_marketplace_listed = true`
   - Only indexes the ~5% of leads that are marketplace-listed
   - Significantly smaller than full table index

2. `idx_mpi_payable_at WHERE commission_status = 'pending_holdback'`
   - Only indexes pending commissions
   - Keeps index small as commissions are processed

3. `idx_leads_partner_id WHERE partner_id IS NOT NULL`
   - Only indexes partner-supplied leads
   - Excludes platform-generated leads

### GIN Indexes
For array columns, GIN indexes are used:
```sql
CREATE INDEX idx_leads_sic_codes ON leads USING GIN(sic_codes);
CREATE INDEX idx_leads_intent_signals ON leads USING GIN(intent_signals);
```

## Estimated Query Performance

Based on index analysis (without actual EXPLAIN ANALYZE on production data):

| Query | Expected Scan Type | Estimated Performance |
|-------|-------------------|----------------------|
| Browse leads (default) | Index Scan | < 50ms |
| Browse leads (multiple filters) | Bitmap Index Scan | < 100ms |
| Hash key lookup | Index Scan | < 5ms |
| Purchase history | Index Scan | < 20ms |
| Commission batch | Index Scan | < 30ms |

## Recommendations

### No Changes Required
All common query patterns have appropriate indexes.

### Future Considerations

1. **Composite index for common filter combos:**
   If usage patterns show common filter combinations (e.g., industry + state), consider:
   ```sql
   CREATE INDEX idx_leads_industry_state
     ON leads(company_industry, state_code)
     WHERE is_marketplace_listed = true;
   ```

2. **Covering index for browse:**
   If SELECT list is stable, consider a covering index to avoid table lookups:
   ```sql
   CREATE INDEX idx_leads_marketplace_browse
     ON leads(freshness_score DESC, intent_score_calculated DESC)
     INCLUDE (first_name, last_name, job_title, company_name, ...)
     WHERE is_marketplace_listed = true;
   ```

3. **Materialized view for statistics:**
   For dashboard stats, consider materialized view refreshed hourly:
   ```sql
   CREATE MATERIALIZED VIEW marketplace_stats AS
   SELECT company_industry, COUNT(*), AVG(marketplace_price)
   FROM leads WHERE is_marketplace_listed = true
   GROUP BY company_industry;
   ```

## Conclusion

**Status:** ✅ PASS

All critical marketplace query patterns have appropriate indexes:
- Browse queries use partial indexes for marketplace-listed leads
- Deduplication uses dedicated hash key index
- Commission processing uses partial index for pending items
- Purchase history uses workspace and date indexes

No index additions required for initial release. Monitor query performance post-launch and add composite/covering indexes if needed.

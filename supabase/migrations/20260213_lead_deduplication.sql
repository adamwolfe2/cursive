/**
 * Lead Deduplication System
 * Prevent duplicate lead purchases using hash-based detection
 * Hash generated from normalized email + phone
 */

-- Add dedup_hash column to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dedup_hash TEXT;

-- Function to generate deduplication hash
CREATE OR REPLACE FUNCTION generate_dedup_hash(
  p_email TEXT,
  p_phone TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Normalize inputs:
  -- - Email: lowercase, trim whitespace
  -- - Phone: remove all non-digits
  RETURN md5(
    LOWER(TRIM(COALESCE(p_email, ''))) ||
    '|' ||
    regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to set dedup_hash on insert/update
CREATE OR REPLACE FUNCTION set_dedup_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dedup_hash = generate_dedup_hash(NEW.email, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate dedup_hash
DROP TRIGGER IF EXISTS trg_leads_dedup_hash ON leads;
CREATE TRIGGER trg_leads_dedup_hash
  BEFORE INSERT OR UPDATE OF email, phone ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_dedup_hash();

-- Backfill dedup_hash for existing leads
UPDATE leads
SET dedup_hash = generate_dedup_hash(email, phone)
WHERE dedup_hash IS NULL;

-- Create unique index to prevent duplicates within workspace
-- Note: We allow NULL hashes (for leads without email/phone)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_dedup_hash_unique
  ON leads(workspace_id, dedup_hash)
  WHERE dedup_hash IS NOT NULL AND dedup_hash != '';

-- Regular index for lookups
CREATE INDEX IF NOT EXISTS idx_leads_dedup_hash
  ON leads(dedup_hash)
  WHERE dedup_hash IS NOT NULL;

-- Function to check for duplicates before purchase
CREATE OR REPLACE FUNCTION check_duplicate_leads(
  p_workspace_id UUID,
  p_emails TEXT[],
  p_phones TEXT[] DEFAULT NULL
) RETURNS TABLE(
  email TEXT,
  phone TEXT,
  is_duplicate BOOLEAN,
  existing_lead_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH input_data AS (
    SELECT
      UNNEST(p_emails) as email,
      UNNEST(COALESCE(p_phones, ARRAY[]::TEXT[])) as phone
  )
  SELECT
    i.email,
    i.phone,
    (l.id IS NOT NULL) as is_duplicate,
    l.id as existing_lead_id
  FROM input_data i
  LEFT JOIN leads l ON
    l.workspace_id = p_workspace_id
    AND l.dedup_hash = generate_dedup_hash(i.email, i.phone)
    AND l.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_dedup_hash TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_leads TO authenticated;

-- Add comment
COMMENT ON COLUMN leads.dedup_hash IS 'MD5 hash of normalized email + phone for deduplication';
COMMENT ON FUNCTION generate_dedup_hash IS 'Generates consistent hash from email/phone for duplicate detection';
COMMENT ON FUNCTION check_duplicate_leads IS 'Batch check if leads already exist in workspace before purchase';

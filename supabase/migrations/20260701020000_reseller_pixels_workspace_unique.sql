-- ============================================================================
-- Reseller pixels: enforce one pixel per child workspace
-- ============================================================================
-- deliver-reseller-lead looks up reseller_pixels by workspace_id with
-- maybeSingle(). If two rows ever shared a workspace_id, that lookup would
-- error (multiple rows) and the function would silently skip delivery for
-- EVERY lead in that workspace. The application never creates duplicates
-- (each create provisions a fresh child workspace), but nothing enforced it.
--
-- TODO: MUST BE APPLIED MANUALLY to prod (Supabase CLI not linked). Safe to
-- apply live: reseller_pixels is tiny and the index is unique-per-existing-data
-- (verified: no duplicate workspace_id rows exist).

CREATE UNIQUE INDEX IF NOT EXISTS uq_reseller_pixels_workspace
  ON reseller_pixels(workspace_id);

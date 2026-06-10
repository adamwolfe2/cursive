-- S2: Canonical event → pixel attribution.
--
-- AudienceLab stamps inbound events with a `pixel_id` (or null) that differs
-- from the management `pixel_id` we store at pixel creation, so
-- `audiencelab_events.pixel_id` is NOT a reliable attribution key. Verify,
-- the token-portal visitor feed/CSV, and dashboard stats all query by that
-- mismatched id, so ~91% of real events read as unattributable.
--
-- Introduce `pixel_row_id` as the canonical attribution key: a FK to the
-- managed pixel row, whose `workspace_id` owns the event. The raw upstream
-- `pixel_id` stays as diagnostic evidence only.
--
-- This slice is purely additive (nullable column + index) → zero-downtime and
-- safe to apply ahead of the producer/consumer changes. Producers stamp the
-- column in S3, consumers read it in S4, and historical rows are backfilled in
-- S5. ON DELETE SET NULL: removing a pixel never deletes its events.

ALTER TABLE public.audiencelab_events
  ADD COLUMN IF NOT EXISTS pixel_row_id uuid
    REFERENCES public.audiencelab_pixels(id) ON DELETE SET NULL;

-- Consumer hot path: verify counts and the visitor feed read a pixel's events
-- by canonical id, newest first. Partial — most rows are null until backfill
-- (S5) and quarantined events stay null, so skip the null bloat.
CREATE INDEX IF NOT EXISTS idx_audiencelab_events_pixel_row_received
  ON public.audiencelab_events (pixel_row_id, received_at DESC)
  WHERE pixel_row_id IS NOT NULL;

-- Invariant: a workspace has at most ONE active managed pixel. This makes
-- canonical attribution deterministic — a ?ws= routing signal resolves to
-- exactly one pixel row. All current data already satisfies this (verified:
-- every workspace has exactly one active pixel; unclaimed demo pixels carry a
-- null workspace and are excluded). A future multi-pixel-per-workspace need
-- would relax this deliberately.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_audiencelab_pixels_active_per_workspace
  ON public.audiencelab_pixels (workspace_id)
  WHERE is_active AND workspace_id IS NOT NULL;

COMMENT ON COLUMN public.audiencelab_events.pixel_row_id IS
  'Canonical attribution (S2): FK to audiencelab_pixels.id. The pixel row''s workspace owns this event. Set by the shared ingestion resolver (S3). The raw upstream pixel_id column is diagnostic only and must not be used for attribution.';

-- S5: Backfill canonical pixel_row_id on historical audiencelab_events.
--
-- Events ingested before S3 have pixel_row_id = NULL. Attribute them
-- deterministically so verify / portal feed / dashboard stats reflect history:
--   1. exact match on the (unreliable) raw pixel_id → active pixel row, but ONLY
--      when the event's workspace agrees (or the event has no workspace);
--   2. else the event's own workspace → its single active pixel (the one-active-
--      pixel-per-workspace invariant from S2 makes this deterministic).
-- Anything else stays NULL (quarantined) — never guess across a tenant boundary.
--
-- Idempotent + resumable: both statements only touch rows still NULL. A
-- pixel_row_id can only ever be set to a pixel owned by the event's own
-- workspace, so no row receives a pixel from another workspace (dry-run: 0
-- conflicts, 96/97 attributable, 1 quarantined).

-- 1) Exact pixel_id match, workspace-agreeing.
UPDATE public.audiencelab_events e
SET pixel_row_id = p.id
FROM public.audiencelab_pixels p
WHERE e.pixel_row_id IS NULL
  AND p.is_active
  AND p.pixel_id = e.pixel_id
  AND (e.workspace_id IS NULL OR e.workspace_id = p.workspace_id);

-- 2) Fallback: the event's workspace → its single active pixel.
UPDATE public.audiencelab_events e
SET pixel_row_id = p.id
FROM public.audiencelab_pixels p
WHERE e.pixel_row_id IS NULL
  AND p.is_active
  AND e.workspace_id IS NOT NULL
  AND p.workspace_id = e.workspace_id
  AND (
    SELECT count(*) FROM public.audiencelab_pixels p2
    WHERE p2.workspace_id = e.workspace_id AND p2.is_active
  ) = 1;

-- S4: allow the canonical V4-pull install-signal source value.
--
-- The V4 pull now writes a canonical audiencelab_events install-signal row
-- (source = 'pixel_v4_pull') so pull-only buyers light up /api/pixel/verify,
-- dashboard stats, and the token-portal visitor feed. The existing source
-- CHECK only permitted ('superpixel','audiencesync','export'), which would
-- silently reject these rows. Widen it. Idempotent + additive (every prior
-- value stays valid, so existing rows can't violate the new constraint).

ALTER TABLE public.audiencelab_events
  DROP CONSTRAINT IF EXISTS audiencelab_events_source_check;

ALTER TABLE public.audiencelab_events
  ADD CONSTRAINT audiencelab_events_source_check
  CHECK (source = ANY (ARRAY[
    'superpixel'::text,
    'audiencesync'::text,
    'export'::text,
    'pixel_v4_pull'::text
  ]));

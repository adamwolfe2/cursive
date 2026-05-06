-- Onboarding Copy V3: voice profile, spintax flag, case studies, prospect signal
--
-- Adds the four fields that drive the V3 copy generation pipeline:
--   - voice_profile: replaces the generic copy_tone enum with a structured
--     voice spec (founder_direct / agency_professional / consultant_authoritative)
--   - spintax_enabled: explicit flag for whether to generate spintax variants.
--     NULL means "use AOV tier default" (high/enterprise -> false; low/mid -> true)
--   - case_studies: JSONB array of real, named case studies. The ONLY source
--     of social proof the copy engine may reference.
--   - prospect_signal_template: free-form description of what kind of
--     per-prospect signal makes a strong opener for this ICP.
--
-- All four fields are nullable / defaulted so existing rows continue to work.
-- The deriveVoiceProfile / deriveSpintaxEnabled helpers in the application
-- layer fall back to AOV tier defaults when these columns are NULL.

ALTER TABLE public.onboarding_clients
  ADD COLUMN IF NOT EXISTS voice_profile TEXT
    CHECK (voice_profile IS NULL OR voice_profile IN (
      'founder_direct',
      'agency_professional',
      'consultant_authoritative'
    )),
  ADD COLUMN IF NOT EXISTS spintax_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS case_studies JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prospect_signal_template TEXT;

-- Optional documentation comments on the new columns.
COMMENT ON COLUMN public.onboarding_clients.voice_profile IS
  'V3 copy generation: voice spec id. NULL = derive from AOV tier.';
COMMENT ON COLUMN public.onboarding_clients.spintax_enabled IS
  'V3 copy generation: explicit spintax flag. NULL = derive from AOV tier (high/enterprise -> false, low/mid -> true).';
COMMENT ON COLUMN public.onboarding_clients.case_studies IS
  'V3 copy generation: ONLY source of social proof the copy engine may reference. JSONB array of { client_name, engagement, results, is_named, url }.';
COMMENT ON COLUMN public.onboarding_clients.prospect_signal_template IS
  'V3 copy generation: 1-2 sentence pattern describing what kind of per-prospect signal makes a strong email-1 opener for this ICP.';

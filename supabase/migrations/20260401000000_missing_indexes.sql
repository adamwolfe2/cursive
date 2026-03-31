-- Missing FK indexes identified in performance audit
-- These prevent seq scans on commonly-filtered foreign key columns

CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id
  ON public.feature_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_current_step_id
  ON public.email_sequence_enrollments(current_step_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_step_id
  ON public.email_sends(step_id);

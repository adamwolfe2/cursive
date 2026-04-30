-- Per-email threaded comments for the client portal copy review step.
-- Clients leave feedback per email; admins reply and resolve — all in the portal/admin UI.
-- Access is mediated by server routes using the service role client, so RLS denies direct public access.

CREATE TABLE IF NOT EXISTS public.client_portal_copy_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.onboarding_clients(id) ON DELETE CASCADE,
  token_id uuid REFERENCES public.client_portal_tokens(id) ON DELETE SET NULL,

  -- Which email inside draft_sequences the comment is attached to.
  -- sequence_index = position in sequences[]; email_step = the stable `step` field on the email.
  sequence_index int NOT NULL CHECK (sequence_index >= 0),
  email_step int NOT NULL CHECK (email_step >= 0),

  -- Threading: NULL for a top-level comment, otherwise id of the comment being replied to.
  parent_comment_id uuid REFERENCES public.client_portal_copy_comments(id) ON DELETE CASCADE,

  -- Authorship + body
  author_type text NOT NULL CHECK (author_type IN ('client', 'admin')),
  author_name text,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),

  -- Optional quoted selection the comment anchors to (client highlights a phrase → comments).
  quoted_text text CHECK (quoted_text IS NULL OR length(quoted_text) <= 1000),

  -- Lifecycle
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_by text CHECK (resolved_by IS NULL OR resolved_by IN ('client', 'admin')),
  resolved_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copy_comments_client
  ON public.client_portal_copy_comments (client_id, sequence_index, email_step, created_at);

CREATE INDEX IF NOT EXISTS idx_copy_comments_parent
  ON public.client_portal_copy_comments (parent_comment_id);

-- RLS: lock down direct access. All reads/writes go through server routes using the service role.
ALTER TABLE public.client_portal_copy_comments ENABLE ROW LEVEL SECURITY;

-- No anon / authenticated policies — service role bypasses RLS.
-- Mirrors the access model used by client_portal_approvals.

COMMENT ON TABLE public.client_portal_copy_comments IS
  'Threaded comments left by clients (via portal token) and admins on individual emails inside draft_sequences. Keyed by (client_id, sequence_index, email_step).';

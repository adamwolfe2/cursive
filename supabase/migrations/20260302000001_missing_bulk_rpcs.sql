-- Missing Bulk RPC Functions + update_source_stats stub
-- Date: 2026-03-02
-- Context: bulk_update_lead_status, bulk_assign_leads, bulk_add_tags, bulk_remove_tags
--          were defined in local migration 20260125000003 but never applied to DB.
--          The API routes call these functions WITH p_workspace_id (for isolation),
--          so these definitions include that parameter.
--          update_source_stats is called by /api/leads/ingest but was never created.

-- ============================================================
-- bulk_update_lead_status
-- Updates the status field on multiple leads within a workspace.
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_update_lead_status(
  p_lead_ids      UUID[],
  p_new_status    TEXT,
  p_user_id       UUID,
  p_workspace_id  UUID,
  p_change_note   TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE leads
  SET    status     = p_new_status,
         updated_at = NOW()
  WHERE  id            = ANY(p_lead_ids)
    AND  workspace_id  = p_workspace_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- bulk_assign_leads
-- Assigns multiple leads to a user within a workspace.
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_assign_leads(
  p_lead_ids      UUID[],
  p_assigned_to   UUID,
  p_assigned_by   UUID,
  p_workspace_id  UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE leads
  SET    assigned_user_id = p_assigned_to,
         updated_at       = NOW()
  WHERE  id            = ANY(p_lead_ids)
    AND  workspace_id  = p_workspace_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- bulk_add_tags
-- Adds tags (via lead_tags junction) to multiple leads within a workspace.
-- Junction table: lead_tags(lead_id PK, tag_id PK)
-- Tag definitions: tags(id, workspace_id, name, ...)
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_add_tags(
  p_lead_ids      UUID[],
  p_tag_ids       UUID[],
  p_assigned_by   UUID,
  p_workspace_id  UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count    INTEGER := 0;
  v_lead_id  UUID;
  v_tag_id   UUID;
BEGIN
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    -- Only process leads that belong to the workspace
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM leads
      WHERE id = v_lead_id AND workspace_id = p_workspace_id
    );

    FOREACH v_tag_id IN ARRAY p_tag_ids
    LOOP
      INSERT INTO lead_tags (lead_id, tag_id)
      VALUES (v_lead_id, v_tag_id)
      ON CONFLICT (lead_id, tag_id) DO NOTHING;

      IF FOUND THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================================
-- bulk_remove_tags
-- Removes tags (via lead_tags junction) from multiple leads within a workspace.
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_remove_tags(
  p_lead_ids      UUID[],
  p_tag_ids       UUID[],
  p_workspace_id  UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM lead_tags lt
  USING  leads l
  WHERE  lt.lead_id       = l.id
    AND  lt.lead_id        = ANY(p_lead_ids)
    AND  lt.tag_id         = ANY(p_tag_ids)
    AND  l.workspace_id    = p_workspace_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- update_source_stats
-- Called by /api/leads/ingest to track ingestion metrics per source.
-- Stub implementation: gracefully no-ops if lead_sources is not provisioned.
-- ============================================================
CREATE OR REPLACE FUNCTION update_source_stats(
  p_source_id   UUID,
  p_received    INTEGER,
  p_matched     INTEGER,
  p_unroutable  INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- no-op stub: lead_sources table is not yet provisioned in this environment.
  -- Replace with real UPDATE when lead_sources is created.
  NULL;
END;
$$;

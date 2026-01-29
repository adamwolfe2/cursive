-- Fix RLS on manually created audit_logs partition
-- This migration ensures any audit_logs partitions have RLS enabled

-- If the partition table exists (created manually instead of via PARTITION OF),
-- we need to enable RLS and create the same policies as the parent table
DO $$
BEGIN
  -- Check if audit_logs_y2026m01 exists as a regular table
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs_y2026m01'
  ) THEN
    -- Enable RLS if not already enabled
    ALTER TABLE audit_logs_y2026m01 ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if it exists (to avoid conflicts)
    DROP POLICY IF EXISTS "Workspace admins can view audit logs" ON audit_logs_y2026m01;

    -- Create the same policy as the parent table
    CREATE POLICY "Workspace admins can view audit logs" ON audit_logs_y2026m01
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM users
          WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
      );

    RAISE NOTICE 'RLS enabled on audit_logs_y2026m01 partition table';
  END IF;
END $$;

-- Future note: If implementing proper partitioning, the parent table needs to be
-- created with PARTITION BY RANGE (created_at) and partitions will automatically
-- inherit RLS policies. The current setup appears to have a manually created table
-- instead of a proper partition.

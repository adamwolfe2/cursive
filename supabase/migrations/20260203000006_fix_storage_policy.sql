-- Fix storage RLS policy type casting issue
-- The previous policy was casting to UUID then comparing to text, causing type mismatch

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can download their delivery files" ON storage.objects;

-- Recreate with correct type casting
CREATE POLICY "Users can download their delivery files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'service-deliveries' AND
  -- Extract workspace_id from file path: workspace_id/delivery_id/filename
  (string_to_array(name, '/'))[1] IN (
    SELECT workspace_id::text FROM users
    WHERE users.auth_user_id = auth.uid()
  )
);

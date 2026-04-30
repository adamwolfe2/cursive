ALTER TABLE reply_classification_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (accessed via admin client from background jobs)
CREATE POLICY "Service role only" ON reply_classification_logs
  FOR ALL USING (auth.role() = 'service_role');

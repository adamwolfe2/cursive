-- Migration: Upload Scalability Enhancements
-- Adds progress tracking and chunk processing support for large uploads

-- Add progress tracking columns to partner_upload_batches
ALTER TABLE partner_upload_batches
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_chunk INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chunks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chunk_size INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS progress_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rows_per_second DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS estimated_completion_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_processed_row INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Add new status values (validating -> processing -> verifying -> completed)
COMMENT ON COLUMN partner_upload_batches.status IS
'Status: pending (awaiting file), uploading (file being uploaded), validating (initial validation), processing (chunk processing), verifying (email verification), completed, failed';

-- Index for finding uploads that need processing
CREATE INDEX IF NOT EXISTS idx_upload_batches_processing
ON partner_upload_batches(status, processing_started_at)
WHERE status IN ('processing', 'validating');

-- Index for stalled upload detection
CREATE INDEX IF NOT EXISTS idx_upload_batches_stalled
ON partner_upload_batches(status, last_processed_row, updated_at)
WHERE status = 'processing';

-- Function to update upload progress
CREATE OR REPLACE FUNCTION update_upload_progress(
  p_batch_id UUID,
  p_processed_rows INTEGER,
  p_valid_rows INTEGER,
  p_invalid_rows INTEGER,
  p_duplicate_rows INTEGER
) RETURNS VOID AS $$
DECLARE
  v_total_rows INTEGER;
  v_progress DECIMAL;
  v_started_at TIMESTAMPTZ;
  v_elapsed_seconds DECIMAL;
  v_rows_per_second DECIMAL;
  v_remaining_rows INTEGER;
  v_estimated_seconds DECIMAL;
BEGIN
  SELECT total_rows, processing_started_at
  INTO v_total_rows, v_started_at
  FROM partner_upload_batches
  WHERE id = p_batch_id;

  IF v_total_rows > 0 THEN
    v_progress := (p_processed_rows::DECIMAL / v_total_rows) * 100;

    -- Calculate processing rate
    IF v_started_at IS NOT NULL THEN
      v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_started_at));
      IF v_elapsed_seconds > 0 THEN
        v_rows_per_second := p_processed_rows / v_elapsed_seconds;
        v_remaining_rows := v_total_rows - p_processed_rows;
        IF v_rows_per_second > 0 THEN
          v_estimated_seconds := v_remaining_rows / v_rows_per_second;
        END IF;
      END IF;
    END IF;
  END IF;

  UPDATE partner_upload_batches
  SET
    processed_rows = p_processed_rows,
    valid_rows = p_valid_rows,
    invalid_rows = p_invalid_rows,
    duplicate_rows = p_duplicate_rows,
    progress_percent = COALESCE(v_progress, 0),
    rows_per_second = v_rows_per_second,
    last_processed_row = p_processed_rows,
    estimated_completion_at = CASE
      WHEN v_estimated_seconds IS NOT NULL
      THEN NOW() + (v_estimated_seconds || ' seconds')::INTERVAL
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect and handle stalled uploads
CREATE OR REPLACE FUNCTION detect_stalled_uploads()
RETURNS TABLE(batch_id UUID, partner_id UUID, stalled_minutes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pub.id as batch_id,
    pub.partner_id,
    EXTRACT(MINUTES FROM (NOW() - pub.updated_at))::INTEGER as stalled_minutes
  FROM partner_upload_batches pub
  WHERE pub.status = 'processing'
    AND pub.updated_at < NOW() - INTERVAL '5 minutes'
    AND pub.retry_count < pub.max_retries;
END;
$$ LANGUAGE plpgsql;

-- RLS for storage bucket (partner-uploads)
-- Note: Actual bucket creation must be done via Supabase dashboard or CLI

COMMENT ON FUNCTION update_upload_progress IS
'Updates batch progress with calculated metrics for UI display';

COMMENT ON FUNCTION detect_stalled_uploads IS
'Finds uploads that have stalled (no progress in 5 minutes) for retry';

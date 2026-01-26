-- Timezone-Aware Scheduling
-- Add timezone and scheduling enhancements for campaigns

-- Add recipient timezone tracking to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone_source VARCHAR(50); -- 'ip', 'manual', 'company', 'default'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS local_time_offset INTEGER; -- Offset from UTC in minutes

-- Add timezone to campaign_leads for per-lead scheduling
ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS recipient_timezone VARCHAR(50);
ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS optimal_send_time TIMESTAMPTZ;
ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS scheduling_metadata JSONB DEFAULT '{}';

-- Enhanced send window columns for campaigns (if not already present)
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_window_enabled BOOLEAN DEFAULT true;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS optimal_send_times JSONB DEFAULT '[]';
-- Format: [{"day": "monday", "start": "09:00", "end": "17:00", "weight": 1.0}]

-- Create function to calculate optimal send time for a lead
CREATE OR REPLACE FUNCTION calculate_optimal_send_time(
  p_campaign_id UUID,
  p_lead_timezone VARCHAR(50),
  p_from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  v_campaign RECORD;
  v_timezone VARCHAR(50);
  v_send_days TEXT[];
  v_start_time TIME;
  v_end_time TIME;
  v_local_time TIMESTAMPTZ;
  v_local_day TEXT;
  v_local_hour INTEGER;
  v_next_send TIMESTAMPTZ;
  v_days_to_add INTEGER;
  v_target_hour INTEGER;
BEGIN
  -- Get campaign settings
  SELECT
    send_window_start,
    send_window_end,
    send_timezone,
    send_days,
    send_window_enabled
  INTO v_campaign
  FROM email_campaigns
  WHERE id = p_campaign_id;

  -- Use recipient timezone if available, otherwise campaign timezone
  v_timezone := COALESCE(p_lead_timezone, v_campaign.send_timezone, 'America/New_York');

  -- Default send window
  v_start_time := COALESCE(v_campaign.send_window_start::TIME, '09:00'::TIME);
  v_end_time := COALESCE(v_campaign.send_window_end::TIME, '17:00'::TIME);
  v_send_days := COALESCE(v_campaign.send_days, ARRAY['mon', 'tue', 'wed', 'thu', 'fri']);

  -- If send window not enabled, return now
  IF NOT COALESCE(v_campaign.send_window_enabled, true) THEN
    RETURN p_from_time;
  END IF;

  -- Convert current time to recipient timezone
  v_local_time := p_from_time AT TIME ZONE v_timezone;
  v_local_day := LOWER(TO_CHAR(v_local_time, 'Dy'));
  v_local_hour := EXTRACT(HOUR FROM v_local_time);

  -- Calculate optimal send time (middle of window for better deliverability)
  v_target_hour := (EXTRACT(HOUR FROM v_start_time) + EXTRACT(HOUR FROM v_end_time)) / 2;

  -- Check if we're within the send window today
  IF v_local_day = ANY(v_send_days) AND
     v_local_time::TIME >= v_start_time AND
     v_local_time::TIME < v_end_time THEN
    -- Within window, can send now
    RETURN p_from_time;
  END IF;

  -- Find next valid send time
  v_days_to_add := 0;
  FOR i IN 0..7 LOOP
    v_local_time := (p_from_time + (i || ' days')::INTERVAL) AT TIME ZONE v_timezone;
    v_local_day := LOWER(TO_CHAR(v_local_time, 'Dy'));

    IF v_local_day = ANY(v_send_days) THEN
      -- Check if we can still send today or need to go to tomorrow
      IF i = 0 AND v_local_time::TIME < v_end_time THEN
        -- Can send later today
        IF v_local_time::TIME < v_start_time THEN
          -- Before window starts, schedule for window start
          v_next_send := DATE_TRUNC('day', v_local_time) + v_start_time;
        ELSE
          -- Within window but already passed, send soon
          v_next_send := v_local_time + INTERVAL '1 minute';
        END IF;
      ELSE
        -- Schedule for start of window on this day
        v_next_send := DATE_TRUNC('day', v_local_time) + v_start_time;
        IF i = 0 THEN
          -- If today but past window, actually go to next occurrence
          CONTINUE;
        END IF;
      END IF;

      -- Convert back to UTC
      RETURN v_next_send AT TIME ZONE v_timezone AT TIME ZONE 'UTC';
    END IF;
  END LOOP;

  -- Fallback: return now + 1 day
  RETURN p_from_time + INTERVAL '1 day';
END;
$$;

-- Function to update optimal send times for campaign leads
CREATE OR REPLACE FUNCTION update_campaign_lead_optimal_times(
  p_campaign_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  -- Update all pending/in_sequence leads with their optimal send times
  WITH updated AS (
    UPDATE campaign_leads cl
    SET
      optimal_send_time = calculate_optimal_send_time(
        p_campaign_id,
        COALESCE(cl.recipient_timezone, l.timezone),
        NOW()
      ),
      recipient_timezone = COALESCE(cl.recipient_timezone, l.timezone),
      scheduling_metadata = jsonb_build_object(
        'calculated_at', NOW(),
        'timezone_source', CASE
          WHEN cl.recipient_timezone IS NOT NULL THEN 'campaign_lead'
          WHEN l.timezone IS NOT NULL THEN 'lead'
          ELSE 'default'
        END
      )
    FROM leads l
    WHERE cl.lead_id = l.id
      AND cl.campaign_id = p_campaign_id
      AND cl.status IN ('pending', 'ready', 'in_sequence')
    RETURNING cl.id
  )
  SELECT COUNT(*) INTO v_updated FROM updated;

  RETURN v_updated;
END;
$$;

-- Function to get leads ready for send based on their optimal times
CREATE OR REPLACE FUNCTION get_leads_ready_for_send(
  p_campaign_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  campaign_lead_id UUID,
  lead_id UUID,
  recipient_timezone VARCHAR(50),
  optimal_send_time TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id AS campaign_lead_id,
    cl.lead_id,
    COALESCE(cl.recipient_timezone, l.timezone, 'America/New_York') AS recipient_timezone,
    cl.optimal_send_time
  FROM campaign_leads cl
  JOIN leads l ON l.id = cl.lead_id
  WHERE cl.campaign_id = p_campaign_id
    AND cl.status IN ('ready', 'in_sequence')
    AND (
      cl.optimal_send_time IS NULL
      OR cl.optimal_send_time <= NOW()
    )
    AND (
      cl.next_email_scheduled_at IS NULL
      OR cl.next_email_scheduled_at <= NOW()
    )
  ORDER BY
    cl.optimal_send_time ASC NULLS FIRST,
    cl.created_at ASC
  LIMIT p_limit;
END;
$$;

-- Create index for timezone queries
CREATE INDEX IF NOT EXISTS idx_leads_timezone ON leads(timezone) WHERE timezone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_leads_optimal_send ON campaign_leads(campaign_id, optimal_send_time)
  WHERE status IN ('pending', 'ready', 'in_sequence');

-- Comments
COMMENT ON COLUMN leads.timezone IS 'IANA timezone identifier for the lead';
COMMENT ON COLUMN leads.timezone_source IS 'How the timezone was determined: ip, manual, company, default';
COMMENT ON COLUMN campaign_leads.optimal_send_time IS 'Calculated optimal time to send based on recipient timezone';
COMMENT ON FUNCTION calculate_optimal_send_time IS 'Calculates the optimal send time for a lead based on campaign windows and recipient timezone';

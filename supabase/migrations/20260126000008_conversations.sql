-- Reply Threading & Conversation View
-- Groups email exchanges into conversations for better tracking

-- Conversation threads table
CREATE TABLE IF NOT EXISTS email_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE SET NULL,

  -- Thread identification
  thread_id VARCHAR(255), -- Email thread ID from headers
  subject_normalized VARCHAR(500), -- Normalized subject (without Re:/Fwd:)

  -- Conversation status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'waiting_reply', 'replied', 'closed', 'archived')),

  -- Latest activity
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_direction VARCHAR(10) CHECK (last_message_direction IN ('outbound', 'inbound')),
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,

  -- Classification (from AI)
  sentiment VARCHAR(50), -- positive, neutral, negative, interested, objection
  intent VARCHAR(50), -- interested, meeting_request, unsubscribe, question, etc.
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to UUID, -- User ID if conversation is assigned

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation messages (unified view of sent and received)
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES email_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Message details
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  email_send_id UUID REFERENCES email_sends(id) ON DELETE SET NULL, -- For outbound
  reply_id UUID, -- For inbound (references campaign_replies if exists)

  -- Content
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(500),
  body_text TEXT,
  body_html TEXT,
  snippet VARCHAR(500), -- First 500 chars for preview

  -- Email headers
  message_id VARCHAR(255), -- Email Message-ID header
  in_reply_to VARCHAR(255), -- In-Reply-To header
  references_header TEXT, -- References header

  -- Tracking
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Classification (for inbound)
  classification JSONB DEFAULT '{}',
  is_auto_reply BOOLEAN DEFAULT false,
  is_out_of_office BOOLEAN DEFAULT false,

  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add conversation tracking to email_sends
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES email_conversations(id);
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS message_id_header VARCHAR(255);
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS in_reply_to_header VARCHAR(255);

-- Enable RLS
ALTER TABLE email_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace isolation for conversations" ON email_conversations
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Workspace isolation for messages" ON conversation_messages
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Function to normalize email subject
CREATE OR REPLACE FUNCTION normalize_subject(p_subject TEXT)
RETURNS VARCHAR(500)
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  IF p_subject IS NULL THEN
    RETURN NULL;
  END IF;

  v_normalized := p_subject;

  -- Remove common prefixes
  v_normalized := REGEXP_REPLACE(v_normalized, '^(Re|RE|Fwd|FWD|Fw|FW|AW|Antwort|SV|VS):\s*', '', 'gi');
  v_normalized := REGEXP_REPLACE(v_normalized, '^\s+', ''); -- Trim leading whitespace

  -- Repeat for nested replies (Re: Re: Re:)
  WHILE v_normalized ~ '^(Re|RE|Fwd|FWD|Fw|FW|AW|Antwort|SV|VS):' LOOP
    v_normalized := REGEXP_REPLACE(v_normalized, '^(Re|RE|Fwd|FWD|Fw|FW|AW|Antwort|SV|VS):\s*', '', 'gi');
    v_normalized := REGEXP_REPLACE(v_normalized, '^\s+', '');
  END LOOP;

  RETURN LEFT(v_normalized, 500);
END;
$$;

-- Function to find or create a conversation for an email
CREATE OR REPLACE FUNCTION find_or_create_conversation(
  p_workspace_id UUID,
  p_lead_id UUID,
  p_campaign_id UUID,
  p_campaign_lead_id UUID,
  p_subject TEXT,
  p_thread_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
  v_normalized_subject VARCHAR(500);
BEGIN
  v_normalized_subject := normalize_subject(p_subject);

  -- Try to find existing conversation by thread_id first
  IF p_thread_id IS NOT NULL THEN
    SELECT id INTO v_conversation_id
    FROM email_conversations
    WHERE workspace_id = p_workspace_id
      AND thread_id = p_thread_id
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      RETURN v_conversation_id;
    END IF;
  END IF;

  -- Try to find by lead and normalized subject
  SELECT id INTO v_conversation_id
  FROM email_conversations
  WHERE workspace_id = p_workspace_id
    AND lead_id = p_lead_id
    AND subject_normalized = v_normalized_subject
    AND status != 'archived'
  ORDER BY last_message_at DESC
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO email_conversations (
    workspace_id,
    campaign_id,
    lead_id,
    campaign_lead_id,
    thread_id,
    subject_normalized,
    status,
    message_count
  ) VALUES (
    p_workspace_id,
    p_campaign_id,
    p_lead_id,
    p_campaign_lead_id,
    p_thread_id,
    v_normalized_subject,
    'active',
    0
  )
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$;

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION add_conversation_message(
  p_conversation_id UUID,
  p_workspace_id UUID,
  p_direction VARCHAR(10),
  p_from_email VARCHAR(255),
  p_to_email VARCHAR(255),
  p_subject VARCHAR(500),
  p_body_text TEXT,
  p_body_html TEXT,
  p_message_id VARCHAR(255) DEFAULT NULL,
  p_email_send_id UUID DEFAULT NULL,
  p_reply_id UUID DEFAULT NULL,
  p_sent_at TIMESTAMPTZ DEFAULT NULL,
  p_received_at TIMESTAMPTZ DEFAULT NULL,
  p_from_name VARCHAR(255) DEFAULT NULL,
  p_to_name VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_message_id UUID;
  v_snippet VARCHAR(500);
  v_message_time TIMESTAMPTZ;
BEGIN
  -- Create snippet from body
  v_snippet := LEFT(
    REGEXP_REPLACE(COALESCE(p_body_text, p_body_html), '<[^>]+>', '', 'g'),
    500
  );

  -- Determine message time
  v_message_time := COALESCE(p_sent_at, p_received_at, NOW());

  -- Insert message
  INSERT INTO conversation_messages (
    conversation_id,
    workspace_id,
    direction,
    email_send_id,
    reply_id,
    from_email,
    from_name,
    to_email,
    to_name,
    subject,
    body_text,
    body_html,
    snippet,
    message_id,
    sent_at,
    received_at,
    is_read
  ) VALUES (
    p_conversation_id,
    p_workspace_id,
    p_direction,
    p_email_send_id,
    p_reply_id,
    p_from_email,
    p_from_name,
    p_to_email,
    p_to_name,
    p_subject,
    p_body_text,
    p_body_html,
    v_snippet,
    p_message_id,
    p_sent_at,
    p_received_at,
    p_direction = 'outbound' -- Outbound messages are read by default
  )
  RETURNING id INTO v_message_id;

  -- Update conversation stats
  UPDATE email_conversations
  SET
    message_count = message_count + 1,
    last_message_at = v_message_time,
    last_message_direction = p_direction,
    unread_count = CASE
      WHEN p_direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END,
    status = CASE
      WHEN p_direction = 'inbound' THEN 'replied'
      WHEN p_direction = 'outbound' THEN 'waiting_reply'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;

-- Function to mark conversation messages as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE conversation_messages
  SET is_read = true, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND is_read = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Reset unread count
  UPDATE email_conversations
  SET unread_count = 0, updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_updated;
END;
$$;

-- Trigger to update conversation when email is sent
CREATE OR REPLACE FUNCTION update_conversation_on_send()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
  v_lead_id UUID;
  v_campaign_lead_id UUID;
BEGIN
  -- Only process when status changes to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    -- Get lead info
    v_lead_id := NEW.lead_id;

    -- Get campaign_lead_id if this is a campaign email
    IF NEW.campaign_id IS NOT NULL THEN
      SELECT id INTO v_campaign_lead_id
      FROM campaign_leads
      WHERE campaign_id = NEW.campaign_id AND lead_id = NEW.lead_id
      LIMIT 1;
    END IF;

    -- Find or create conversation
    v_conversation_id := find_or_create_conversation(
      NEW.workspace_id,
      v_lead_id,
      NEW.campaign_id,
      v_campaign_lead_id,
      NEW.subject,
      NULL -- No thread_id for first message
    );

    -- Update email_send with conversation
    NEW.conversation_id := v_conversation_id;

    -- Add message to conversation
    PERFORM add_conversation_message(
      v_conversation_id,
      NEW.workspace_id,
      'outbound',
      'noreply@example.com', -- Should be sender email
      NEW.recipient_email,
      NEW.subject,
      NEW.body_text,
      NEW.body_html,
      NEW.message_id_header,
      NEW.id,
      NULL,
      NEW.sent_at,
      NULL,
      NULL,
      NEW.recipient_name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_conversation_on_send ON email_sends;
CREATE TRIGGER trg_update_conversation_on_send
  BEFORE UPDATE ON email_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_send();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON email_conversations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON email_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_campaign_lead ON email_conversations(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON email_conversations(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_unread ON conversation_messages(conversation_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_email_sends_conversation ON email_sends(conversation_id) WHERE conversation_id IS NOT NULL;

-- Comments
COMMENT ON TABLE email_conversations IS 'Groups email exchanges with leads into conversation threads';
COMMENT ON TABLE conversation_messages IS 'Individual messages within a conversation';
COMMENT ON FUNCTION find_or_create_conversation IS 'Finds existing or creates new conversation for an email exchange';
COMMENT ON FUNCTION add_conversation_message IS 'Adds a message to a conversation and updates stats';

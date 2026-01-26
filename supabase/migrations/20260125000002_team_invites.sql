-- Phase 42: Team Invites System
-- Adds team invite functionality for workspace member management

-- ============================================================================
-- TEAM INVITES TABLE
-- ============================================================================
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Invite details
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',

  -- Who sent the invite
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Invite token (for email link)
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Status tracking
  status invite_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'member'))
);

-- Indexes for team_invites
CREATE INDEX idx_team_invites_workspace_id ON team_invites(workspace_id);
CREATE INDEX idx_team_invites_email ON team_invites(email);
CREATE INDEX idx_team_invites_token ON team_invites(token);
CREATE INDEX idx_team_invites_status ON team_invites(status);
CREATE INDEX idx_team_invites_expires_at ON team_invites(expires_at) WHERE status = 'pending';

-- Unique constraint: one pending invite per email per workspace
CREATE UNIQUE INDEX idx_unique_pending_invite ON team_invites(workspace_id, email)
  WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Admins and owners can view invites in their workspace
CREATE POLICY "Workspace admins can view invites" ON team_invites
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Admins and owners can create invites
CREATE POLICY "Workspace admins can create invites" ON team_invites
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Admins and owners can cancel invites
CREATE POLICY "Workspace admins can update invites" ON team_invites
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Allow service role to update invites (for accepting via token)
CREATE POLICY "Service role can manage invites" ON team_invites
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create an invite
CREATE OR REPLACE FUNCTION create_team_invite(
  p_workspace_id UUID,
  p_email TEXT,
  p_role user_role,
  p_invited_by UUID
)
RETURNS team_invites AS $$
DECLARE
  v_invite team_invites;
BEGIN
  -- Check if user already exists in workspace
  IF EXISTS (
    SELECT 1 FROM users
    WHERE workspace_id = p_workspace_id AND email = p_email
  ) THEN
    RAISE EXCEPTION 'User already exists in this workspace';
  END IF;

  -- Check if there's already a pending invite
  UPDATE team_invites
  SET status = 'cancelled'
  WHERE workspace_id = p_workspace_id
    AND email = p_email
    AND status = 'pending';

  -- Create new invite
  INSERT INTO team_invites (workspace_id, email, role, invited_by)
  VALUES (p_workspace_id, p_email, p_role, p_invited_by)
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invite
CREATE OR REPLACE FUNCTION accept_team_invite(
  p_token TEXT,
  p_auth_user_id UUID
)
RETURNS users AS $$
DECLARE
  v_invite team_invites;
  v_user users;
  v_auth_email TEXT;
BEGIN
  -- Get invite
  SELECT * INTO v_invite
  FROM team_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  -- Get auth user email
  SELECT email INTO v_auth_email
  FROM auth.users
  WHERE id = p_auth_user_id;

  IF v_auth_email != v_invite.email THEN
    RAISE EXCEPTION 'Email mismatch. Please sign in with the invited email address.';
  END IF;

  -- Check if user already exists
  SELECT * INTO v_user
  FROM users
  WHERE auth_user_id = p_auth_user_id;

  IF FOUND THEN
    -- User exists, update their workspace
    UPDATE users
    SET workspace_id = v_invite.workspace_id,
        role = v_invite.role
    WHERE id = v_user.id
    RETURNING * INTO v_user;
  ELSE
    -- Create new user
    INSERT INTO users (auth_user_id, workspace_id, email, role)
    VALUES (p_auth_user_id, v_invite.workspace_id, v_invite.email, v_invite.role)
    RETURNING * INTO v_user;
  END IF;

  -- Mark invite as accepted
  UPDATE team_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invite.id;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invites (run daily)
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE team_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id UUID,
  p_new_role user_role,
  p_updated_by UUID
)
RETURNS users AS $$
DECLARE
  v_user users;
  v_updater users;
BEGIN
  -- Get the updater
  SELECT * INTO v_updater FROM users WHERE id = p_updated_by;

  IF NOT FOUND OR v_updater.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Get target user
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check same workspace
  IF v_user.workspace_id != v_updater.workspace_id THEN
    RAISE EXCEPTION 'User not in your workspace';
  END IF;

  -- Cannot change owner role
  IF v_user.role = 'owner' THEN
    RAISE EXCEPTION 'Cannot change owner role';
  END IF;

  -- Only owner can promote to admin
  IF p_new_role = 'admin' AND v_updater.role != 'owner' THEN
    RAISE EXCEPTION 'Only owners can promote to admin';
  END IF;

  -- Update role
  UPDATE users
  SET role = p_new_role
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove user from workspace
CREATE OR REPLACE FUNCTION remove_user_from_workspace(
  p_user_id UUID,
  p_removed_by UUID
)
RETURNS void AS $$
DECLARE
  v_user users;
  v_remover users;
BEGIN
  -- Get the remover
  SELECT * INTO v_remover FROM users WHERE id = p_removed_by;

  IF NOT FOUND OR v_remover.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Get target user
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check same workspace
  IF v_user.workspace_id != v_remover.workspace_id THEN
    RAISE EXCEPTION 'User not in your workspace';
  END IF;

  -- Cannot remove owner
  IF v_user.role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove workspace owner';
  END IF;

  -- Cannot remove self
  IF v_user.id = v_remover.id THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  -- Admins can only remove members
  IF v_remover.role = 'admin' AND v_user.role = 'admin' THEN
    RAISE EXCEPTION 'Admins cannot remove other admins';
  END IF;

  -- Delete user
  DELETE FROM users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE team_invites IS 'Pending team member invitations';
COMMENT ON FUNCTION create_team_invite IS 'Creates a new team invite with automatic token generation';
COMMENT ON FUNCTION accept_team_invite IS 'Accepts an invite using token and creates/updates user';
COMMENT ON FUNCTION update_user_role IS 'Updates user role with permission checks';
COMMENT ON FUNCTION remove_user_from_workspace IS 'Removes a user from workspace with permission checks';

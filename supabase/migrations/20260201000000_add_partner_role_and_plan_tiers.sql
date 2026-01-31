-- Add partner role and plan tiers (starter, enterprise)
-- Date: 2026-02-01

-- Add 'partner' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'partner';

-- Add 'starter' and 'enterprise' to user_plan enum
ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'enterprise';

-- Add comment to users table documenting roles
COMMENT ON COLUMN users.role IS 'User role: owner (platform owner), admin (workspace admin), partner (lead provider), member (regular user)';

-- Add comment to users table documenting plans
COMMENT ON COLUMN users.plan IS 'Subscription plan: free, starter, pro, enterprise';

-- Create helper function to check if user has admin role (owner or admin)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = user_id
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user has partner role and is approved
CREATE OR REPLACE FUNCTION is_approved_partner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN partners p ON u.email = p.email
    WHERE u.auth_user_id = user_id
    AND u.role = 'partner'
    AND p.status = 'active'
    AND p.is_active = true
    AND p.stripe_onboarding_complete = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

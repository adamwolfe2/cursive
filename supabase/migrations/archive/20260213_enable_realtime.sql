/**
 * Enable Supabase Realtime
 * Allow real-time subscriptions to table changes
 */

-- Enable Realtime for leads table
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- Enable Realtime for marketplace_purchases table
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_purchases;

-- Enable Realtime for audiencelab_events table
ALTER PUBLICATION supabase_realtime ADD TABLE audiencelab_events;

-- Enable Realtime for credit_usage table (for live credit balance updates)
ALTER PUBLICATION supabase_realtime ADD TABLE credit_usage;

-- Note: RLS policies already exist on these tables
-- Realtime will respect RLS policies automatically
-- Users can only subscribe to changes in their own workspace

COMMENT ON TABLE leads IS 'Real-time enabled for workspace lead updates';
COMMENT ON TABLE marketplace_purchases IS 'Real-time enabled for purchase notifications';
COMMENT ON TABLE audiencelab_events IS 'Real-time enabled for pixel tracking events';
COMMENT ON TABLE credit_usage IS 'Real-time enabled for credit balance updates';

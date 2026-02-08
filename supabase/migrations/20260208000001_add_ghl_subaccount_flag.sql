-- Add ghl_subaccount flag to platform_features for DFY tiers
-- This flag gates GHL sub-account creation in the Stripe webhook handler

UPDATE service_tiers
SET platform_features = platform_features || '{"ghl_subaccount": true}'::jsonb
WHERE slug IN ('cursive-outbound', 'cursive-pipeline', 'cursive-venture-studio');

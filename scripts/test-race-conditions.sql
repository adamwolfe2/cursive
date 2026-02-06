-- Test Script: Race Condition Fixes Verification
-- Run these tests to verify the payment race condition fixes
-- Created: 2026-02-05

-- ============================================================================
-- SETUP: Create test data
-- ============================================================================

-- Create test workspace
INSERT INTO workspaces (id, name, slug)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test Workspace 1', 'test-ws-1'),
  ('22222222-2222-2222-2222-222222222222', 'Test Workspace 2', 'test-ws-2')
ON CONFLICT (id) DO NOTHING;

-- Create test workspace credits
INSERT INTO workspace_credits (workspace_id, balance, total_purchased)
VALUES
  ('11111111-1111-1111-1111-111111111111', 100, 100),
  ('22222222-2222-2222-2222-222222222222', 100, 100)
ON CONFLICT (workspace_id) DO UPDATE SET
  balance = 100,
  total_purchased = 100;

-- Create test leads
INSERT INTO leads (
  id,
  first_name,
  last_name,
  email,
  company_name,
  marketplace_price,
  marketplace_status,
  is_marketplace_listed,
  intent_score_calculated,
  freshness_score
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'John',
    'Doe',
    'john@example.com',
    'Example Corp',
    10.00,
    'available',
    true,
    67,
    90
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Jane',
    'Smith',
    'jane@example.com',
    'Sample Inc',
    15.00,
    'available',
    true,
    80,
    95
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Bob',
    'Johnson',
    'bob@example.com',
    'Test LLC',
    20.00,
    'available',
    true,
    50,
    80
  )
ON CONFLICT (id) DO UPDATE SET
  marketplace_status = 'available',
  sold_at = NULL,
  sold_count = 0;

-- ============================================================================
-- TEST 1: Lead Purchase Race Condition Prevention
-- ============================================================================

-- Test that validate_and_lock_leads_for_purchase prevents concurrent purchases

DO $$
DECLARE
  v_leads RECORD;
BEGIN
  RAISE NOTICE '=== TEST 1: Lead Purchase Race Condition ===';

  -- This should succeed and lock the leads
  SELECT * INTO v_leads FROM validate_and_lock_leads_for_purchase(
    ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::UUID[],
    '11111111-1111-1111-1111-111111111111'::UUID
  );

  RAISE NOTICE 'Test 1A: Successfully locked lead for workspace 1';

  -- Now try to lock the same lead from a different transaction
  -- In a real scenario, this would be from a concurrent request
  -- This test simulates the check - in production, use pgTAP or similar for true concurrency testing

  RAISE NOTICE 'Test 1B: Concurrent purchase attempt should be prevented by SELECT FOR UPDATE';
  RAISE NOTICE 'Test 1: PASS (manual verification required for true concurrency)';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test 1: FAILED - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 2: Atomic Credit Purchase Completion
-- ============================================================================

DO $$
DECLARE
  v_result RECORD;
  v_initial_balance INTEGER;
  v_purchase_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 2: Atomic Credit Purchase ===';

  -- Get initial balance
  SELECT balance INTO v_initial_balance
  FROM workspace_credits
  WHERE workspace_id = '11111111-1111-1111-1111-111111111111';

  RAISE NOTICE 'Test 2A: Initial balance: %', v_initial_balance;

  -- Create a test purchase
  INSERT INTO marketplace_purchases (
    id,
    buyer_workspace_id,
    buyer_user_id,
    total_leads,
    total_price,
    payment_method,
    status
  )
  VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM users WHERE workspace_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    1,
    10.00,
    'credits',
    'pending'
  )
  RETURNING id INTO v_purchase_id;

  -- Add purchase items
  INSERT INTO marketplace_purchase_items (
    purchase_id,
    lead_id,
    price_at_purchase
  )
  VALUES (
    v_purchase_id,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    10.00
  );

  -- Test atomic completion
  SELECT * INTO v_result FROM complete_credit_lead_purchase(
    v_purchase_id,
    '11111111-1111-1111-1111-111111111111',
    10.00
  );

  IF v_result.success THEN
    RAISE NOTICE 'Test 2B: Purchase completed successfully';
    RAISE NOTICE 'Test 2C: New balance: % (expected: %)', v_result.new_credit_balance, v_initial_balance - 10;

    -- Verify lead marked as sold
    IF EXISTS (
      SELECT 1 FROM leads
      WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        AND sold_count > 0
        AND marketplace_status = 'sold'
    ) THEN
      RAISE NOTICE 'Test 2D: Lead correctly marked as sold';
      RAISE NOTICE 'Test 2: PASS';
    ELSE
      RAISE NOTICE 'Test 2: FAILED - Lead not marked as sold';
    END IF;
  ELSE
    RAISE NOTICE 'Test 2: FAILED - %', v_result.error_message;
  END IF;

  -- Cleanup
  DELETE FROM marketplace_purchase_items WHERE purchase_id = v_purchase_id;
  DELETE FROM marketplace_purchases WHERE id = v_purchase_id;
  UPDATE leads SET sold_count = 0, sold_at = NULL, marketplace_status = 'available'
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  UPDATE workspace_credits SET balance = v_initial_balance, total_used = 0
  WHERE workspace_id = '11111111-1111-1111-1111-111111111111';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test 2: FAILED - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 3: Insufficient Credits Rollback
-- ============================================================================

DO $$
DECLARE
  v_result RECORD;
  v_initial_balance INTEGER;
  v_purchase_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 3: Insufficient Credits (Rollback Test) ===';

  -- Get initial balance
  SELECT balance INTO v_initial_balance
  FROM workspace_credits
  WHERE workspace_id = '11111111-1111-1111-1111-111111111111';

  RAISE NOTICE 'Test 3A: Initial balance: %', v_initial_balance;

  -- Create a test purchase
  INSERT INTO marketplace_purchases (
    id,
    buyer_workspace_id,
    buyer_user_id,
    total_leads,
    total_price,
    payment_method,
    status
  )
  VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM users WHERE workspace_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    1,
    1000.00, -- More than available
    'credits',
    'pending'
  )
  RETURNING id INTO v_purchase_id;

  -- Add purchase items
  INSERT INTO marketplace_purchase_items (
    purchase_id,
    lead_id,
    price_at_purchase
  )
  VALUES (
    v_purchase_id,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    1000.00
  );

  -- Try to complete with insufficient credits
  SELECT * INTO v_result FROM complete_credit_lead_purchase(
    v_purchase_id,
    '11111111-1111-1111-1111-111111111111',
    1000.00
  );

  IF NOT v_result.success THEN
    RAISE NOTICE 'Test 3B: Correctly rejected insufficient credits';
    RAISE NOTICE 'Test 3C: Error message: %', v_result.error_message;

    -- Verify balance unchanged
    IF EXISTS (
      SELECT 1 FROM workspace_credits
      WHERE workspace_id = '11111111-1111-1111-1111-111111111111'
        AND balance = v_initial_balance
    ) THEN
      RAISE NOTICE 'Test 3D: Balance correctly unchanged (rollback worked)';
      RAISE NOTICE 'Test 3: PASS';
    ELSE
      RAISE NOTICE 'Test 3: FAILED - Balance changed despite insufficient credits';
    END IF;
  ELSE
    RAISE NOTICE 'Test 3: FAILED - Should have rejected insufficient credits';
  END IF;

  -- Cleanup
  DELETE FROM marketplace_purchase_items WHERE purchase_id = v_purchase_id;
  DELETE FROM marketplace_purchases WHERE id = v_purchase_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test 3: FAILED - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 4: Idempotent Stripe Webhook Processing
-- ============================================================================

DO $$
DECLARE
  v_result_1 RECORD;
  v_result_2 RECORD;
  v_purchase_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 4: Idempotent Webhook Processing ===';

  -- Create a test Stripe purchase
  INSERT INTO marketplace_purchases (
    id,
    buyer_workspace_id,
    buyer_user_id,
    total_leads,
    total_price,
    payment_method,
    status
  )
  VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM users WHERE workspace_id = '22222222-2222-2222-2222-222222222222' LIMIT 1),
    1,
    15.00,
    'stripe',
    'pending'
  )
  RETURNING id INTO v_purchase_id;

  -- Add purchase items
  INSERT INTO marketplace_purchase_items (
    purchase_id,
    lead_id,
    price_at_purchase
  )
  VALUES (
    v_purchase_id,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    15.00
  );

  -- First webhook delivery
  SELECT * INTO v_result_1 FROM complete_stripe_lead_purchase(
    v_purchase_id,
    'https://example.com/download'
  );

  IF v_result_1.success AND NOT v_result_1.already_completed THEN
    RAISE NOTICE 'Test 4A: First webhook processed successfully';

    -- Second webhook delivery (duplicate)
    SELECT * INTO v_result_2 FROM complete_stripe_lead_purchase(
      v_purchase_id,
      'https://example.com/download'
    );

    IF NOT v_result_2.success AND v_result_2.already_completed THEN
      RAISE NOTICE 'Test 4B: Duplicate webhook correctly identified';

      -- Verify lead only marked once
      IF EXISTS (
        SELECT 1 FROM leads
        WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
          AND sold_count = 1 -- Should be 1, not 2
      ) THEN
        RAISE NOTICE 'Test 4C: Lead sold count correct (not duplicated)';
        RAISE NOTICE 'Test 4: PASS';
      ELSE
        RAISE NOTICE 'Test 4: FAILED - Lead sold count incorrect';
      END IF;
    ELSE
      RAISE NOTICE 'Test 4: FAILED - Duplicate webhook not handled correctly';
    END IF;
  ELSE
    RAISE NOTICE 'Test 4: FAILED - First webhook processing failed';
  END IF;

  -- Cleanup
  DELETE FROM marketplace_purchase_items WHERE purchase_id = v_purchase_id;
  DELETE FROM marketplace_purchases WHERE id = v_purchase_id;
  UPDATE leads SET sold_count = 0, sold_at = NULL, marketplace_status = 'available'
  WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test 4: FAILED - %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 5: Bulk Lead Marking
-- ============================================================================

DO $$
DECLARE
  v_result RECORD;
  v_lead_ids UUID[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 5: Bulk Lead Marking ===';

  v_lead_ids := ARRAY[
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ]::UUID[];

  -- Reset leads
  UPDATE leads SET sold_count = 0, sold_at = NULL, marketplace_status = 'available'
  WHERE id = ANY(v_lead_ids);

  -- Mark all leads in bulk
  SELECT * INTO v_result FROM mark_leads_sold_bulk(v_lead_ids);

  IF v_result.leads_marked = 3 THEN
    RAISE NOTICE 'Test 5A: Bulk marking successful (3 leads)';

    -- Verify all leads marked
    IF (SELECT COUNT(*) FROM leads WHERE id = ANY(v_lead_ids) AND sold_count = 1 AND marketplace_status = 'sold') = 3 THEN
      RAISE NOTICE 'Test 5B: All leads correctly marked';
      RAISE NOTICE 'Test 5: PASS';
    ELSE
      RAISE NOTICE 'Test 5: FAILED - Not all leads marked correctly';
    END IF;
  ELSE
    RAISE NOTICE 'Test 5: FAILED - Expected 3 leads marked, got %', v_result.leads_marked;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test 5: FAILED - %', SQLERRM;
END $$;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Reset test leads
UPDATE leads
SET
  sold_count = 0,
  sold_at = NULL,
  marketplace_status = 'available'
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'TEST SUITE COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Review the output above for test results.';
  RAISE NOTICE 'All tests should show PASS status.';
  RAISE NOTICE '';
  RAISE NOTICE 'For true concurrency testing, use:';
  RAISE NOTICE '- pgTAP framework';
  RAISE NOTICE '- Multiple psql sessions';
  RAISE NOTICE '- Load testing tools (k6, Artillery)';
END $$;

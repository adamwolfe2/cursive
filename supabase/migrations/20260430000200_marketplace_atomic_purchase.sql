-- ============================================================================
-- purchase_marketplace_leads — atomic wrapper
-- ----------------------------------------------------------------------------
-- Wraps createPurchase + addPurchaseItems + markLeadsSold into a single
-- Postgres transaction so partial failures cannot leave orphaned purchase rows.
--
-- The credit-path already uses complete_credit_lead_purchase (atomic).
-- The Stripe-path already uses complete_stripe_lead_purchase (atomic webhook).
-- This function provides an alternative entrypoint for code paths that build
-- the purchase in three separate JS calls and need transaction safety.
-- ============================================================================

create or replace function purchase_marketplace_leads(
  p_buyer_workspace_id  uuid,
  p_buyer_user_id       uuid,
  p_lead_ids            uuid[],
  p_total_price_cents   int,         -- stored as cents (price * 100)
  p_payment_method      text,        -- 'credits' | 'stripe' | 'mixed'
  p_credits_used        int   default 0,
  p_card_amount         int   default 0,
  p_stripe_payment_intent_id     text default null,
  p_stripe_checkout_session_id   text default null,
  p_filters_used        jsonb default null
) returns table (
  purchase_id  uuid,
  lead_count   int
) language plpgsql security definer set search_path = public as $$
declare
  v_purchase_id  uuid;
  v_lead_count   int := array_length(p_lead_ids, 1);
begin
  -- 1. Insert purchase row
  insert into marketplace_purchases (
    buyer_workspace_id,
    buyer_user_id,
    total_leads,
    total_price,
    payment_method,
    credits_used,
    card_amount,
    stripe_payment_intent_id,
    stripe_checkout_session_id,
    filters_used,
    status
  ) values (
    p_buyer_workspace_id,
    p_buyer_user_id,
    v_lead_count,
    p_total_price_cents::numeric / 100.0,
    p_payment_method,
    p_credits_used,
    p_card_amount,
    p_stripe_payment_intent_id,
    p_stripe_checkout_session_id,
    p_filters_used,
    'pending'
  )
  returning id into v_purchase_id;

  -- 2. Insert purchase items (one row per lead)
  insert into marketplace_purchase_items (
    purchase_id,
    lead_id,
    price_at_purchase
  )
  select
    v_purchase_id,
    unnest(p_lead_ids),
    p_total_price_cents::numeric / 100.0 / v_lead_count;

  -- 3. Mark leads as sold
  update leads
  set
    sold_count        = sold_count + 1,
    first_sold_at     = coalesce(first_sold_at, now()),
    sold_at           = now(),
    marketplace_status = 'sold'
  where id = any(p_lead_ids);

  return query select v_purchase_id, v_lead_count;
end;
$$;

-- Service role only — called from API routes using the admin client.
revoke execute on function purchase_marketplace_leads(
  uuid, uuid, uuid[], int, text, int, int, text, text, jsonb
) from public;
grant execute on function purchase_marketplace_leads(
  uuid, uuid, uuid[], int, text, int, int, text, text, jsonb
) to service_role;

comment on function purchase_marketplace_leads is
  'Atomic: insert purchase + items + mark leads sold in one transaction. '
  'Use instead of the three-step JS approach (createPurchase, addPurchaseItems, markLeadsSold).';

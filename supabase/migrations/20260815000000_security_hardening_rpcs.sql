-- Security hardening for two SECURITY DEFINER RPCs flagged in the 2026-08 audit.
--
-- 1) increment_credits(user_id uuid, amount integer)
--    Original definition (20260122000007_rate_limiting_credits.sql) is SECURITY
--    DEFINER, GRANTed to `authenticated`, and applies a *signed* delta to
--    users.daily_credits_used with no caller binding and no sign check. Any
--    signed-in user could call it directly through PostgREST with a negative
--    amount to drive their own usage negative (=> effectively unlimited credits),
--    or with a positive amount + another user's id to grief that user's quota.
--
--    The legitimate caller (CreditService.consumeCredits) invokes it through the
--    RLS-scoped client (role `authenticated`), so we CANNOT revoke the grant.
--    Instead we make the function safe by construction:
--      * reject non-positive amounts (kills the "negative => unlimited" bypass), and
--      * bind the update to the calling identity when one is present
--        (auth.uid()); service-role callers (auth.uid() IS NULL) are unaffected.
--
-- 2) execute_nl_query(query_sql text)
--    Original definition (20260409000001_intelligence_layer_columns.sql) is
--    SECURITY DEFINER and EXECUTEs arbitrary caller-influenced SQL. Its guards
--    (SELECT-only, keyword blocklist, "must contain the substring workspace_id")
--    are trivially bypassed — e.g. `SELECT ... FROM auth.users WHERE
--    'workspace_id' IS NOT NULL` satisfies all three and reads the auth schema
--    (password hashes) and every tenant's rows because SECURITY DEFINER + the
--    service-role caller bypass RLS. The query is LLM-authored, so this is a
--    prompt-injection-reachable full-database read.
--
--    Fixes here (defense in depth, behavior-preserving for legitimate
--    single-table workspace SELECTs):
--      * revoke EXECUTE from anon/authenticated/PUBLIC (only the service-role
--        code path in nl-query.service.ts is a legitimate caller), and
--      * block statement stacking, comments, string-literal `'workspace_id'`
--        bypass, and any reference to sensitive schemas/objects
--        (auth., pg_, information_schema, storage., vault., secrets).
--    NOTE: the durable fix is to stop executing model-authored SQL entirely
--    (translate a constrained filter DSL server-side) and/or run this through
--    the RLS-scoped client. Tracked in SECURITY_AUDIT.md as a follow-up.

-- ---------------------------------------------------------------------------
-- 1) increment_credits(user_id uuid, amount integer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Reject non-positive deltas: usage may only ever increase. A negative amount
  -- would reduce recorded usage and hand the caller unlimited credits.
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'increment_credits: amount must be a positive integer';
  END IF;

  -- Bind to the caller when an end-user identity is present so an authenticated
  -- caller can only ever affect their own row. Service-role/back-end callers
  -- have auth.uid() = NULL and retain the original behavior.
  UPDATE users
  SET daily_credits_used = daily_credits_used + amount
  WHERE id = user_id
    AND (auth.uid() IS NULL OR auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the implicit PUBLIC/anon execute rights. The only legitimate caller is
-- CreditService.consumeCredits via the RLS-scoped `authenticated` role, which
-- keeps its explicit grant (from 20260122000007). anon/PUBLIC never need it.
REVOKE EXECUTE ON FUNCTION increment_credits(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_credits(uuid, integer) FROM anon;

COMMENT ON FUNCTION increment_credits(uuid, integer) IS
  'Atomically increments daily credit usage. Positive-only; bound to the caller when auth.uid() is set (audit 2026-08).';

-- ---------------------------------------------------------------------------
-- 2) execute_nl_query(query_sql text)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION execute_nl_query(query_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  normalized text;
BEGIN
  normalized := lower(trim(query_sql));

  -- SELECT-only.
  IF NOT (upper(trim(query_sql)) LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- No statement stacking / comments (breakout primitives).
  IF query_sql LIKE '%;%' OR query_sql LIKE '%--%' OR query_sql LIKE '%/*%' THEN
    RAISE EXCEPTION 'Query contains forbidden syntax';
  END IF;

  -- Block mutating / DDL keywords.
  IF upper(query_sql) ~ '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COPY|CALL|DO|VACUUM|MERGE|SET\s)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Block access to sensitive schemas/objects. Catches auth.users (password
  -- hashes), catalogs, and Supabase internal schemas regardless of casing.
  IF normalized ~ '(auth\.|pg_catalog|pg_class|pg_shadow|pg_authid|pg_user|information_schema|storage\.|vault\.|secrets|pg_read|pg_sleep|dblink|current_setting|set_config)' THEN
    RAISE EXCEPTION 'Query references a restricted object';
  END IF;

  -- Require a genuine workspace_id predicate, not merely the literal string.
  IF normalized !~ 'workspace_id\s*(=|in)\s*' THEN
    RAISE EXCEPTION 'Query must filter by workspace_id';
  END IF;

  EXECUTE 'SELECT json_agg(q) FROM (' || query_sql || ') q' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Only the service-role code path (nl-query.service.ts) may invoke this.
REVOKE EXECUTE ON FUNCTION execute_nl_query(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION execute_nl_query(text) FROM anon;
REVOKE EXECUTE ON FUNCTION execute_nl_query(text) FROM authenticated;

COMMENT ON FUNCTION execute_nl_query(text) IS
  'Executes a constrained workspace-scoped SELECT. Service-role only; blocks stacking, comments, sensitive schemas (audit 2026-08). Durable fix: stop executing model-authored SQL.';

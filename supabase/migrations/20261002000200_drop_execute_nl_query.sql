-- SECURITY: execute_nl_query ran arbitrary SELECTs as the owner (past RLS). Its only caller, the "Ask your data"
-- route (/api/intelligence/query), passed LLM-written SQL to it with the service role, so any logged-in user could
-- prompt-inject a whole-database read. Route and UI deleted in the same change; the function goes too.
drop function if exists public.execute_nl_query(text);

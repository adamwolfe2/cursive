-- Enable RLS + deny anon/authenticated on tables that were created without it,
-- and tighten one over-permissive policy. Flagged in the 2026-08 audit.
--
-- The codebase relies on "RLS enabled + no permissive policy => deny-all to
-- anon/authenticated, service_role bypasses" as its tenant boundary (see
-- 20260606030000_enable_rls_funnel_server_tables.sql). Several tables holding
-- enrichment output / request logs were left without RLS, so any holder of the
-- publishable anon key could read them directly via PostgREST.
--
-- All legitimate application access to these tables goes through the
-- service-role admin client (verified: src/lib/services/intelligence/cache.ts,
-- src/lib/ai/company-analysis.ts), which bypasses RLS — so enabling RLS and
-- revoking the anon/authenticated grants does not change application behavior.

-- intelligence_cache — cached enrichment results (lead PII), not workspace-keyed.
ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON intelligence_cache FROM anon, authenticated;

-- company_analysis_cache — cached company analysis keyed by domain.
ALTER TABLE company_analysis_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON company_analysis_cache FROM anon, authenticated;

-- api_request_logs — multi-tenant request logs (has workspace_id). Admin/service
-- read only; no end-user access.
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON api_request_logs FROM anon, authenticated;

-- Fix over-permissive SELECT policy on onboarding_automation_log.
-- `FOR SELECT USING (true)` with no TO clause applies to PUBLIC (anon +
-- authenticated) — an allow-all, contrary to its own comment. service_role
-- bypasses RLS regardless, so dropping the policy leaves a correct deny-all for
-- end-user roles while the internal admin API (service role) keeps working.
DROP POLICY IF EXISTS "Admins read automation log" ON onboarding_automation_log;
REVOKE ALL ON onboarding_automation_log FROM anon, authenticated;

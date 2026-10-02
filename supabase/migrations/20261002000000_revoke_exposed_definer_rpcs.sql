-- SECURITY (P0, verified in prod 2026-10-02): these SECURITY DEFINER functions were executable by anon (the public
-- browser key), letting any visitor run arbitrary SELECTs past RLS (execute_nl_query), trigger partner payouts, or
-- change credit balances. Callers checked:
--   execute_nl_query        <- nl-query.service.ts (service-role client only)
--   process_partner_payout  <- inngest/functions/partner-payouts.ts (service-role client only)
--   increment_credits       <- grant-free route (service role) AND CreditService.consumeCredits (user client)
-- consumeCredits' call already fails in prod (arg-name mismatch, see below), so revoking `authenticated` from
-- increment_credits breaks nothing that works today. All three are service_role only.
-- Note: prod signature is (p_workspace_id uuid, p_amount integer, p_field text) but consumeCredits passes
-- {user_id, amount}, so that call already fails in prod (separate bug, fix with the server-client move).

revoke execute on function public.execute_nl_query(text) from public, anon, authenticated;
grant execute on function public.execute_nl_query(text) to service_role;

revoke execute on function public.process_partner_payout(uuid, numeric) from public, anon, authenticated;
grant execute on function public.process_partner_payout(uuid, numeric) to service_role;

revoke execute on function public.increment_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.increment_credits(uuid, integer, text) to service_role;

-- ============================================================================
-- get_visitor_stats RPC
-- ----------------------------------------------------------------------------
-- Replaces 4 separate COUNT queries in /api/visitors with a single round-trip.
-- Returns total, enriched, this_week, and avg_score for pixel-sourced leads
-- within the last 30 days (hard-coded; the UI always passes default 30-day range).
--
-- p_workspace_id  — the workspace to scope stats to
-- p_since         — timestamp lower bound (e.g. now() - INTERVAL '30 days')
-- p_week_ago      — timestamp for this-week count  (e.g. now() - INTERVAL '7 days')
-- ============================================================================

create or replace function get_visitor_stats(
  p_workspace_id uuid,
  p_since        timestamptz,
  p_week_ago     timestamptz
) returns table (
  total      bigint,
  enriched   bigint,
  this_week  bigint,
  avg_score  numeric
) language sql stable security definer set search_path = public as $$
  select
    count(*)                                                          as total,
    count(*) filter (where enrichment_status = 'enriched')           as enriched,
    count(*) filter (where created_at >= p_week_ago)                 as this_week,
    coalesce(
      avg(intent_score_calculated) filter (
        where intent_score_calculated is not null
      ),
      0
    )                                                                 as avg_score
  from leads
  where workspace_id = p_workspace_id
    and (source ilike '%pixel%' or source ilike '%superpixel%')
    and created_at >= p_since;
$$;

-- Service role only — called from API routes using the admin client.
revoke execute on function get_visitor_stats(uuid, timestamptz, timestamptz) from public;
grant  execute on function get_visitor_stats(uuid, timestamptz, timestamptz) to service_role;

comment on function get_visitor_stats is
  'Single-query stats for pixel-sourced leads. Replaces 4 parallel COUNT queries in /api/visitors.';

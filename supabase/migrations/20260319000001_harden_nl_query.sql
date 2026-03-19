-- Harden execute_nl_query to prevent SQL injection via LLM prompt injection
-- SECURITY: Adds table allowlist and blocks subqueries/JOINs at the database level

CREATE OR REPLACE FUNCTION execute_nl_query(query_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  upper_sql text;
  lower_sql text;
BEGIN
  upper_sql := upper(trim(query_sql));
  lower_sql := lower(trim(query_sql));

  -- Only allow SELECT
  IF NOT (upper_sql LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block dangerous keywords (word-boundary aware)
  IF upper_sql ~ '\m(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY)\M' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Block JOINs, UNIONs, CTEs, subqueries
  IF upper_sql ~ '\m(JOIN|UNION|INTERSECT|EXCEPT|WITH|INTO)\M' THEN
    RAISE EXCEPTION 'JOINs, UNIONs, and CTEs are not allowed';
  END IF;

  -- Block subqueries (parenthesized SELECT)
  IF upper_sql ~ '\(\s*SELECT' THEN
    RAISE EXCEPTION 'Subqueries are not allowed';
  END IF;

  -- Block system catalog access
  IF lower_sql ~ '(information_schema|pg_catalog|pg_)' THEN
    RAISE EXCEPTION 'System catalog access is not allowed';
  END IF;

  -- TABLE ALLOWLIST: Only permit queries against the "leads" table
  -- Extract table name from FROM clause and verify it's "leads"
  IF NOT (lower_sql ~ '\bfrom\s+leads\b') THEN
    RAISE EXCEPTION 'Only queries against the leads table are allowed';
  END IF;

  -- Block multiple FROM clauses (prevents sneaking in other tables)
  IF (SELECT count(*) FROM regexp_matches(lower_sql, '\bfrom\b', 'g')) > 1 THEN
    RAISE EXCEPTION 'Multiple FROM clauses are not allowed';
  END IF;

  -- Must include workspace_id filter
  IF lower_sql NOT LIKE '%workspace_id%' THEN
    RAISE EXCEPTION 'Query must include workspace_id filter';
  END IF;

  -- Block multiple statements (semicolons outside of string literals)
  IF query_sql ~ ';' THEN
    RAISE EXCEPTION 'Multiple statements are not allowed';
  END IF;

  EXECUTE 'SELECT json_agg(q) FROM (' || query_sql || ') q' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Add comment documenting security controls
COMMENT ON FUNCTION execute_nl_query IS 'Executes NL-generated SQL with layered security: SELECT-only, table allowlist (leads), no JOINs/UNIONs/subqueries, workspace_id required. SECURITY DEFINER - runs with elevated privileges, security enforced in function body.';

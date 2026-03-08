
-- Diagnostic Suggestions RPC
-- Analyzes historical data to suggest faults, parts, and costs for a given device model and reported issue
CREATE OR REPLACE FUNCTION get_diagnostic_suggestions(
  _device_brand text DEFAULT NULL,
  _device_model text DEFAULT NULL,
  _reported_issue text DEFAULT NULL,
  _device_type text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result jsonb;
  model_filter text;
BEGIN
  -- Build model match (brand + model)
  model_filter := COALESCE(_device_brand, '') || ' ' || COALESCE(_device_model, '');
  model_filter := TRIM(model_filter);

  SELECT jsonb_build_object(
    -- Top fault types for this device model
    'suggested_faults', COALESCE((
      SELECT jsonb_agg(row_to_json(f))
      FROM (
        SELECT
          df.fault_type,
          df.fault_description,
          count(*) as occurrence_count,
          round(count(*)::numeric / NULLIF(total.cnt, 0) * 100, 1) as percentage
        FROM diagnosis_faults df
        JOIN diagnostics d ON d.id = df.diagnosis_id
        JOIN service_orders so ON so.id = d.service_order_id
        LEFT JOIN devices dev ON dev.id = so.device_id
        CROSS JOIN (
          SELECT count(DISTINCT d2.id) as cnt
          FROM diagnostics d2
          JOIN service_orders so2 ON so2.id = d2.service_order_id
          LEFT JOIN devices dev2 ON dev2.id = so2.device_id
          WHERE (model_filter = '' OR COALESCE(dev2.brand, '') || ' ' || COALESCE(dev2.model, '') ILIKE '%' || model_filter || '%')
        ) total
        WHERE df.confirmed = true
          AND (model_filter = '' OR COALESCE(dev.brand, '') || ' ' || COALESCE(dev.model, '') ILIKE '%' || model_filter || '%')
        GROUP BY df.fault_type, df.fault_description, total.cnt
        ORDER BY occurrence_count DESC
        LIMIT 8
      ) f
    ), '[]'::jsonb),

    -- Most commonly used parts for this model
    'suggested_parts', COALESCE((
      SELECT jsonb_agg(row_to_json(p))
      FROM (
        SELECT
          dp.part_name,
          round(avg(dp.estimated_unit_cost), 2) as avg_cost,
          sum(dp.quantity) as total_used,
          count(DISTINCT dp.diagnosis_id) as diagnosis_count
        FROM diagnosis_parts dp
        JOIN diagnostics d ON d.id = dp.diagnosis_id
        JOIN service_orders so ON so.id = d.service_order_id
        LEFT JOIN devices dev ON dev.id = so.device_id
        WHERE (model_filter = '' OR COALESCE(dev.brand, '') || ' ' || COALESCE(dev.model, '') ILIKE '%' || model_filter || '%')
        GROUP BY dp.part_name
        ORDER BY diagnosis_count DESC
        LIMIT 10
      ) p
    ), '[]'::jsonb),

    -- Average repair cost from completed quotes
    'cost_estimate', COALESCE((
      SELECT jsonb_build_object(
        'avg_total', round(avg(rq.total_amount), 2),
        'min_total', round(min(rq.total_amount), 2),
        'max_total', round(max(rq.total_amount), 2),
        'sample_count', count(*)
      )
      FROM repair_quotes rq
      JOIN service_orders so ON so.id = rq.service_order_id
      LEFT JOIN devices dev ON dev.id = so.device_id
      WHERE rq.status = 'approved'
        AND rq.total_amount > 0
        AND (model_filter = '' OR COALESCE(dev.brand, '') || ' ' || COALESCE(dev.model, '') ILIKE '%' || model_filter || '%')
    ), '{"avg_total": 0, "min_total": 0, "max_total": 0, "sample_count": 0}'::jsonb),

    -- Similar past repairs (by reported issue text similarity)
    'similar_repairs', COALESCE((
      SELECT jsonb_agg(row_to_json(r))
      FROM (
        SELECT
          so.order_number,
          so.reported_issue,
          so.status,
          d.probable_cause,
          d.repair_complexity,
          COALESCE(dev.brand, '') || ' ' || COALESCE(dev.model, '') as device_label,
          so.created_at
        FROM service_orders so
        JOIN diagnostics d ON d.service_order_id = so.id AND d.diagnosis_status = 'completed'
        LEFT JOIN devices dev ON dev.id = so.device_id
        WHERE so.status IN ('delivered', 'ready_for_pickup', 'in_testing')
          AND _reported_issue IS NOT NULL
          AND _reported_issue != ''
          AND so.reported_issue IS NOT NULL
          AND (
            so.reported_issue ILIKE '%' || _reported_issue || '%'
            OR _reported_issue ILIKE '%' || so.reported_issue || '%'
            -- word-level matching
            OR EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(_reported_issue), ' ')) w
              WHERE length(w) > 3 AND lower(so.reported_issue) LIKE '%' || w || '%'
            )
          )
        ORDER BY so.created_at DESC
        LIMIT 5
      ) r
    ), '[]'::jsonb),

    -- Avg repair time
    'avg_repair_hours', COALESCE((
      SELECT round(avg(d.estimated_repair_hours), 1)
      FROM diagnostics d
      JOIN service_orders so ON so.id = d.service_order_id
      LEFT JOIN devices dev ON dev.id = so.device_id
      WHERE d.diagnosis_status = 'completed'
        AND d.estimated_repair_hours IS NOT NULL
        AND d.estimated_repair_hours > 0
        AND (model_filter = '' OR COALESCE(dev.brand, '') || ' ' || COALESCE(dev.model, '') ILIKE '%' || model_filter || '%')
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$;

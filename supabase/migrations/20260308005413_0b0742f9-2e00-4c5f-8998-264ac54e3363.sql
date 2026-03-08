
-- Fix search_path for new functions
ALTER FUNCTION prevent_duplicate_device_so() SET search_path = public;
ALTER FUNCTION enforce_status_transition() SET search_path = public;
ALTER FUNCTION prevent_negative_stock() SET search_path = public;
ALTER FUNCTION prevent_stock_movement_delete() SET search_path = public;
ALTER FUNCTION protect_approved_quote() SET search_path = public;
ALTER FUNCTION auto_track_device_location() SET search_path = public;
ALTER FUNCTION detect_stale_devices(int) SET search_path = public;
ALTER FUNCTION run_consistency_checks() SET search_path = public;

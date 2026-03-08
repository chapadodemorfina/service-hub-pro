-- Remove duplicate indexes on collection_point_commissions
-- idx_commissions_cp and idx_cpc_cp are identical
-- idx_commissions_so and idx_cpc_so are identical  
-- idx_cpc_so_cp covers both, so keep only idx_cpc_so_cp and drop the rest
DROP INDEX IF EXISTS idx_commissions_cp;
DROP INDEX IF EXISTS idx_commissions_so;
DROP INDEX IF EXISTS idx_cpc_cp;
DROP INDEX IF EXISTS idx_cpc_so;

-- Drop the empty redundant settings table (app_settings is the real one)
DROP TABLE IF EXISTS settings;

-- Clear the placeholder WhatsApp number so admin must configure a real one
UPDATE app_settings SET value = '' WHERE key = 'whatsapp_support_number' AND value = '5511999999999';
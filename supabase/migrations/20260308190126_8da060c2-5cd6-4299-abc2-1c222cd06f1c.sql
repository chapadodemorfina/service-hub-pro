
-- Temporariamente desabilitar trigger de proteção de audit_logs
ALTER TABLE public.audit_logs DISABLE TRIGGER no_delete_audit;

-- Desabilitar triggers de auditoria que podem falhar durante delete em cascata
ALTER TABLE public.service_orders DISABLE TRIGGER audit_service_orders_delete;
ALTER TABLE public.repair_quotes DISABLE TRIGGER audit_repair_quotes_delete;
ALTER TABLE public.financial_entries DISABLE TRIGGER audit_financial_entries_delete;
ALTER TABLE public.stock_movements DISABLE TRIGGER trg_prevent_stock_movement_delete;

-- FASE 1: FOLHAS
DELETE FROM public.audit_logs;
DELETE FROM public.notification_events;
DELETE FROM public.service_order_public_links;
DELETE FROM public.service_order_status_history;
DELETE FROM public.device_location_tracking;
DELETE FROM public.device_photos;
DELETE FROM public.device_accessories;
DELETE FROM public.customer_addresses;
DELETE FROM public.customer_contacts;
DELETE FROM public.service_order_attachments;

-- WhatsApp & Notification logs/queue
DELETE FROM public.whatsapp_ai_actions;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.whatsapp_handoffs;
DELETE FROM public.whatsapp_pending_states;
DELETE FROM public.whatsapp_conversations;
DELETE FROM public.notification_logs;
DELETE FROM public.notification_queue;

-- FASE 2: FILHOS DE QUOTE / DIAGNÓSTICO
DELETE FROM public.quote_approvals;
DELETE FROM public.repair_quote_items;
DELETE FROM public.diagnosis_faults;
DELETE FROM public.diagnosis_tests;
DELETE FROM public.diagnosis_parts;

-- FASE 3: FINANCEIRO
DELETE FROM public.payments;
DELETE FROM public.financial_entries;
DELETE FROM public.collection_point_commissions;

-- FASE 4: OPERACIONAIS
DELETE FROM public.repair_parts_used;
DELETE FROM public.part_reservations;
DELETE FROM public.stock_movements;
DELETE FROM public.collection_transfers;
DELETE FROM public.pickups_deliveries;
DELETE FROM public.repair_quotes;
DELETE FROM public.diagnostics;

-- FASE 5: PRINCIPAIS
DELETE FROM public.service_orders;
DELETE FROM public.devices;
DELETE FROM public.customers;

-- FASE 6: CADASTROS BASE SEED
DELETE FROM public.products;
DELETE FROM public.suppliers;
DELETE FROM public.collection_points;

-- Reativar todos os triggers
ALTER TABLE public.audit_logs ENABLE TRIGGER no_delete_audit;
ALTER TABLE public.service_orders ENABLE TRIGGER audit_service_orders_delete;
ALTER TABLE public.repair_quotes ENABLE TRIGGER audit_repair_quotes_delete;
ALTER TABLE public.financial_entries ENABLE TRIGGER audit_financial_entries_delete;
ALTER TABLE public.stock_movements ENABLE TRIGGER trg_prevent_stock_movement_delete;

-- FASE 7: GARANTIR ROLE ADMIN
INSERT INTO public.user_roles (user_id, role)
VALUES ('4177c9bc-9b1f-4078-ba30-eeabef7e9796', 'admin')
ON CONFLICT DO NOTHING;

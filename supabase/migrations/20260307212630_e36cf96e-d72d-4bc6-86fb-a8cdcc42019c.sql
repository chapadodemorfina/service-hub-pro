
-- =================================================
-- Notification Module - Enums
-- =================================================
CREATE TYPE public.notification_channel AS ENUM ('whatsapp', 'email', 'sms', 'internal');
CREATE TYPE public.notification_queue_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'cancelled', 'skipped');
CREATE TYPE public.notification_processing_status AS ENUM ('pending', 'processing', 'processed', 'failed');

-- =================================================
-- notification_events
-- =================================================
CREATE TABLE public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processing_status notification_processing_status NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ne_status ON notification_events (processing_status) WHERE processing_status = 'pending';
CREATE INDEX idx_ne_event_type ON notification_events (event_type);
CREATE INDEX idx_ne_entity ON notification_events (entity_type, entity_id);

-- =================================================
-- notification_templates
-- =================================================
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel notification_channel NOT NULL,
  template_key text NOT NULL UNIQUE,
  subject text,
  body text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- =================================================
-- notification_rules
-- =================================================
CREATE TABLE public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  channel notification_channel NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  target_audience text NOT NULL DEFAULT 'customer',
  template_id uuid REFERENCES notification_templates(id),
  provider_key text,
  delay_minutes integer NOT NULL DEFAULT 0,
  conditions jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_nr_event ON notification_rules (event_type, is_active);

-- =================================================
-- notification_queue
-- =================================================
CREATE TABLE public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES notification_events(id),
  rule_id uuid REFERENCES notification_rules(id),
  template_id uuid REFERENCES notification_templates(id),
  channel notification_channel NOT NULL,
  recipient_name text,
  recipient_address text NOT NULL,
  rendered_subject text,
  rendered_body text NOT NULL,
  payload jsonb DEFAULT '{}',
  status notification_queue_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_nq_status_next ON notification_queue (status, next_attempt_at) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_nq_event ON notification_queue (event_id);
CREATE INDEX idx_nq_channel ON notification_queue (channel);

-- =================================================
-- notification_logs
-- =================================================
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES notification_queue(id),
  provider_key text,
  request_payload jsonb,
  response_payload jsonb,
  response_status integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_nl_queue ON notification_logs (queue_id);

-- =================================================
-- updated_at triggers
-- =================================================
CREATE TRIGGER set_updated_at_notification_templates BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_notification_rules BEFORE UPDATE ON notification_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_notification_queue BEFORE UPDATE ON notification_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =================================================
-- RLS Policies - admin/manager only
-- =================================================
CREATE POLICY "admin_manager_select_ne" ON notification_events FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));
CREATE POLICY "admin_manager_insert_ne" ON notification_events FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

CREATE POLICY "admin_manager_select_nt" ON notification_templates FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));
CREATE POLICY "admin_manager_all_nt" ON notification_templates FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

CREATE POLICY "admin_manager_select_nr" ON notification_rules FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));
CREATE POLICY "admin_manager_all_nr" ON notification_rules FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

CREATE POLICY "admin_manager_select_nq" ON notification_queue FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));
CREATE POLICY "admin_manager_update_nq" ON notification_queue FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

CREATE POLICY "admin_manager_select_nl" ON notification_logs FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','manager']::app_role[]));

-- =================================================
-- Event emission trigger for service_orders
-- =================================================
CREATE OR REPLACE FUNCTION public.trg_emit_so_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _payload jsonb;
  _customer record;
  _device record;
BEGIN
  SELECT full_name, email, phone, whatsapp INTO _customer FROM customers WHERE id = NEW.customer_id;
  SELECT brand, model INTO _device FROM devices WHERE id = NEW.device_id;

  _payload := jsonb_build_object(
    'order_number', NEW.order_number,
    'status', NEW.status::text,
    'priority', NEW.priority::text,
    'customer_id', NEW.customer_id,
    'customer_name', _customer.full_name,
    'customer_email', _customer.email,
    'customer_phone', COALESCE(_customer.whatsapp, _customer.phone),
    'device_label', TRIM(COALESCE(_device.brand, '') || ' ' || COALESCE(_device.model, '')),
    'collection_point_id', NEW.collection_point_id
  );

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
    VALUES ('service_order_created', 'service_order', NEW.id, _payload, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    _payload := _payload || jsonb_build_object('from_status', OLD.status::text);
    
    INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
    VALUES ('service_order_status_changed', 'service_order', NEW.id, _payload, auth.uid());

    IF NEW.status = 'ready_for_pickup' THEN
      INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
      VALUES ('service_order_ready_for_pickup', 'service_order', NEW.id, _payload, auth.uid());
    ELSIF NEW.status = 'delivered' THEN
      INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
      VALUES ('service_order_delivered', 'service_order', NEW.id, _payload, auth.uid());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_so_notification_events
  AFTER INSERT OR UPDATE OF status ON service_orders
  FOR EACH ROW EXECUTE FUNCTION trg_emit_so_event();

-- =================================================
-- Event emission trigger for repair_quotes
-- =================================================
CREATE OR REPLACE FUNCTION public.trg_emit_quote_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _payload jsonb;
  _so record;
  _customer record;
BEGIN
  SELECT * INTO _so FROM service_orders WHERE id = NEW.service_order_id;
  SELECT full_name, email, phone, whatsapp INTO _customer FROM customers WHERE id = _so.customer_id;

  _payload := jsonb_build_object(
    'quote_number', NEW.quote_number,
    'quote_status', NEW.status::text,
    'total_amount', NEW.total_amount,
    'order_number', _so.order_number,
    'customer_id', _so.customer_id,
    'customer_name', _customer.full_name,
    'customer_email', _customer.email,
    'customer_phone', COALESCE(_customer.whatsapp, _customer.phone),
    'service_order_id', _so.id
  );

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
    VALUES ('quote_created', 'repair_quote', NEW.id, _payload, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
    VALUES (
      CASE NEW.status::text
        WHEN 'sent' THEN 'quote_sent'
        WHEN 'approved' THEN 'quote_approved'
        WHEN 'rejected' THEN 'quote_rejected'
        WHEN 'expired' THEN 'quote_expired'
        ELSE 'quote_status_changed'
      END,
      'repair_quote', NEW.id, _payload, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quote_notification_events
  AFTER INSERT OR UPDATE OF status ON repair_quotes
  FOR EACH ROW EXECUTE FUNCTION trg_emit_quote_event();

-- =================================================
-- Event emission trigger for pickups_deliveries
-- =================================================
CREATE OR REPLACE FUNCTION public.trg_emit_logistics_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _payload jsonb;
  _so record;
  _customer record;
BEGIN
  SELECT * INTO _so FROM service_orders WHERE id = NEW.service_order_id;
  SELECT full_name, email, phone, whatsapp INTO _customer FROM customers WHERE id = _so.customer_id;

  _payload := jsonb_build_object(
    'logistics_type', NEW.logistics_type::text,
    'logistics_status', NEW.status::text,
    'order_number', _so.order_number,
    'customer_id', _so.customer_id,
    'customer_name', _customer.full_name,
    'customer_email', _customer.email,
    'customer_phone', COALESCE(_customer.whatsapp, _customer.phone),
    'driver_name', NEW.driver_name,
    'scheduled_date', NEW.scheduled_date,
    'service_order_id', _so.id
  );

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
    VALUES ('pickup_requested', 'pickup_delivery', NEW.id, _payload, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notification_events (event_type, entity_type, entity_id, payload, created_by)
    VALUES (
      CASE NEW.status::text
        WHEN 'pickup_scheduled' THEN 'pickup_scheduled'
        WHEN 'picked_up' THEN 'picked_up'
        WHEN 'in_transport' THEN 'in_transport'
        WHEN 'delivered' THEN 'returned'
        ELSE 'logistics_status_changed'
      END,
      'pickup_delivery', NEW.id, _payload, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_logistics_notification_events
  AFTER INSERT OR UPDATE OF status ON pickups_deliveries
  FOR EACH ROW EXECUTE FUNCTION trg_emit_logistics_event();

-- =================================================
-- RPC: process_notification_events
-- Transforms pending events into queue items
-- =================================================
CREATE OR REPLACE FUNCTION public.process_notification_events()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _event record;
  _rule record;
  _template record;
  _rendered_body text;
  _rendered_subject text;
  _recipient_address text;
  _recipient_name text;
  _count integer := 0;
  _var_key text;
  _var_val text;
BEGIN
  FOR _event IN
    SELECT * FROM notification_events
    WHERE processing_status = 'pending'
    ORDER BY created_at ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE notification_events SET processing_status = 'processing' WHERE id = _event.id;

    FOR _rule IN
      SELECT * FROM notification_rules
      WHERE event_type = _event.event_type AND is_active = true
    LOOP
      SELECT * INTO _template FROM notification_templates WHERE id = _rule.template_id AND is_active = true;
      IF NOT FOUND THEN CONTINUE; END IF;

      -- Determine recipient
      IF _rule.target_audience = 'customer' THEN
        _recipient_name := _event.payload->>'customer_name';
        IF _rule.channel = 'email' THEN
          _recipient_address := _event.payload->>'customer_email';
        ELSE
          _recipient_address := _event.payload->>'customer_phone';
        END IF;
      ELSE
        _recipient_name := 'Equipe';
        _recipient_address := 'internal';
      END IF;

      IF _recipient_address IS NULL OR _recipient_address = '' THEN CONTINUE; END IF;

      -- Render template by replacing {{var}} patterns
      _rendered_body := _template.body;
      _rendered_subject := COALESCE(_template.subject, '');

      FOR _var_key, _var_val IN
        SELECT key, value#>>'{}'
        FROM jsonb_each(_event.payload)
      LOOP
        _rendered_body := replace(_rendered_body, '{{' || _var_key || '}}', COALESCE(_var_val, ''));
        _rendered_subject := replace(_rendered_subject, '{{' || _var_key || '}}', COALESCE(_var_val, ''));
      END LOOP;

      -- Check idempotency: no duplicate queue item for same event+rule
      IF NOT EXISTS (
        SELECT 1 FROM notification_queue WHERE event_id = _event.id AND rule_id = _rule.id
      ) THEN
        INSERT INTO notification_queue (event_id, rule_id, template_id, channel, recipient_name, recipient_address, rendered_subject, rendered_body, payload, next_attempt_at)
        VALUES (_event.id, _rule.id, _template.id, _rule.channel, _recipient_name, _recipient_address, _rendered_subject, _rendered_body, _event.payload,
          now() + (_rule.delay_minutes || ' minutes')::interval);

        _count := _count + 1;
      END IF;
    END LOOP;

    UPDATE notification_events SET processing_status = 'processed', processed_at = now() WHERE id = _event.id;
  END LOOP;

  RETURN jsonb_build_object('queued', _count);
END;
$$;

-- =================================================
-- Seed default templates
-- =================================================
INSERT INTO notification_templates (name, channel, template_key, subject, body, variables) VALUES
('WhatsApp - OS Criada', 'whatsapp', 'wa_so_created', NULL,
 'Olá {{customer_name}}! Sua ordem de serviço {{order_number}} foi criada com sucesso. Dispositivo: {{device_label}}. Acompanhe pelo nosso portal.',
 '["customer_name","order_number","device_label"]'::jsonb),

('WhatsApp - Orçamento Enviado', 'whatsapp', 'wa_quote_sent', NULL,
 'Olá {{customer_name}}! O orçamento {{quote_number}} para a OS {{order_number}} está pronto. Valor: R$ {{total_amount}}. Acesse o portal para aprovar ou recusar.',
 '["customer_name","quote_number","order_number","total_amount"]'::jsonb),

('WhatsApp - Pronto para Retirada', 'whatsapp', 'wa_ready_pickup', NULL,
 'Olá {{customer_name}}! Seu equipamento da OS {{order_number}} está pronto para retirada. Aguardamos você!',
 '["customer_name","order_number"]'::jsonb),

('WhatsApp - Entregue', 'whatsapp', 'wa_delivered', NULL,
 'Olá {{customer_name}}! Confirmamos a entrega do seu equipamento (OS {{order_number}}). Obrigado pela confiança!',
 '["customer_name","order_number"]'::jsonb),

('WhatsApp - Lembrete Vencimento', 'whatsapp', 'wa_overdue_reminder', NULL,
 'Olá {{customer_name}}, o pagamento referente à OS {{order_number}} no valor de R$ {{amount}} está vencido. Entre em contato conosco.',
 '["customer_name","order_number","amount"]'::jsonb),

('Email - Orçamento Enviado', 'email', 'email_quote_sent',
 'Orçamento {{quote_number}} - OS {{order_number}}',
 'Prezado(a) {{customer_name}},\n\nO orçamento {{quote_number}} para a ordem de serviço {{order_number}} está disponível.\n\nValor total: R$ {{total_amount}}\n\nAcesse o portal do cliente para aprovar ou recusar.\n\nAtenciosamente,\n{{company_name}}',
 '["customer_name","quote_number","order_number","total_amount","company_name"]'::jsonb),

('Email - Atualização de Status', 'email', 'email_status_update',
 'Atualização OS {{order_number}}',
 'Prezado(a) {{customer_name}},\n\nSua ordem de serviço {{order_number}} teve o status atualizado para: {{status}}.\n\nDispositivo: {{device_label}}\n\nAcompanhe pelo portal.\n\nAtenciosamente,\n{{company_name}}',
 '["customer_name","order_number","status","device_label","company_name"]'::jsonb);

-- =================================================
-- Seed default rules (linking to templates)
-- =================================================
INSERT INTO notification_rules (event_type, channel, target_audience, template_id, delay_minutes) VALUES
('service_order_created', 'whatsapp', 'customer', (SELECT id FROM notification_templates WHERE template_key = 'wa_so_created'), 0),
('quote_sent', 'whatsapp', 'customer', (SELECT id FROM notification_templates WHERE template_key = 'wa_quote_sent'), 0),
('quote_sent', 'email', 'customer', (SELECT id FROM notification_templates WHERE template_key = 'email_quote_sent'), 0),
('service_order_ready_for_pickup', 'whatsapp', 'customer', (SELECT id FROM notification_templates WHERE template_key = 'wa_ready_pickup'), 0),
('service_order_delivered', 'whatsapp', 'customer', (SELECT id FROM notification_templates WHERE template_key = 'wa_delivered'), 0),
('service_order_status_changed', 'email', 'customer', (SELECT id FROM notification_templates WHERE template_key = 'email_status_update'), 5);


-- Repair services (technician action log)
CREATE TABLE public.repair_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT 'note',
  description text NOT NULL,
  technician_id uuid,
  time_spent_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Repair tests (checklist)
CREATE TABLE public.repair_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  passed boolean,
  notes text,
  tested_by uuid,
  tested_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Warranties
CREATE TABLE public.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  warranty_number text NOT NULL UNIQUE DEFAULT 'GAR-' || lpad(nextval('service_order_number_seq')::text, 6, '0'),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + interval '90 days')::date,
  coverage_description text,
  terms text,
  is_void boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Warranty returns
CREATE TABLE public.warranty_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id uuid NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  original_service_order_id uuid NOT NULL REFERENCES public.service_orders(id),
  new_service_order_id uuid REFERENCES public.service_orders(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_repair_services_so ON public.repair_services(service_order_id);
CREATE INDEX idx_repair_tests_so ON public.repair_tests(service_order_id);
CREATE INDEX idx_warranties_so ON public.warranties(service_order_id);
CREATE INDEX idx_warranty_returns_warranty ON public.warranty_returns(warranty_id);

-- Trigger
CREATE TRIGGER update_warranty_returns_updated_at BEFORE UPDATE ON public.warranty_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.repair_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_returns ENABLE ROW LEVEL SECURITY;

-- repair_services
CREATE POLICY "Authenticated can view repair_services" ON public.repair_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert repair_services" ON public.repair_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update repair_services" ON public.repair_services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete repair_services" ON public.repair_services FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- repair_tests
CREATE POLICY "Authenticated can view repair_tests" ON public.repair_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert repair_tests" ON public.repair_tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update repair_tests" ON public.repair_tests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete repair_tests" ON public.repair_tests FOR DELETE TO authenticated USING (true);

-- warranties
CREATE POLICY "Authenticated can view warranties" ON public.warranties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert warranties" ON public.warranties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update warranties" ON public.warranties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- warranty_returns
CREATE POLICY "Authenticated can view warranty_returns" ON public.warranty_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert warranty_returns" ON public.warranty_returns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update warranty_returns" ON public.warranty_returns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- Enums
CREATE TYPE public.repair_complexity AS ENUM ('simple', 'moderate', 'complex', 'specialized');
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired');
CREATE TYPE public.quote_item_type AS ENUM ('labor', 'part');

-- Diagnostics
CREATE TABLE public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  technical_findings text,
  probable_cause text,
  required_parts text,
  repair_complexity repair_complexity NOT NULL DEFAULT 'moderate',
  estimated_repair_hours numeric(5,1),
  internal_notes text,
  diagnosed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Repair Quotes
CREATE TABLE public.repair_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  quote_number text NOT NULL UNIQUE DEFAULT 'ORC-' || lpad(nextval('service_order_number_seq')::text, 6, '0'),
  status quote_status NOT NULL DEFAULT 'draft',
  discount_percent numeric(5,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  analysis_fee numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  expires_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Quote Items
CREATE TABLE public.repair_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.repair_quotes(id) ON DELETE CASCADE,
  item_type quote_item_type NOT NULL,
  description text NOT NULL,
  quantity numeric(8,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quote Approvals
CREATE TABLE public.quote_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.repair_quotes(id) ON DELETE CASCADE,
  decision quote_status NOT NULL,
  decided_by_name text,
  decided_by_role text DEFAULT 'customer',
  reason text,
  charge_analysis_fee boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_diagnostics_so ON public.diagnostics(service_order_id);
CREATE INDEX idx_repair_quotes_so ON public.repair_quotes(service_order_id);
CREATE INDEX idx_quote_items_quote ON public.repair_quote_items(quote_id);
CREATE INDEX idx_quote_approvals_quote ON public.quote_approvals(quote_id);

-- Triggers
CREATE TRIGGER update_diagnostics_updated_at BEFORE UPDATE ON public.diagnostics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_repair_quotes_updated_at BEFORE UPDATE ON public.repair_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;

-- Diagnostics policies
CREATE POLICY "Authenticated can view diagnostics" ON public.diagnostics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert diagnostics" ON public.diagnostics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update diagnostics" ON public.diagnostics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete diagnostics" ON public.diagnostics FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Quotes policies
CREATE POLICY "Authenticated can view quotes" ON public.repair_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert quotes" ON public.repair_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update quotes" ON public.repair_quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete quotes" ON public.repair_quotes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Quote items policies
CREATE POLICY "Authenticated can view quote_items" ON public.repair_quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert quote_items" ON public.repair_quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update quote_items" ON public.repair_quote_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete quote_items" ON public.repair_quote_items FOR DELETE TO authenticated USING (true);

-- Approvals policies
CREATE POLICY "Authenticated can view approvals" ON public.quote_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert approvals" ON public.quote_approvals FOR INSERT TO authenticated WITH CHECK (true);


-- Commission type enum
CREATE TYPE public.commission_type AS ENUM ('percentage', 'fixed_per_order', 'fixed_per_device');

-- Transfer status enum
CREATE TYPE public.transfer_status AS ENUM ('pending_pickup', 'in_transit_to_center', 'received_at_center', 'in_transit_to_collection_point', 'delivered_to_collection_point', 'delivered_to_customer');

-- Collection Points table
CREATE TABLE public.collection_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  responsible_person text,
  phone text,
  whatsapp text,
  email text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  notes text,
  commission_type public.commission_type NOT NULL DEFAULT 'percentage',
  commission_value numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view collection_points" ON public.collection_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert collection_points" ON public.collection_points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update collection_points" ON public.collection_points FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete collection_points" ON public.collection_points FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_collection_points_updated_at BEFORE UPDATE ON public.collection_points FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Collection Point Users (links operators to collection points)
CREATE TABLE public.collection_point_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_point_id uuid NOT NULL REFERENCES public.collection_points(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_point_id, user_id)
);

ALTER TABLE public.collection_point_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view cp_users" ON public.collection_point_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert cp_users" ON public.collection_point_users FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cp_users" ON public.collection_point_users FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cp_users" ON public.collection_point_users FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cp_users_user ON public.collection_point_users USING btree (user_id);
CREATE INDEX idx_cp_users_cp ON public.collection_point_users USING btree (collection_point_id);

-- Collection Transfers (tracks device movement between collection point and center)
CREATE TABLE public.collection_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  collection_point_id uuid NOT NULL REFERENCES public.collection_points(id) ON DELETE CASCADE,
  status public.transfer_status NOT NULL DEFAULT 'pending_pickup',
  direction text NOT NULL DEFAULT 'to_center',
  transferred_by uuid,
  received_by uuid,
  transferred_at timestamptz,
  received_at timestamptz,
  tracking_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view transfers" ON public.collection_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert transfers" ON public.collection_transfers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update transfers" ON public.collection_transfers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_collection_transfers_updated_at BEFORE UPDATE ON public.collection_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_transfers_so ON public.collection_transfers USING btree (service_order_id);
CREATE INDEX idx_transfers_cp ON public.collection_transfers USING btree (collection_point_id);

-- Collection Point Commissions (computed commissions per service order)
CREATE TABLE public.collection_point_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_point_id uuid NOT NULL REFERENCES public.collection_points(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  commission_type public.commission_type NOT NULL,
  commission_value numeric NOT NULL DEFAULT 0,
  base_amount numeric NOT NULL DEFAULT 0,
  calculated_amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_point_id, service_order_id)
);

ALTER TABLE public.collection_point_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view commissions" ON public.collection_point_commissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert commissions" ON public.collection_point_commissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update commissions" ON public.collection_point_commissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_commissions_cp ON public.collection_point_commissions USING btree (collection_point_id);
CREATE INDEX idx_commissions_so ON public.collection_point_commissions USING btree (service_order_id);

-- Security definer function to get user's collection point(s)
CREATE OR REPLACE FUNCTION public.get_user_collection_points(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT collection_point_id
  FROM public.collection_point_users
  WHERE user_id = _user_id AND is_active = true
$$;

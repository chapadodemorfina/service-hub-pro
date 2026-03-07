
-- Add reserved_quantity to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reserved_quantity integer NOT NULL DEFAULT 0;

-- Create part reservation table for tracking individual reservations
CREATE TABLE public.part_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  diagnosis_id uuid REFERENCES public.diagnostics(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'consumed', 'released')),
  reserved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.part_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reservations" ON public.part_reservations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage reservations" ON public.part_reservations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER set_part_reservations_updated_at
  BEFORE UPDATE ON public.part_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RPC: Reserve a part (atomic)
CREATE OR REPLACE FUNCTION public.reserve_part(
  _product_id uuid,
  _service_order_id uuid,
  _diagnosis_id uuid DEFAULT NULL,
  _quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _product products%ROWTYPE;
  _available integer;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _product FROM products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  _available := _product.quantity - _product.reserved_quantity;
  IF _available < _quantity THEN
    RAISE EXCEPTION 'Estoque disponível insuficiente: disponível %, solicitado %', _available, _quantity;
  END IF;

  UPDATE products SET reserved_quantity = reserved_quantity + _quantity WHERE id = _product_id;

  INSERT INTO part_reservations (product_id, service_order_id, diagnosis_id, quantity, reserved_by)
  VALUES (_product_id, _service_order_id, _diagnosis_id, _quantity, _user_id);

  RETURN jsonb_build_object('success', true, 'available', _available - _quantity);
END;
$$;

-- RPC: Release reservation
CREATE OR REPLACE FUNCTION public.release_reservation(_reservation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res part_reservations%ROWTYPE;
BEGIN
  SELECT * INTO _res FROM part_reservations WHERE id = _reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  IF _res.status <> 'reserved' THEN RAISE EXCEPTION 'Reserva não está ativa'; END IF;

  UPDATE part_reservations SET status = 'released', updated_at = now() WHERE id = _reservation_id;
  UPDATE products SET reserved_quantity = GREATEST(reserved_quantity - _res.quantity, 0) WHERE id = _res.product_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Adjust stock (for managers)
CREATE OR REPLACE FUNCTION public.adjust_stock(
  _product_id uuid,
  _new_quantity integer,
  _reason text DEFAULT 'Ajuste manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _product products%ROWTYPE;
  _user_id uuid;
  _diff integer;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _product FROM products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  _diff := _new_quantity - _product.quantity;

  UPDATE products SET quantity = _new_quantity WHERE id = _product_id;

  INSERT INTO stock_movements (product_id, movement_type, quantity, previous_quantity, new_quantity, notes, created_by)
  VALUES (_product_id, 'adjustment', _diff, _product.quantity, _new_quantity, _reason, _user_id);

  RETURN jsonb_build_object('success', true, 'previous', _product.quantity, 'new', _new_quantity);
END;
$$;

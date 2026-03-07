
-- Fix overly permissive RLS: replace ALL policy with specific INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can manage reservations" ON public.part_reservations;

CREATE POLICY "Authenticated users can insert reservations" ON public.part_reservations
  FOR INSERT TO authenticated WITH CHECK (reserved_by = auth.uid());

CREATE POLICY "Authenticated users can update reservations" ON public.part_reservations
  FOR UPDATE TO authenticated USING (reserved_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[]));

CREATE POLICY "Authenticated users can delete reservations" ON public.part_reservations
  FOR DELETE TO authenticated USING (reserved_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[]));

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

export interface WarrantyAnalytics {
  total_warranties: number;
  active_warranties: number;
  expired_warranties: number;
  voided_warranties: number;
  total_returns: number;
  return_rate: number;
  returns_by_cause: { cause: string; count: number }[];
  returns_by_outcome: { outcome: string; count: number }[];
  top_returning_devices: { device: string; count: number }[];
  recent_returns: {
    id: string;
    warranty_number: string;
    reason: string;
    return_cause: string | null;
    outcome: string | null;
    status: string;
    customer_name: string;
    created_at: string;
  }[];
}

export function useWarrantyAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ["warranty-analytics", from, to],
    queryFn: async () => {
      const params: any = {};
      if (from) params._from = from;
      if (to) params._to = to;
      const { data, error } = await db.rpc("warranty_analytics", params);
      if (error) throw error;
      return data as WarrantyAnalytics;
    },
  });
}

export function useAllWarranties() {
  return useQuery({
    queryKey: ["all-warranties"],
    queryFn: async () => {
      const { data, error } = await db
        .from("warranties")
        .select("*, service_orders(order_number, customer_id, device_id, customers(full_name), devices(brand, model))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useVoidWarranty() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ warrantyId, reason }: { warrantyId: string; reason: string }) => {
      const { data, error } = await db.rpc("void_warranty", {
        _warranty_id: warrantyId,
        _reason: reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-warranties"] });
      qc.invalidateQueries({ queryKey: ["warranty"] });
      qc.invalidateQueries({ queryKey: ["warranty-analytics"] });
      toast({ title: "Garantia anulada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao anular garantia", description: error.message, variant: "destructive" });
    },
  });
}

export function useCustomerWarranties(customerId: string | undefined) {
  return useQuery({
    queryKey: ["customer-warranties", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await db
        .from("warranties")
        .select("*, service_orders(order_number), warranty_returns(*)")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

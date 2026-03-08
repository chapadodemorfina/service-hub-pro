import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardSummary {
  total_orders: number;
  open_orders: number;
  orders_by_status: Record<string, number>;
  total_revenue: number;
  total_expenses: number;
  total_commissions: number;
  quotes_total: number;
  quotes_approved: number;
  quotes_rejected: number;
  warranties_total: number;
  warranties_voided: number;
  avg_turnaround_hours: number | null;
  sla_overdue_count: number;
  device_types: Record<string, number>;
  top_defects: { cause: string; count: number }[];
  technician_orders: { technician_id: string; name: string; count: number }[];
  collection_point_orders: { cp_id: string; name: string; count: number; revenue: number; commissions: number }[];
  monthly_trend: { month: string; orders: number; revenue: number; expenses: number; profit: number }[];
  // New BI metrics
  today_received: number;
  today_delivered: number;
  today_revenue: number;
  today_quotes: number;
  avg_diagnosis_hours: number | null;
  avg_ticket_value: number | null;
  top_parts: { name: string; sku: string; qty: number; cost: number }[];
  stock_value: number;
  low_stock_count: number;
  pipeline: Record<string, number>;
}

export function useDashboardData(dateRange: DateRange) {
  const from = dateRange.from.toISOString();
  const to = dateRange.to.toISOString();

  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary", from, to],
    queryFn: async () => {
      const { data, error } = await db.rpc("dashboard_summary", {
        _from: from,
        _to: to,
      });
      if (error) throw error;
      return data as DashboardSummary;
    },
  });
}

export function useMonthlyTrend() {
  return useQuery<{ month: string; orders: number; revenue: number; expenses: number; profit: number }[]>({
    queryKey: ["dashboard-monthly-trend"],
    queryFn: async () => {
      const from = new Date(Date.now() - 180 * 86400000).toISOString();
      const to = new Date().toISOString();
      const { data, error } = await db.rpc("dashboard_summary", { _from: from, _to: to });
      if (error) throw error;
      return (data as DashboardSummary).monthly_trend || [];
    },
  });
}

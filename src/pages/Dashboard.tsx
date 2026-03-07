import { useState } from "react";
import { differenceInHours } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData, useMonthlyTrend, DateRange } from "@/hooks/useDashboardData";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { OrdersByStatusChart } from "@/components/dashboard/OrdersByStatusChart";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { DeviceTypesChart } from "@/components/dashboard/DeviceTypesChart";
import { TechnicianProductivityChart } from "@/components/dashboard/TechnicianProductivityChart";
import { PartsConsumptionChart } from "@/components/dashboard/PartsConsumptionChart";
import { CollectionPointsChart } from "@/components/dashboard/CollectionPointsChart";
import { CommonDefectsChart } from "@/components/dashboard/CommonDefectsChart";

export default function Dashboard() {
  const [preset, setPreset] = useState("30d");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 86400000),
    to: new Date(),
  });

  const data = useDashboardData(dateRange);
  const trend = useMonthlyTrend();

  // Compute KPIs
  const openStatuses = ["received", "triage", "awaiting_diagnosis", "in_repair", "awaiting_parts", "in_testing", "awaiting_quote", "awaiting_customer_approval"];
  const openOrders = data.serviceOrders.filter((o) => openStatuses.includes(o.status)).length;

  // Avg turnaround from status history
  let avgTurnaround: number | null = null;
  if (data.completedOrders.length > 0) {
    // Simple avg: difference between order created_at and completion event
    const orderCreatedMap: Record<string, string> = {};
    data.serviceOrders.forEach((o) => { orderCreatedMap[o.id] = o.created_at; });
    const hours = data.completedOrders
      .filter((e) => orderCreatedMap[e.service_order_id])
      .map((e) => differenceInHours(new Date(e.created_at), new Date(orderCreatedMap[e.service_order_id])));
    if (hours.length > 0) avgTurnaround = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
  }

  // Quote approval rate
  let quoteApprovalRate: number | null = null;
  if (data.quotes.length > 0) {
    const approved = data.quotes.filter((q) => q.status === "approved").length;
    quoteApprovalRate = Math.round((approved / data.quotes.length) * 100);
  }

  // Financial
  const totalRevenue = data.financialEntries.filter((f) => f.entry_type === "revenue").reduce((s, f) => s + Number(f.amount), 0);
  const totalExpenses = data.financialEntries.filter((f) => f.entry_type === "expense").reduce((s, f) => s + Number(f.amount), 0);

  // Warranty return
  let warrantyReturnRate: number | null = null;
  if (data.warranties.length > 0) {
    const voided = data.warranties.filter((w) => w.is_void).length;
    warrantyReturnRate = Math.round((voided / data.warranties.length) * 100);
  }

  if (data.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão gerencial do sistema i9 Solution</p>
        </div>
        <DashboardFilters dateRange={dateRange} onDateRangeChange={setDateRange} preset={preset} onPresetChange={setPreset} />
      </div>

      <KpiCards
        totalOrders={data.serviceOrders.length}
        openOrders={openOrders}
        avgTurnaroundHours={avgTurnaround}
        quoteApprovalRate={quoteApprovalRate}
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
        profit={totalRevenue - totalExpenses}
        warrantyReturnRate={warrantyReturnRate}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <OrdersByStatusChart data={data.serviceOrders} />
        {trend.data && <RevenueTrendChart data={trend.data} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TechnicianProductivityChart orders={data.serviceOrders} profiles={data.profiles} />
        <DeviceTypesChart data={data.devices} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CommonDefectsChart diagnostics={data.diagnostics} />
        <PartsConsumptionChart data={data.partsUsed} />
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <CollectionPointsChart orders={data.serviceOrders} financials={data.financialEntries} collectionPoints={data.collectionPoints} />
      </div>
    </div>
  );
}

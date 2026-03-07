import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  orders: Array<{ assigned_technician_id: string | null; status: string }>;
  profiles: Array<{ id: string; full_name: string }>;
}

export function TechnicianProductivityChart({ orders, profiles }: Props) {
  const techMap: Record<string, { total: number; completed: number }> = {};

  orders.forEach((o) => {
    if (!o.assigned_technician_id) return;
    if (!techMap[o.assigned_technician_id]) techMap[o.assigned_technician_id] = { total: 0, completed: 0 };
    techMap[o.assigned_technician_id].total++;
    if (o.status === "delivered" || o.status === "completed") techMap[o.assigned_technician_id].completed++;
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));

  const chartData = Object.entries(techMap)
    .map(([id, counts]) => ({
      name: profileMap[id]?.split(" ")[0] || id.slice(0, 8),
      total: counts.total,
      completed: counts.completed,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const config = {
    total: { label: "Total OS", color: "hsl(var(--chart-1))" },
    completed: { label: "Concluídas", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Produtividade por Técnico</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

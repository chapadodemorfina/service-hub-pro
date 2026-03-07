import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  orders: Array<{ collection_point_id: string | null }>;
  financials: Array<{ collection_point_id: string | null; amount: number; entry_type: string }>;
  collectionPoints: Array<{ id: string; name: string }>;
}

export function CollectionPointsChart({ orders, financials, collectionPoints }: Props) {
  const cpMap: Record<string, { orders: number; commissions: number }> = {};

  orders.forEach((o) => {
    if (!o.collection_point_id) return;
    if (!cpMap[o.collection_point_id]) cpMap[o.collection_point_id] = { orders: 0, commissions: 0 };
    cpMap[o.collection_point_id].orders++;
  });

  financials.forEach((f) => {
    if (!f.collection_point_id || f.entry_type !== "commission") return;
    if (!cpMap[f.collection_point_id]) cpMap[f.collection_point_id] = { orders: 0, commissions: 0 };
    cpMap[f.collection_point_id].commissions += Number(f.amount);
  });

  const nameMap = Object.fromEntries(collectionPoints.map((cp) => [cp.id, cp.name]));

  const chartData = Object.entries(cpMap)
    .map(([id, v]) => ({ name: nameMap[id] || id.slice(0, 8), orders: v.orders, commissions: v.commissions }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);

  const config = {
    orders: { label: "OS Recebidas", color: "hsl(var(--chart-1))" },
    commissions: { label: "Comissões (R$)", color: "hsl(var(--chart-3))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Desempenho Pontos de Coleta</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

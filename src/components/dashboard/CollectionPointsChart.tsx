import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  data: Array<{ cp_id: string; name: string; count: number; revenue?: number; commissions?: number }>;
}

const fmt = (v: number) => `R$ ${v.toFixed(0)}`;

export function CollectionPointsChart({ data }: Props) {
  const chartData = data
    .map(cp => ({
      name: cp.name || cp.cp_id.slice(0, 8),
      orders: cp.count,
      revenue: Number(cp.revenue) || 0,
      commissions: Number(cp.commissions) || 0,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Pontos de Coleta</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">Sem dados de pontos de coleta no período</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Pontos de Coleta — Desempenho</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={{
          orders: { label: "Ordens", color: "hsl(var(--chart-1))" },
          revenue: { label: "Receita", color: "hsl(var(--chart-2))" },
          commissions: { label: "Comissões", color: "hsl(var(--chart-4))" },
        }} className="h-72 w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} tickLine={false} />
            <YAxis yAxisId="left" allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar yAxisId="left" dataKey="orders" fill="var(--color-orders)" radius={4} />
            <Bar yAxisId="right" dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar yAxisId="right" dataKey="commissions" fill="var(--color-commissions)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

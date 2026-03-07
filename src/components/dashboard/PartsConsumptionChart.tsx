import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  data: Array<{ product_id: string; quantity: number; total_cost: number; total_price: number }>;
}

export function PartsConsumptionChart({ data }: Props) {
  const productMap: Record<string, { qty: number; cost: number; revenue: number }> = {};
  data.forEach((p) => {
    if (!productMap[p.product_id]) productMap[p.product_id] = { qty: 0, cost: 0, revenue: 0 };
    productMap[p.product_id].qty += p.quantity;
    productMap[p.product_id].cost += Number(p.total_cost);
    productMap[p.product_id].revenue += Number(p.total_price);
  });

  const chartData = Object.entries(productMap)
    .map(([id, v]) => ({ name: id.slice(0, 8), qty: v.qty, cost: v.cost, revenue: v.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const config = {
    qty: { label: "Quantidade", color: "hsl(var(--chart-3))" },
    revenue: { label: "Receita", color: "hsl(var(--chart-2))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Consumo de Peças (Top 8)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="qty" fill="var(--color-qty)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

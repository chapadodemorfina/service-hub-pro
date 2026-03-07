import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  received: "Recebido",
  in_diagnosis: "Diagnóstico",
  awaiting_approval: "Aguardando Aprov.",
  in_repair: "Em Reparo",
  awaiting_parts: "Aguard. Peças",
  quality_check: "Qualidade",
  ready_for_pickup: "Pronto Retirada",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

interface Props {
  data: Array<{ status: string }>;
}

export function OrdersByStatusChart({ data }: Props) {
  const counts: Record<string, number> = {};
  data.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

  const chartData = Object.entries(counts)
    .map(([status, count]) => ({ status: STATUS_LABELS[status] || status, count }))
    .sort((a, b) => b.count - a.count);

  const config = { count: { label: "Quantidade", color: "hsl(var(--chart-1))" } };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">OS por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

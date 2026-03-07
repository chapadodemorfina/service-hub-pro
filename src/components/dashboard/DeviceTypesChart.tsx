import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const TYPE_LABELS: Record<string, string> = {
  smartphone: "Smartphone",
  tablet: "Tablet",
  notebook: "Notebook",
  desktop: "Desktop",
  console: "Console",
  other: "Outro",
};

interface Props {
  data: Array<{ device_type: string }>;
}

export function DeviceTypesChart({ data }: Props) {
  const counts: Record<string, number> = {};
  data.forEach((d) => { counts[d.device_type] = (counts[d.device_type] || 0) + 1; });

  const chartData = Object.entries(counts)
    .map(([type, value]) => ({ name: TYPE_LABELS[type] || type, value }))
    .sort((a, b) => b.value - a.value);

  const config = Object.fromEntries(chartData.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tipos de Dispositivos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

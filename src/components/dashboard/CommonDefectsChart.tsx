import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  diagnostics: Array<{ probable_cause: string | null }>;
}

export function CommonDefectsChart({ diagnostics }: Props) {
  const counts: Record<string, number> = {};
  diagnostics.forEach((d) => {
    const cause = d.probable_cause?.trim();
    if (!cause) return;
    const key = cause.length > 30 ? cause.slice(0, 30) + "…" : cause;
    counts[key] = (counts[key] || 0) + 1;
  });

  const chartData = Object.entries(counts)
    .map(([defect, count]) => ({ defect, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const config = { count: { label: "Ocorrências", color: "hsl(var(--chart-5))" } };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Defeitos Mais Comuns</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum diagnóstico no período</p>
        ) : (
          <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="defect" width={110} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

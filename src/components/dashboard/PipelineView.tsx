import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  received: "Recebido",
  triage: "Triagem",
  awaiting_diagnosis: "Aguard. Diagnóstico",
  awaiting_quote: "Aguard. Orçamento",
  awaiting_customer_approval: "Aguard. Aprovação",
  in_repair: "Em Reparo",
  awaiting_parts: "Aguard. Peças",
  in_testing: "Em Teste",
  ready_for_pickup: "Pronto Retirada",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  triage: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  awaiting_diagnosis: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  awaiting_quote: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  awaiting_customer_approval: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200",
  in_repair: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
  awaiting_parts: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  in_testing: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200",
  ready_for_pickup: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
};

interface Props {
  data: Record<string, number>;
}

export function PipelineView({ data }: Props) {
  const stages = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({ key, label, count: Number(data[key]) || 0 }))
    .filter(s => s.count > 0);

  const total = stages.reduce((s, v) => s + v.count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Pipeline Operacional</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">Nenhuma OS em andamento</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline Operacional — {total} OS em andamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {stages.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <Badge className={`${STATUS_COLORS[s.key] || ""} text-sm px-3 py-1`}>
                {s.label}
              </Badge>
              <span className="text-lg font-bold">{s.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

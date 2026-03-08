import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, AlertTriangle, Wrench, DollarSign, Clock, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const db = supabase as any;

interface Props {
  deviceBrand?: string | null;
  deviceModel?: string | null;
  reportedIssue?: string | null;
  deviceType?: string | null;
}

interface Suggestions {
  suggested_faults: Array<{ fault_type: string; fault_description: string | null; occurrence_count: number; percentage: number }>;
  suggested_parts: Array<{ part_name: string; avg_cost: number; total_used: number; diagnosis_count: number }>;
  cost_estimate: { avg_total: number; min_total: number; max_total: number; sample_count: number };
  similar_repairs: Array<{ order_number: string; reported_issue: string; probable_cause: string; repair_complexity: string; device_label: string; created_at: string }>;
  avg_repair_hours: number;
}

export default function DiagnosticSuggestionsPanel({ deviceBrand, deviceModel, reportedIssue, deviceType }: Props) {
  const hasContext = !!(deviceBrand || deviceModel || reportedIssue);

  const { data, isLoading } = useQuery<Suggestions>({
    queryKey: ["diagnostic-suggestions", deviceBrand, deviceModel, reportedIssue, deviceType],
    enabled: hasContext,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await db.rpc("get_diagnostic_suggestions", {
        _device_brand: deviceBrand || null,
        _device_model: deviceModel || null,
        _reported_issue: reportedIssue || null,
        _device_type: deviceType || null,
      });
      if (error) throw error;
      return data as Suggestions;
    },
  });

  if (!hasContext) return null;
  if (isLoading) return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4" /> Assistente de Diagnóstico</CardTitle></CardHeader>
      <CardContent><Skeleton className="h-32 w-full" /></CardContent>
    </Card>
  );

  if (!data) return null;

  const hasFaults = data.suggested_faults?.length > 0;
  const hasParts = data.suggested_parts?.length > 0;
  const hasCost = data.cost_estimate?.sample_count > 0;
  const hasSimilar = data.similar_repairs?.length > 0;
  const hasAny = hasFaults || hasParts || hasCost || hasSimilar;

  if (!hasAny) return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4" /> Assistente de Diagnóstico</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Sem dados históricos suficientes para sugestões neste modelo/problema.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" /> Assistente de Diagnóstico
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Sugestões baseadas em {data.cost_estimate?.sample_count || 0} reparos anteriores
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Faults */}
        {hasFaults && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-2">
              <AlertTriangle className="h-3 w-3" /> Falhas Prováveis
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.suggested_faults.map((f, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {f.fault_type}
                  {f.percentage > 0 && <span className="ml-1 opacity-60">({f.percentage}%)</span>}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasFaults && (hasParts || hasCost) && <Separator />}

        {/* Suggested Parts */}
        {hasParts && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-2">
              <Wrench className="h-3 w-3" /> Peças Frequentes
            </h4>
            <div className="space-y-1">
              {data.suggested_parts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{p.part_name}</span>
                  <span className="text-muted-foreground">
                    ~R$ {p.avg_cost?.toFixed(2)} · {p.diagnosis_count}x usado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(hasFaults || hasParts) && hasCost && <Separator />}

        {/* Cost & Time Estimates */}
        {(hasCost || data.avg_repair_hours > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {hasCost && (
              <div className="rounded-md bg-muted/50 p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3 w-3" /> Custo Médio
                </div>
                <p className="text-lg font-semibold">R$ {data.cost_estimate.avg_total?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Min R$ {data.cost_estimate.min_total?.toFixed(2)} — Max R$ {data.cost_estimate.max_total?.toFixed(2)}
                </p>
              </div>
            )}
            {data.avg_repair_hours > 0 && (
              <div className="rounded-md bg-muted/50 p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" /> Tempo Médio
                </div>
                <p className="text-lg font-semibold">{data.avg_repair_hours}h</p>
              </div>
            )}
          </div>
        )}

        {/* Similar Repairs */}
        {hasSimilar && (
          <>
            <Separator />
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-2">
                <History className="h-3 w-3" /> Reparos Similares
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.similar_repairs.map((r, i) => (
                  <div key={i} className="text-sm border-l-2 border-primary/30 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{r.order_number}</span>
                      <Badge variant="outline" className="text-[10px]">{r.device_label?.trim()}</Badge>
                    </div>
                    {r.probable_cause && (
                      <p className="text-xs text-muted-foreground mt-0.5">Causa: {r.probable_cause}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

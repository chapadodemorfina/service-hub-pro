import { useStatusHistory } from "../hooks/useServiceOrders";
import { statusLabels, statusColors } from "../types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
  orderId: string;
}

export default function StatusTimeline({ orderId }: Props) {
  const { data: history, isLoading } = useStatusHistory(orderId);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando histórico...</div>;
  if (!history?.length) return <div className="text-sm text-muted-foreground">Nenhum histórico.</div>;

  return (
    <div className="relative space-y-4">
      {history.map((entry, i) => (
        <div key={entry.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            {i < history.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-4 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {entry.from_status && (
                <>
                  <Badge className={statusColors[entry.from_status]}>{statusLabels[entry.from_status]}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              )}
              <Badge className={statusColors[entry.to_status]}>{statusLabels[entry.to_status]}</Badge>
            </div>
            {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

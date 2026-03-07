import { useWhatsAppHandoffs, useAssignHandoff } from "../hooks/useWhatsApp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  resolved: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function WhatsAppHandoffsTab() {
  const [filter, setFilter] = useState("pending");
  const { data: handoffs, isLoading } = useWhatsAppHandoffs(filter === "all" ? undefined : filter);
  const assign = useAssignHandoff();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <CardTitle>Fila de Escalação</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="resolved">Resolvidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Carregando...</p>
        ) : !handoffs?.length ? (
          <p className="text-center py-8 text-muted-foreground">Nenhuma escalação encontrada.</p>
        ) : (
          <div className="space-y-2">
            {handoffs.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {h.whatsapp_conversations?.customers?.full_name || h.whatsapp_conversations?.phone || "—"}
                    </span>
                    <Badge className={statusColors[h.status] || ""}>{h.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Motivo: {h.reason || "—"} · {format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                </div>
                {h.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => assign.mutate({ handoffId: h.id, conversationId: h.conversation_id })}
                    disabled={assign.isPending}
                  >
                    <UserCheck className="h-4 w-4 mr-1" /> Assumir
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

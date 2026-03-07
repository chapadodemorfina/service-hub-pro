import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollectionTransfers, useUpdateTransferStatus } from "../hooks/useCollectionPoints";
import { transferStatusLabels, type TransferStatus } from "../types";
import { useState } from "react";

const statusColors: Record<TransferStatus, string> = {
  pending_pickup: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_transit_to_center: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  received_at_center: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  in_transit_to_collection_point: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  delivered_to_collection_point: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  delivered_to_customer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

const nextStatus: Partial<Record<TransferStatus, TransferStatus>> = {
  pending_pickup: "in_transit_to_center",
  in_transit_to_center: "received_at_center",
  in_transit_to_collection_point: "delivered_to_collection_point",
};

interface Props {
  cpId?: string;
  soId?: string;
}

export default function TransferTracker({ cpId, soId }: Props) {
  const { data: transfers, isLoading } = useCollectionTransfers({ cpId, soId });
  const updateStatus = useUpdateTransferStatus();

  if (isLoading) return <p className="text-muted-foreground text-sm py-4">Carregando transferências...</p>;
  if (!transfers?.length) return <p className="text-muted-foreground text-sm py-4">Nenhuma transferência registrada.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>OS</TableHead>
          {!cpId && <TableHead>Ponto de Coleta</TableHead>}
          <TableHead>Direção</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Enviado em</TableHead>
          <TableHead>Recebido em</TableHead>
          <TableHead>Código</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map(t => {
          const next = nextStatus[t.status];
          return (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-xs">{t.service_orders?.order_number}</TableCell>
              {!cpId && <TableCell>{t.collection_points?.name}</TableCell>}
              <TableCell>
                <Badge variant="outline">{t.direction === "to_center" ? "→ Centro" : "→ Ponto"}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[t.status]}>
                  {transferStatusLabels[t.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {t.transferred_at ? format(new Date(t.transferred_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {t.received_at ? format(new Date(t.received_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
              </TableCell>
              <TableCell className="text-xs font-mono">{t.tracking_code || "—"}</TableCell>
              <TableCell>
                {next && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: t.id, status: next })}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    {transferStatusLabels[next]}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

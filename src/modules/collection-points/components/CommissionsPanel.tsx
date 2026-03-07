import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollectionPointCommissions } from "../hooks/useCollectionPoints";
import { commissionTypeLabels } from "../types";

export default function CommissionsPanel({ cpId }: { cpId: string }) {
  const { data: commissions, isLoading } = useCollectionPointCommissions(cpId);

  if (isLoading) return <p className="text-muted-foreground text-sm py-4">Carregando comissões...</p>;
  if (!commissions?.length) return <p className="text-muted-foreground text-sm py-4">Nenhuma comissão registrada.</p>;

  const totalPending = commissions.filter(c => !c.is_paid).reduce((s, c) => s + c.calculated_amount, 0);
  const totalPaid = commissions.filter(c => c.is_paid).reduce((s, c) => s + c.calculated_amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">Pendente: <span className="font-semibold text-foreground">R$ {totalPending.toFixed(2)}</span></span>
        <span className="text-muted-foreground">Pago: <span className="font-semibold text-foreground">R$ {totalPaid.toFixed(2)}</span></span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OS</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs">{c.service_orders?.order_number}</TableCell>
              <TableCell>{commissionTypeLabels[c.commission_type]}</TableCell>
              <TableCell className="text-right">R$ {c.base_amount.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">R$ {c.calculated_amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={c.is_paid ? "default" : "secondary"}>
                  {c.is_paid ? "Pago" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{format(new Date(c.created_at), "dd/MM/yy", { locale: ptBR })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

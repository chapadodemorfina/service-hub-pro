import { useCustomerWarranties } from "../hooks/useWarrantyAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Props {
  customerId: string;
}

export default function CustomerWarrantyHistory({ customerId }: Props) {
  const { data: warranties, isLoading } = useCustomerWarranties(customerId);

  if (isLoading) return null;
  if (!warranties?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" /> Garantias ({warranties.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {warranties.map((w: any) => {
          const isVoid = w.is_void;
          const isExpired = !isVoid && isPast(new Date(w.end_date));
          const isActive = !isVoid && !isExpired;
          const returns = w.warranty_returns || [];

          return (
            <div key={w.id} className="p-3 rounded-lg border space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{w.warranty_number}</span>
                  <Link to={`/service-orders/${w.service_order_id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    {w.service_orders?.order_number} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                {isVoid ? (
                  <Badge variant="destructive">Anulada</Badge>
                ) : isActive ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativa</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Expirada</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(w.start_date), "dd/MM/yyyy", { locale: ptBR })} → {format(new Date(w.end_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {w.coverage_description && <p className="text-xs">{w.coverage_description}</p>}
              {returns.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs font-medium text-muted-foreground">Retornos: {returns.length}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

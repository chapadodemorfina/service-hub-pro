import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Props {
  customerId: string;
}

export function CustomerTimeline({ customerId: _customerId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          O histórico de ordens de serviço, orçamentos e interações aparecerá aqui quando os módulos correspondentes forem implementados.
        </p>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Wrench } from "lucide-react";

interface Props {
  deviceId: string;
}

export function DeviceHistory({ deviceId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico do Dispositivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <Wrench className="h-10 w-10" />
          <p className="text-sm">O histórico de ordens de serviço será exibido aqui.</p>
          <p className="text-xs">Funcionalidade disponível após a implementação do módulo de Ordens de Serviço.</p>
        </div>
      </CardContent>
    </Card>
  );
}

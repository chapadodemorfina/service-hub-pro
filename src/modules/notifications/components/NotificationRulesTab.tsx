import { useNotificationRules, useToggleRule } from "../hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const channelColors: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  email: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  sms: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  internal: "bg-muted text-muted-foreground",
};

export default function NotificationRulesTab() {
  const { data: rules, isLoading } = useNotificationRules();
  const toggleRule = useToggleRule();

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Notificação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Público</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.event_type}</TableCell>
                  <TableCell>
                    <Badge className={channelColors[r.channel] || ""}>{r.channel}</Badge>
                  </TableCell>
                  <TableCell>{r.target_audience}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.notification_templates?.name || "—"}
                  </TableCell>
                  <TableCell>{r.delay_minutes > 0 ? `${r.delay_minutes}min` : "Imediato"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={(v) => toggleRule.mutate({ id: r.id, is_active: v })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

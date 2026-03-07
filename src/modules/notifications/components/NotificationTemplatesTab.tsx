import { useState } from "react";
import { useNotificationTemplates, useUpdateTemplate } from "../hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

export default function NotificationTemplatesTab() {
  const { data: templates, isLoading } = useNotificationTemplates();
  const updateTemplate = useUpdateTemplate();
  const [editing, setEditing] = useState<any>(null);

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">Carregando...</p>;

  const handleSave = () => {
    if (!editing) return;
    updateTemplate.mutate(
      { id: editing.id, subject: editing.subject, body: editing.body },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Templates de Notificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Variáveis</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates?.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.channel}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.template_key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {Array.isArray(t.variables) ? t.variables.join(", ") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => setEditing({ ...t })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Assunto (email)</Label>
                <Input
                  value={editing.subject || ""}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                />
              </div>
              <div>
                <Label>Corpo da mensagem</Label>
                <Textarea
                  rows={8}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis disponíveis: {Array.isArray(editing.variables) ? editing.variables.map((v: string) => `{{${v}}}`).join(", ") : "—"}
                </p>
              </div>
              <Button onClick={handleSave} disabled={updateTemplate.isPending} className="w-full">
                Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

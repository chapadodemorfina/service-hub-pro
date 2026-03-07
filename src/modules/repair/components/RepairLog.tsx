import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RepairServiceFormData, repairServiceSchema, actionTypeLabels } from "../types";
import { useRepairServices, useAddRepairService } from "../hooks/useRepair";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  serviceOrderId: string;
}

export default function RepairLog({ serviceOrderId }: Props) {
  const { data: services, isLoading } = useRepairServices(serviceOrderId);
  const addService = useAddRepairService();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<RepairServiceFormData>({
    resolver: zodResolver(repairServiceSchema),
    defaultValues: { action_type: "repair", description: "", time_spent_minutes: undefined },
  });

  const handleSubmit = async (data: RepairServiceFormData) => {
    await addService.mutateAsync({ serviceOrderId, data });
    form.reset();
    setShowForm(false);
  };

  const totalMinutes = services?.reduce((sum, s) => sum + (s.time_spent_minutes || 0), 0) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" /> Execução do Reparo
        </CardTitle>
        <div className="flex items-center gap-3">
          {totalMinutes > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {hours > 0 ? `${hours}h ${mins}min` : `${mins}min`}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Registrar Ação
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-md p-4 bg-muted/30">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField control={form.control} name="action_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ação</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(actionTypeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time_spent_minutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo (minutos)</FormLabel>
                      <FormControl><Input type="number" min="0" placeholder="Ex: 30" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Descreva o que foi feito..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={addService.isPending}>Salvar</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !services?.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma ação registrada.</p>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="flex gap-3 p-3 rounded-md bg-muted/30 border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{actionTypeLabels[s.action_type] || s.action_type}</Badge>
                    {s.time_spent_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {s.time_spent_minutes}min
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{s.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(s.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

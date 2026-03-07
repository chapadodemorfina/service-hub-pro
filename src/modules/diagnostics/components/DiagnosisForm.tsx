import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DiagnosticFormData, diagnosticSchema, complexityLabels, Diagnostic } from "../types";
import { useSaveDiagnostic } from "../hooks/useDiagnostics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Save, Stethoscope } from "lucide-react";

interface Props {
  serviceOrderId: string;
  existing?: Diagnostic | null;
}

export default function DiagnosisForm({ serviceOrderId, existing }: Props) {
  const saveMutation = useSaveDiagnostic();

  const form = useForm<DiagnosticFormData>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      technical_findings: existing?.technical_findings || "",
      probable_cause: existing?.probable_cause || "",
      required_parts: existing?.required_parts || "",
      repair_complexity: existing?.repair_complexity || "moderate",
      estimated_repair_hours: existing?.estimated_repair_hours ?? undefined,
      internal_notes: existing?.internal_notes || "",
    },
  });

  const onSubmit = async (data: DiagnosticFormData) => {
    await saveMutation.mutateAsync({ id: existing?.id, serviceOrderId, data });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" /> Diagnóstico Técnico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="technical_findings" render={({ field }) => (
              <FormItem>
                <FormLabel>Achados Técnicos</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Descreva os achados da análise técnica..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="probable_cause" render={({ field }) => (
              <FormItem>
                <FormLabel>Causa Provável</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Causa raiz identificada..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="required_parts" render={({ field }) => (
              <FormItem>
                <FormLabel>Peças Necessárias</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Liste as peças necessárias para o reparo..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="repair_complexity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Complexidade do Reparo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(complexityLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="estimated_repair_hours" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo Estimado (horas)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" min="0" placeholder="Ex: 2.5" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="internal_notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Internas</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Observações internas da equipe técnica..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" /> {existing ? "Atualizar Diagnóstico" : "Salvar Diagnóstico"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

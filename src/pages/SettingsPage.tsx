import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

const db = supabase as any;

const SETTING_KEYS = [
  "company_name",
  "company_email",
  "company_phone",
  "whatsapp_support_number",
] as const;

const SETTING_LABELS: Record<string, string> = {
  company_name: "Nome da Empresa",
  company_email: "Email",
  company_phone: "Telefone",
  whatsapp_support_number: "WhatsApp Suporte (formato internacional)",
};

const SETTING_PLACEHOLDERS: Record<string, string> = {
  company_name: "Minha Empresa Ltda",
  company_email: "contato@empresa.com",
  company_phone: "(11) 0000-0000",
  whatsapp_support_number: "5511999999999",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await db
        .from("app_settings")
        .select("key, value, description")
        .in("key", [...SETTING_KEYS]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value || ""; });
      return map;
    },
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setValues({ ...settings });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = SETTING_KEYS.map((key) =>
        db.from("app_settings").upsert({
          key,
          value: values[key] || "",
          description: SETTING_LABELS[key],
        }, { onConflict: "key" })
      );
      const results = await Promise.all(updates);
      const err = results.find((r: any) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Configurações gerais do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>Informações usadas em recibos, etiquetas e portal do cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {SETTING_KEYS.map((key) => (
              <div key={key} className="space-y-2">
                <Label>{SETTING_LABELS[key]}</Label>
                <Input
                  value={values[key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={SETTING_PLACEHOLDERS[key]}
                />
              </div>
            ))}
          </div>
          <Separator />
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

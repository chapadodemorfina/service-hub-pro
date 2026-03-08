import { useCustomerByAuth } from "../hooks/usePortal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Phone, Mail, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export default function PortalSupportPage() {
  const { data: customer, isLoading: custLoading } = useCustomerByAuth();

  const { data: settings } = useQuery({
    queryKey: ["portal-support-settings"],
    queryFn: async () => {
      const { data, error } = await db
        .from("app_settings")
        .select("key, value")
        .in("key", ["whatsapp_support_number", "company_name", "support_email", "support_phone"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
  });

  if (custLoading) return <Skeleton className="h-64 w-full" />;

  const whatsappNumber = settings?.whatsapp_support_number || "";
  const companyName = settings?.company_name || "Suporte";
  const supportEmail = settings?.support_email || "";
  const supportPhone = settings?.support_phone || whatsappNumber;

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${companyName}! Sou ${customer?.full_name || "cliente"} e preciso de ajuda.`
      )}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Entre em contato conosco</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* WhatsApp */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Atendimento rápido pelo WhatsApp. Resposta em até 2 horas durante o horário comercial.
            </p>
            {whatsappUrl ? (
              <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> Iniciar Conversa
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Número de suporte não configurado.</p>
            )}
          </CardContent>
        </Card>

        {/* Phone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-5 w-5 text-primary" /> Telefone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ligue para nós durante o horário comercial.
            </p>
            {supportPhone ? (
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${supportPhone}`}>
                  <Phone className="mr-2 h-4 w-4" /> {supportPhone}
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Telefone não configurado.</p>
            )}
          </CardContent>
        </Card>

        {/* Email */}
        {supportEmail && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5 text-primary" /> Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Envie sua dúvida por email. Respondemos em até 24 horas.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href={`mailto:${supportEmail}?subject=Suporte - ${customer?.full_name || "Cliente"}`}>
                  <Mail className="mr-2 h-4 w-4" /> {supportEmail}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-5 w-5 text-primary" /> Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">Como acompanho meu reparo?</summary>
                <p className="mt-1 text-muted-foreground pl-2">Acesse "Minhas OS" no menu para ver o status atualizado de cada reparo.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">Como aprovo um orçamento?</summary>
                <p className="mt-1 text-muted-foreground pl-2">Acesse "Orçamentos" e clique em Aprovar ou Rejeitar no orçamento pendente.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">Minha garantia cobre o problema?</summary>
                <p className="mt-1 text-muted-foreground pl-2">Consulte "Garantias" para ver a cobertura. Em caso de dúvida, entre em contato pelo WhatsApp.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium hover:text-primary">Quando posso retirar meu dispositivo?</summary>
                <p className="mt-1 text-muted-foreground pl-2">Quando o status mudar para "Pronto p/ Retirada", você será notificado. Verifique em "Minhas OS".</p>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

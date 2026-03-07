import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  customerName: string;
  customerPhone?: string | null;
  orderNumber: string;
  trackingUrl: string | null;
}

export default function WhatsAppIntakeMessage({ customerName, customerPhone, orderNumber, trackingUrl }: Props) {
  const { toast } = useToast();

  const message = [
    `Olá ${customerName}!`,
    ``,
    `Seu equipamento foi registrado com sucesso.`,
    ``,
    `📋 Ordem de serviço: *${orderNumber}*`,
    trackingUrl ? `🔗 Acompanhe aqui: ${trackingUrl}` : null,
    ``,
    `Qualquer dúvida, estamos à disposição!`,
    `— i9 Solution`,
  ].filter(Boolean).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast({ title: "Mensagem copiada!" });
  };

  const phone = customerPhone?.replace(/\D/g, "") || "";
  const waUrl = phone
    ? `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> Mensagem de Entrada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-line font-mono text-xs">
          {message}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1 h-3 w-3" /> Copiar
          </Button>
          {waUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" /> Enviar no WhatsApp
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

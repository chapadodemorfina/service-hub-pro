import { useState } from "react";
import {
  useWhatsAppConversation,
  useWhatsAppMessages,
  useWhatsAppAiActions,
  useSendHumanReply,
  useResolveConversation,
} from "../hooks/useWhatsApp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, CheckCircle, Bot, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  id: string;
  onBack: () => void;
}

export default function WhatsAppConversationDetail({ id, onBack }: Props) {
  const { data: conversation } = useWhatsAppConversation(id);
  const { data: messages } = useWhatsAppMessages(id);
  const { data: actions } = useWhatsAppAiActions(id);
  const sendReply = useSendHumanReply();
  const resolve = useResolveConversation();
  const [replyText, setReplyText] = useState("");

  const handleSend = () => {
    if (!replyText.trim()) return;
    sendReply.mutate({ conversationId: id, text: replyText.trim() });
    setReplyText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{conversation?.customer_name || conversation?.phone}</h2>
          <p className="text-sm text-muted-foreground">{conversation?.phone}</p>
        </div>
        <Badge variant="outline">{conversation?.status}</Badge>
        {conversation?.status !== "resolved" && (
          <Button variant="outline" size="sm" onClick={() => resolve.mutate(id)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Resolver
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {messages?.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === "inbound" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.direction === "inbound"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <div className="flex items-center gap-1 mb-0.5 opacity-70">
                      {m.direction === "inbound" ? <User className="h-3 w-3" /> : m.sent_by_user_id ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                      <span className="text-[10px]">
                        {format(new Date(m.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                      {m.intent && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-auto ml-1">{m.intent}</Badge>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{m.text_content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {conversation?.status !== "resolved" && (
            <>
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Responder como atendente..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button onClick={handleSend} disabled={!replyText.trim() || sendReply.isPending} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {actions && actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações da IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actions.map((a: any) => (
                <div key={a.id} className="text-xs border rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.success ? "default" : "destructive"} className="text-[10px]">
                      {a.action_type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {format(new Date(a.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  {a.action_payload && Object.keys(a.action_payload).length > 0 && (
                    <pre className="text-[10px] text-muted-foreground mt-1 overflow-hidden max-w-full truncate">
                      {JSON.stringify(a.action_payload).substring(0, 150)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

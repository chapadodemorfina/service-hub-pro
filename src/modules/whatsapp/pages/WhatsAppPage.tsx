import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import WhatsAppConversationsTab from "../components/WhatsAppConversationsTab";
import WhatsAppHandoffsTab from "../components/WhatsAppHandoffsTab";

export default function WhatsAppPage() {
  const [tab, setTab] = useState("conversations");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> WhatsApp
        </h1>
        <p className="text-muted-foreground">
          Gerencie conversas, atendimentos e escalações
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="handoffs">Fila de Atendimento</TabsTrigger>
        </TabsList>
        <TabsContent value="conversations"><WhatsAppConversationsTab /></TabsContent>
        <TabsContent value="handoffs"><WhatsAppHandoffsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

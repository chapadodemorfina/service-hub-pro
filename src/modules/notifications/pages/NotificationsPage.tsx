import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";
import NotificationRulesTab from "../components/NotificationRulesTab";
import NotificationTemplatesTab from "../components/NotificationTemplatesTab";
import NotificationQueueTab from "../components/NotificationQueueTab";
import NotificationLogsTab from "../components/NotificationLogsTab";

export default function NotificationsPage() {
  const [tab, setTab] = useState("rules");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Notificações
        </h1>
        <p className="text-muted-foreground">
          Gerencie regras, templates, fila e logs de notificações
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="queue">Fila</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="rules"><NotificationRulesTab /></TabsContent>
        <TabsContent value="templates"><NotificationTemplatesTab /></TabsContent>
        <TabsContent value="queue"><NotificationQueueTab /></TabsContent>
        <TabsContent value="logs"><NotificationLogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

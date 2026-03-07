import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Package } from "lucide-react";
import { DeviceAccessory, defaultAccessories } from "../types";
import { useDeviceAccessories, useSaveAccessory, useDeleteAccessory, useBulkCreateAccessories } from "../hooks/useDevices";

interface Props {
  deviceId: string;
}

export function AccessoryChecklist({ deviceId }: Props) {
  const { data: accessories = [], isLoading } = useDeviceAccessories(deviceId);
  const saveAccessory = useSaveAccessory();
  const deleteAccessory = useDeleteAccessory();
  const bulkCreate = useBulkCreateAccessories();
  const [newName, setNewName] = useState("");

  const handleInitDefaults = () => {
    const existing = accessories.map((a) => a.name.toLowerCase());
    const toCreate = defaultAccessories
      .filter((name) => !existing.includes(name.toLowerCase()))
      .map((name) => ({ name, delivered: false }));
    if (toCreate.length) bulkCreate.mutate({ deviceId, accessories: toCreate });
  };

  const handleToggle = (acc: DeviceAccessory) => {
    saveAccessory.mutate({
      id: acc.id,
      deviceId,
      data: { name: acc.name, delivered: !acc.delivered, notes: acc.notes || "" },
    });
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    saveAccessory.mutate({ deviceId, data: { name: newName.trim(), delivered: false, notes: "" } });
    setNewName("");
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Carregando...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" /> Acessórios Entregues
        </CardTitle>
        {accessories.length === 0 && (
          <Button size="sm" variant="outline" onClick={handleInitDefaults}>
            Carregar lista padrão
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {accessories.map((acc) => (
          <div key={acc.id} className="flex items-center gap-3">
            <Checkbox
              checked={acc.delivered}
              onCheckedChange={() => handleToggle(acc)}
            />
            <span className={`text-sm flex-1 ${acc.delivered ? "" : "text-muted-foreground"}`}>{acc.name}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => deleteAccessory.mutate({ id: acc.id, deviceId })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Adicionar acessório..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            className="flex-1"
          />
          <Button size="sm" variant="outline" onClick={handleAdd} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

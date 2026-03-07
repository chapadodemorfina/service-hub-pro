import { useState } from "react";
import { ServiceOrderStatus, statusLabels, statusTransitions } from "../types";
import { useChangeStatus } from "../hooks/useServiceOrders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  orderId: string;
  currentStatus: ServiceOrderStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StatusChangeDialog({ orderId, currentStatus, open, onOpenChange }: Props) {
  const [toStatus, setToStatus] = useState<ServiceOrderStatus | "">("");
  const [notes, setNotes] = useState("");
  const changeStatus = useChangeStatus();

  const allowedTransitions = statusTransitions[currentStatus] || [];

  const handleSubmit = async () => {
    if (!toStatus) return;
    await changeStatus.mutateAsync({
      id: orderId,
      fromStatus: currentStatus,
      toStatus: toStatus as ServiceOrderStatus,
      notes: notes || undefined,
    });
    onOpenChange(false);
    setToStatus("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Status atual</Label>
            <p className="text-sm font-medium">{statusLabels[currentStatus]}</p>
          </div>
          <div>
            <Label>Novo status</Label>
            <Select value={toStatus} onValueChange={(v) => setToStatus(v as ServiceOrderStatus)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {allowedTransitions.map((s) => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observação (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Motivo da mudança..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!toStatus || changeStatus.isPending}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

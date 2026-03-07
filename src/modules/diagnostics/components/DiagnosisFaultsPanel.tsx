import { useState } from "react";
import { useDiagnosisFaults, useAddDiagnosisFault, useToggleFaultConfirmed, useDeleteDiagnosisFault } from "../hooks/useDiagnostics";
import { FaultSeverity, faultSeverityLabels, faultSeverityColors } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  diagnosisId: string;
  readOnly?: boolean;
}

export default function DiagnosisFaultsPanel({ diagnosisId, readOnly }: Props) {
  const { data: faults, isLoading } = useDiagnosisFaults(diagnosisId);
  const addFault = useAddDiagnosisFault();
  const toggleConfirm = useToggleFaultConfirmed();
  const deleteFault = useDeleteDiagnosisFault();
  const [faultType, setFaultType] = useState("");
  const [severity, setSeverity] = useState<FaultSeverity>("moderate");

  const handleAdd = async () => {
    if (!faultType.trim()) return;
    await addFault.mutateAsync({ diagnosisId, faultType: faultType.trim(), severity });
    setFaultType("");
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-3">
      {faults?.map((fault) => (
        <div key={fault.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
          {!readOnly && (
            <Checkbox
              checked={fault.confirmed}
              onCheckedChange={(checked) =>
                toggleConfirm.mutate({ id: fault.id, diagnosisId, confirmed: !!checked })
              }
            />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{fault.fault_type}</span>
            {fault.fault_description && (
              <p className="text-xs text-muted-foreground">{fault.fault_description}</p>
            )}
          </div>
          <Badge className={faultSeverityColors[fault.severity]} variant="secondary">
            {faultSeverityLabels[fault.severity]}
          </Badge>
          {fault.confirmed && <Badge variant="default" className="text-xs">Confirmado</Badge>}
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => deleteFault.mutate({ id: fault.id, diagnosisId })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="flex gap-2 pt-2">
          <Input
            value={faultType}
            onChange={(e) => setFaultType(e.target.value)}
            placeholder="Tipo de defeito..."
            className="h-8 flex-1"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          />
          <Select value={severity} onValueChange={(v) => setSeverity(v as FaultSeverity)}>
            <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(faultSeverityLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleAdd} disabled={addFault.isPending}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {(!faults || faults.length === 0) && (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum defeito registrado.</p>
      )}
    </div>
  );
}

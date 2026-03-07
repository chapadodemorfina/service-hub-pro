import { useState } from "react";
import { useDiagnosisTests, useAddDiagnosisTest, useUpdateTestResult, useDeleteDiagnosisTest } from "../hooks/useDiagnostics";
import { TestResult, testResultLabels, testResultColors } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  diagnosisId: string;
  readOnly?: boolean;
}

export default function DiagnosisTestsPanel({ diagnosisId, readOnly }: Props) {
  const { data: tests, isLoading } = useDiagnosisTests(diagnosisId);
  const addTest = useAddDiagnosisTest();
  const updateResult = useUpdateTestResult();
  const deleteTest = useDeleteDiagnosisTest();
  const [newTestName, setNewTestName] = useState("");

  const handleAdd = async () => {
    if (!newTestName.trim()) return;
    await addTest.mutateAsync({ diagnosisId, testName: newTestName.trim() });
    setNewTestName("");
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-3">
      {tests?.map((test) => (
        <div key={test.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{test.test_name}</span>
              {test.test_category && (
                <span className="text-xs text-muted-foreground">({test.test_category})</span>
              )}
            </div>
            {test.notes && <p className="text-xs text-muted-foreground mt-0.5">{test.notes}</p>}
          </div>
          <Select
            value={test.test_result}
            onValueChange={(val) => updateResult.mutate({ id: test.id, diagnosisId, result: val as TestResult })}
            disabled={readOnly}
          >
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(testResultLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className={testResultColors[test.test_result]} variant="secondary">
            {testResultLabels[test.test_result]}
          </Badge>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => deleteTest.mutate({ id: test.id, diagnosisId })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="flex gap-2 pt-2">
          <Input
            value={newTestName}
            onChange={(e) => setNewTestName(e.target.value)}
            placeholder="Adicionar teste..."
            className="h-8"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          />
          <Button variant="outline" size="sm" onClick={handleAdd} disabled={addTest.isPending}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {(!tests || tests.length === 0) && !readOnly && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum teste registrado. Use "Carregar Template" para começar.
        </p>
      )}
    </div>
  );
}

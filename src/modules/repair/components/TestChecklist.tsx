import { useRepairTests, useInitializeTests, useUpdateTest } from "../hooks/useRepair";
import { defaultTests } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, ListChecks, X, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  serviceOrderId: string;
}

export default function TestChecklist({ serviceOrderId }: Props) {
  const { data: tests, isLoading } = useRepairTests(serviceOrderId);
  const initTests = useInitializeTests();
  const updateTest = useUpdateTest();

  const handleInit = () => {
    initTests.mutate({ serviceOrderId, testNames: defaultTests });
  };

  const handleToggle = (test: typeof tests extends (infer T)[] | undefined ? T : never, passed: boolean) => {
    const newPassed = test.passed === passed ? null : passed;
    updateTest.mutate({ id: test.id, serviceOrderId, passed: newPassed });
  };

  const allTested = tests?.every((t) => t.passed !== null) || false;
  const allPassed = tests?.every((t) => t.passed === true) || false;
  const passedCount = tests?.filter((t) => t.passed === true).length || 0;
  const failedCount = tests?.filter((t) => t.passed === false).length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" /> Checklist de Testes
        </CardTitle>
        {tests && tests.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" />{passedCount}</span>
            <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" />{failedCount}</span>
            {allTested && allPassed && (
              <span className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                Aprovado
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !tests?.length ? (
          <div className="text-center py-6">
            <ListChecks className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-3">Nenhum teste criado para esta OS.</p>
            <Button onClick={handleInit} disabled={initTests.isPending}>
              Criar Checklist Padrão
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tests.map((test) => (
              <div key={test.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 border">
                <span className="flex-1 text-sm">{test.test_name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon" variant={test.passed === true ? "default" : "ghost"}
                    className={`h-7 w-7 ${test.passed === true ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                    onClick={() => handleToggle(test, true)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon" variant={test.passed === false ? "destructive" : "ghost"}
                    className="h-7 w-7"
                    onClick={() => handleToggle(test, false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

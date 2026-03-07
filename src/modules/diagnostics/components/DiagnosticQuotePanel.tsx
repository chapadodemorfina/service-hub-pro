import { useState } from "react";
import { useDiagnostic, useQuotes, useCreateQuote } from "../hooks/useDiagnostics";
import DiagnosisForm from "./DiagnosisForm";
import QuoteBuilder from "./QuoteBuilder";
import ApprovalControls from "./ApprovalControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Stethoscope, FileText, Plus } from "lucide-react";

interface Props {
  serviceOrderId: string;
}

export default function DiagnosticQuotePanel({ serviceOrderId }: Props) {
  const { data: diagnostic, isLoading: diagLoading } = useDiagnostic(serviceOrderId);
  const { data: quotes, isLoading: quotesLoading } = useQuotes(serviceOrderId);
  const createQuote = useCreateQuote();
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
  const [analysisFee, setAnalysisFee] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleCreateQuote = async () => {
    await createQuote.mutateAsync({
      serviceOrderId,
      analysisFee: analysisFee ? parseFloat(analysisFee) : undefined,
      expiresAt: expiresAt || undefined,
    });
    setNewQuoteOpen(false);
    setAnalysisFee("");
    setExpiresAt("");
  };

  return (
    <Tabs defaultValue="diagnosis" className="space-y-4">
      <TabsList>
        <TabsTrigger value="diagnosis" className="gap-2">
          <Stethoscope className="h-4 w-4" /> Diagnóstico
        </TabsTrigger>
        <TabsTrigger value="quotes" className="gap-2">
          <FileText className="h-4 w-4" /> Orçamentos
          {quotes && quotes.length > 0 && (
            <span className="ml-1 bg-primary/10 text-primary text-xs rounded-full px-1.5">{quotes.length}</span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="diagnosis">
        {diagLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <DiagnosisForm serviceOrderId={serviceOrderId} existing={diagnostic} />
        )}
      </TabsContent>

      <TabsContent value="quotes" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setNewQuoteOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Novo Orçamento
          </Button>
        </div>

        {quotesLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !quotes?.length ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum orçamento criado para esta OS.</p>
            </CardContent>
          </Card>
        ) : (
          quotes.map((q) => (
            <div key={q.id} className="space-y-4">
              <QuoteBuilder quote={q} />
              <ApprovalControls quote={q} serviceOrderId={serviceOrderId} />
            </div>
          ))
        )}

        {/* New Quote Dialog */}
        <Dialog open={newQuoteOpen} onOpenChange={setNewQuoteOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Taxa de Análise (R$)</Label>
                <Input type="number" step="0.01" min="0" value={analysisFee}
                  onChange={(e) => setAnalysisFee(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Validade do Orçamento</Label>
                <Input type="datetime-local" value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewQuoteOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateQuote} disabled={createQuote.isPending}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
}

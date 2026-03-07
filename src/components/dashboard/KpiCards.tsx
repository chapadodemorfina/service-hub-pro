import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, DollarSign, Clock, CheckCircle, AlertTriangle, TrendingUp, Wrench, Shield } from "lucide-react";

interface Props {
  totalOrders: number;
  openOrders: number;
  avgTurnaroundHours: number | null;
  quoteApprovalRate: number | null;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  warrantyReturnRate: number | null;
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function KpiCards(props: Props) {
  const cards = [
    { title: "Ordens de Serviço", value: String(props.totalOrders), sub: `${props.openOrders} em aberto`, icon: ClipboardList, color: "text-chart-1" },
    { title: "Tempo Médio (h)", value: props.avgTurnaroundHours != null ? `${props.avgTurnaroundHours}h` : "—", sub: "Recebido → Entregue", icon: Clock, color: "text-chart-3" },
    { title: "Aprovação de Orçamento", value: props.quoteApprovalRate != null ? `${props.quoteApprovalRate}%` : "—", sub: "Taxa de aprovação", icon: CheckCircle, color: "text-chart-2" },
    { title: "Receita", value: fmt(props.totalRevenue), sub: "No período", icon: DollarSign, color: "text-chart-2" },
    { title: "Despesas", value: fmt(props.totalExpenses), sub: "No período", icon: AlertTriangle, color: "text-chart-4" },
    { title: "Lucro", value: fmt(props.profit), sub: "Receita - Despesas", icon: TrendingUp, color: props.profit >= 0 ? "text-chart-2" : "text-chart-4" },
    { title: "Retorno em Garantia", value: props.warrantyReturnRate != null ? `${props.warrantyReturnRate}%` : "—", sub: "Taxa de retorno", icon: Shield, color: "text-chart-5" },
    { title: "OS em Reparo", value: String(props.openOrders), sub: "Aguardando conclusão", icon: Wrench, color: "text-chart-1" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

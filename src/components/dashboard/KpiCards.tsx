import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList, DollarSign, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Wrench, Shield, Package, Stethoscope, Receipt, Zap,
} from "lucide-react";

interface Props {
  totalOrders: number;
  openOrders: number;
  avgTurnaroundHours: number | null;
  quoteApprovalRate: number | null;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  warrantyReturnRate: number | null;
  slaOverdueCount?: number;
  // New BI props
  todayReceived?: number;
  todayDelivered?: number;
  todayRevenue?: number;
  todayQuotes?: number;
  avgDiagnosisHours?: number | null;
  avgTicketValue?: number | null;
  totalCommissions?: number;
  stockValue?: number;
  lowStockCount?: number;
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function KpiCards(props: Props) {
  const todayCards = [
    { title: "Recebidos Hoje", value: String(props.todayReceived ?? 0), icon: Package, color: "text-chart-1" },
    { title: "Entregues Hoje", value: String(props.todayDelivered ?? 0), icon: CheckCircle, color: "text-chart-2" },
    { title: "Receita Hoje", value: fmt(props.todayRevenue ?? 0), icon: DollarSign, color: "text-chart-2" },
    { title: "Orçamentos Hoje", value: String(props.todayQuotes ?? 0), icon: Receipt, color: "text-chart-3" },
  ];

  const mainCards = [
    { title: "Ordens de Serviço", value: String(props.totalOrders), sub: `${props.openOrders} em aberto`, icon: ClipboardList, color: "text-chart-1" },
    { title: "Receita (período)", value: fmt(props.totalRevenue), sub: `Comissões: ${fmt(props.totalCommissions ?? 0)}`, icon: DollarSign, color: "text-chart-2" },
    { title: "Despesas", value: fmt(props.totalExpenses), sub: "No período", icon: AlertTriangle, color: "text-chart-4" },
    { title: "Lucro", value: fmt(props.profit), sub: "Receita - Despesas", icon: TrendingUp, color: props.profit >= 0 ? "text-chart-2" : "text-destructive" },
    { title: "Aprovação Orçamento", value: props.quoteApprovalRate != null ? `${props.quoteApprovalRate}%` : "—", sub: "Taxa de aprovação", icon: CheckCircle, color: "text-chart-2" },
    { title: "Tempo Médio (h)", value: props.avgTurnaroundHours != null ? `${props.avgTurnaroundHours}h` : "—", sub: "Recebido → Entregue", icon: Clock, color: "text-chart-3" },
    { title: "Diagnóstico Médio", value: props.avgDiagnosisHours != null ? `${props.avgDiagnosisHours}h` : "—", sub: "Tempo de diagnóstico", icon: Stethoscope, color: "text-chart-5" },
    { title: "Ticket Médio", value: props.avgTicketValue != null ? fmt(props.avgTicketValue) : "—", sub: "Orçamentos aprovados", icon: Zap, color: "text-chart-1" },
    { title: "Retorno Garantia", value: props.warrantyReturnRate != null ? `${props.warrantyReturnRate}%` : "—", sub: "Taxa de retorno", icon: Shield, color: "text-chart-5" },
    { title: "SLA Excedido", value: props.slaOverdueCount != null ? String(props.slaOverdueCount) : "—", sub: "OS fora do prazo", icon: Wrench, color: (props.slaOverdueCount || 0) > 0 ? "text-destructive" : "text-chart-1" },
    { title: "Valor em Estoque", value: fmt(props.stockValue ?? 0), sub: `${props.lowStockCount ?? 0} em baixa`, icon: Package, color: "text-chart-3" },
  ];

  return (
    <div className="space-y-4">
      {/* Today strip */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {todayCards.map((card) => (
          <Card key={card.title} className="border-primary/20 bg-primary/5">
            <CardContent className="pt-3 pb-2 px-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                <span className="text-[11px] font-medium text-muted-foreground">{card.title}</span>
              </div>
              <p className="text-lg font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {mainCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              </div>
              <p className="text-xl font-bold">{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

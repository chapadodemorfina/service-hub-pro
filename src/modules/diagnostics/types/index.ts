import { z } from "zod";

export type RepairComplexity = "simple" | "moderate" | "complex" | "specialized";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type QuoteItemType = "labor" | "part";
export type DiagnosisStatus = "in_progress" | "completed" | "cancelled";
export type RepairViability = "repairable" | "not_repairable" | "uncertain";
export type TestResult = "pass" | "fail" | "abnormal" | "inconclusive" | "not_tested";
export type FaultSeverity = "minor" | "moderate" | "severe" | "critical";

export const complexityLabels: Record<RepairComplexity, string> = {
  simple: "Simples",
  moderate: "Moderada",
  complex: "Complexa",
  specialized: "Especializada",
};

export const diagnosisStatusLabels: Record<DiagnosisStatus, string> = {
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const viabilityLabels: Record<RepairViability, string> = {
  repairable: "Reparável",
  not_repairable: "Não Reparável",
  uncertain: "Incerto",
};

export const testResultLabels: Record<TestResult, string> = {
  pass: "OK",
  fail: "Falha",
  abnormal: "Anormal",
  inconclusive: "Inconclusivo",
  not_tested: "Não Testado",
};

export const testResultColors: Record<TestResult, string> = {
  pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  abnormal: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  inconclusive: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  not_tested: "bg-muted text-muted-foreground",
};

export const faultSeverityLabels: Record<FaultSeverity, string> = {
  minor: "Leve",
  moderate: "Moderada",
  severe: "Grave",
  critical: "Crítica",
};

export const faultSeverityColors: Record<FaultSeverity, string> = {
  minor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  severe: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
};

export const quoteStatusColors: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export const itemTypeLabels: Record<QuoteItemType, string> = {
  labor: "Mão de Obra",
  part: "Peça / Material",
};

export interface Diagnostic {
  id: string;
  service_order_id: string;
  technical_findings: string | null;
  probable_cause: string | null;
  required_parts: string | null;
  repair_complexity: RepairComplexity;
  estimated_repair_hours: number | null;
  internal_notes: string | null;
  diagnosed_by: string | null;
  diagnosis_status: DiagnosisStatus;
  repair_viability: RepairViability | null;
  diagnosis_started_at: string | null;
  diagnosis_completed_at: string | null;
  estimated_cost: number;
  not_repairable_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisTest {
  id: string;
  diagnosis_id: string;
  test_name: string;
  test_category: string | null;
  test_result: TestResult;
  measured_value: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface DiagnosisFault {
  id: string;
  diagnosis_id: string;
  fault_type: string;
  fault_description: string | null;
  severity: FaultSeverity;
  confirmed: boolean;
  created_at: string;
}

export interface DiagnosisPart {
  id: string;
  diagnosis_id: string;
  part_name: string;
  quantity: number;
  estimated_unit_cost: number;
  product_id: string | null;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

export interface RepairQuote {
  id: string;
  service_order_id: string;
  quote_number: string;
  status: QuoteStatus;
  discount_percent: number;
  discount_amount: number;
  analysis_fee: number;
  total_amount: number;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepairQuoteItem {
  id: string;
  quote_id: string;
  item_type: QuoteItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

export interface QuoteApproval {
  id: string;
  quote_id: string;
  decision: QuoteStatus;
  decided_by_name: string | null;
  decided_by_role: string | null;
  reason: string | null;
  charge_analysis_fee: boolean;
  created_at: string;
}

export const diagnosticSchema = z.object({
  technical_findings: z.string().trim().max(4000).optional().or(z.literal("")),
  probable_cause: z.string().trim().max(2000).optional().or(z.literal("")),
  required_parts: z.string().trim().max(2000).optional().or(z.literal("")),
  repair_complexity: z.enum(["simple", "moderate", "complex", "specialized"] as const),
  estimated_repair_hours: z.coerce.number().min(0).max(999).optional(),
  internal_notes: z.string().trim().max(2000).optional().or(z.literal("")),
  repair_viability: z.enum(["repairable", "not_repairable", "uncertain"] as const).optional(),
  not_repairable_reason: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type DiagnosticFormData = z.infer<typeof diagnosticSchema>;

export const quoteItemSchema = z.object({
  item_type: z.enum(["labor", "part"] as const),
  description: z.string().trim().min(1, "Descrição obrigatória").max(500),
  quantity: z.coerce.number().min(0.01, "Quantidade inválida"),
  unit_price: z.coerce.number().min(0, "Preço inválido"),
});

export type QuoteItemFormData = z.infer<typeof quoteItemSchema>;

// ─── Test Templates by Device Type ─────────────────────────────
export const testTemplates: Record<string, { name: string; category: string }[]> = {
  notebook: [
    { name: "Teste de energia", category: "Energia" },
    { name: "Inspeção placa-mãe", category: "Hardware" },
    { name: "Teste de RAM", category: "Hardware" },
    { name: "Teste de armazenamento", category: "Hardware" },
    { name: "Teste de display", category: "Display" },
    { name: "Teste de bateria", category: "Energia" },
    { name: "Teste térmico", category: "Térmico" },
    { name: "Teste de teclado", category: "Periféricos" },
    { name: "Teste de Wi-Fi", category: "Conectividade" },
  ],
  desktop_pc: [
    { name: "Teste de energia / fonte", category: "Energia" },
    { name: "Inspeção placa-mãe", category: "Hardware" },
    { name: "Teste de RAM", category: "Hardware" },
    { name: "Teste de armazenamento", category: "Hardware" },
    { name: "Teste de GPU", category: "Hardware" },
    { name: "Teste térmico", category: "Térmico" },
    { name: "Teste de periféricos USB", category: "Periféricos" },
  ],
  smartphone: [
    { name: "Teste de carregamento", category: "Energia" },
    { name: "Saúde da bateria", category: "Energia" },
    { name: "Teste de tela touch", category: "Display" },
    { name: "Teste de câmera", category: "Câmera" },
    { name: "Teste de microfone", category: "Áudio" },
    { name: "Teste de alto-falante", category: "Áudio" },
    { name: "Teste de rede / sinal", category: "Conectividade" },
    { name: "Teste de Wi-Fi", category: "Conectividade" },
    { name: "Teste de biometria", category: "Sensores" },
  ],
  tablet: [
    { name: "Teste de carregamento", category: "Energia" },
    { name: "Saúde da bateria", category: "Energia" },
    { name: "Teste de tela touch", category: "Display" },
    { name: "Teste de câmera", category: "Câmera" },
    { name: "Teste de Wi-Fi", category: "Conectividade" },
    { name: "Teste de alto-falante", category: "Áudio" },
  ],
  tv: [
    { name: "Teste de energia", category: "Energia" },
    { name: "Teste de imagem", category: "Display" },
    { name: "Teste de som", category: "Áudio" },
    { name: "Teste de HDMI", category: "Conectividade" },
    { name: "Teste de controle remoto", category: "Periféricos" },
    { name: "Inspeção de backlight", category: "Display" },
  ],
  monitor: [
    { name: "Teste de energia", category: "Energia" },
    { name: "Teste de imagem", category: "Display" },
    { name: "Teste de conectores", category: "Conectividade" },
    { name: "Inspeção de backlight", category: "Display" },
  ],
  printer: [
    { name: "Teste de energia", category: "Energia" },
    { name: "Teste de impressão", category: "Funcional" },
    { name: "Teste de alimentação de papel", category: "Mecânico" },
    { name: "Teste de conectividade", category: "Conectividade" },
  ],
  other: [
    { name: "Teste de energia", category: "Energia" },
    { name: "Inspeção visual", category: "Geral" },
    { name: "Teste funcional", category: "Funcional" },
  ],
};

import { z } from "zod";

export type RepairComplexity = "simple" | "moderate" | "complex" | "specialized";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type QuoteItemType = "labor" | "part";

export const complexityLabels: Record<RepairComplexity, string> = {
  simple: "Simples",
  moderate: "Moderada",
  complex: "Complexa",
  specialized: "Especializada",
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
  created_at: string;
  updated_at: string;
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
});

export type DiagnosticFormData = z.infer<typeof diagnosticSchema>;

export const quoteItemSchema = z.object({
  item_type: z.enum(["labor", "part"] as const),
  description: z.string().trim().min(1, "Descrição obrigatória").max(500),
  quantity: z.coerce.number().min(0.01, "Quantidade inválida"),
  unit_price: z.coerce.number().min(0, "Preço inválido"),
});

export type QuoteItemFormData = z.infer<typeof quoteItemSchema>;

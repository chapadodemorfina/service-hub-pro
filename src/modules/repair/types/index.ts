import { z } from "zod";

export interface RepairService {
  id: string;
  service_order_id: string;
  action_type: string;
  description: string;
  technician_id: string | null;
  time_spent_minutes: number | null;
  created_at: string;
}

export interface RepairTest {
  id: string;
  service_order_id: string;
  test_name: string;
  passed: boolean | null;
  notes: string | null;
  tested_by: string | null;
  tested_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Warranty {
  id: string;
  service_order_id: string;
  warranty_number: string;
  start_date: string;
  end_date: string;
  coverage_description: string | null;
  terms: string | null;
  is_void: boolean;
  created_by: string | null;
  created_at: string;
}

export interface WarrantyReturn {
  id: string;
  warranty_id: string;
  original_service_order_id: string;
  new_service_order_id: string | null;
  reason: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const repairServiceSchema = z.object({
  action_type: z.enum(["note", "repair", "replacement", "cleaning", "firmware", "other"] as const),
  description: z.string().trim().min(1, "Descrição obrigatória").max(2000),
  time_spent_minutes: z.coerce.number().min(0).optional(),
});

export type RepairServiceFormData = z.infer<typeof repairServiceSchema>;

export const actionTypeLabels: Record<string, string> = {
  note: "Anotação",
  repair: "Reparo",
  replacement: "Substituição",
  cleaning: "Limpeza",
  firmware: "Firmware/Software",
  other: "Outro",
};

export const defaultTests = [
  "Liga corretamente",
  "Imagem OK",
  "Áudio OK",
  "Carregamento OK",
  "Temperatura OK",
  "Portas/Conexões OK",
  "Wi-Fi/Bluetooth OK",
  "Teclado/Touch OK",
  "Teste de estresse OK",
];

export const warrantyReturnSchema = z.object({
  reason: z.string().trim().min(1, "Motivo obrigatório").max(2000),
});

export type WarrantyReturnFormData = z.infer<typeof warrantyReturnSchema>;

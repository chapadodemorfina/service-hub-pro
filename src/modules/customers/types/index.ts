import { z } from "zod";

export type CustomerType = "individual" | "business";

export interface Customer {
  id: string;
  type: CustomerType;
  full_name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export const customerSchema = z.object({
  type: z.enum(["individual", "business"]),
  full_name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  document: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Rótulo obrigatório").max(50),
  street: z.string().trim().max(200).optional().or(z.literal("")),
  number: z.string().trim().max(20).optional().or(z.literal("")),
  complement: z.string().trim().max(100).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  zip_code: z.string().trim().max(10).optional().or(z.literal("")),
  is_default: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(200),
  role: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
});

export type ContactFormData = z.infer<typeof contactSchema>;

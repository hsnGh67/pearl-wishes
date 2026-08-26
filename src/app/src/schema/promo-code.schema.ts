import { z } from "zod";

// ─── Literal union types (kept for existing imports) ─────────────────────────

export type DiscountType = "percentage" | "fixed";
export type AppliesToType = "all" | "treatments" | "workshops" | "specific";
export type AssignType = "all" | "specific" | "filter";
export type UsagePerUser = "once" | "multiple";
export type GlobalUsage = "unlimited" | "limited";
export type PromoCodeStatus = "Active" | "Scheduled" | "Expired" | "Disabled";

// ─── Zod runtime schemas ───────────────────────────────────────────────────────

export const PromoCodeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .transform((v) => v.toUpperCase().trim()),
  discount_type: z.enum(["percentage", "fixed"] as const),
  discount_value: z.number().positive("Discount value must be positive"),
  max_cap: z.number().min(0).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_active: z.boolean(),
  applies_to: z.enum(["all", "treatments", "workshops", "specific"] as const),
  assign_to: z.enum(["all", "specific", "filter"] as const),
  per_user_usage: z.enum(["once", "multiple"] as const),
  per_user_limit: z.number().int().positive().nullable().optional(),
  global_usage: z.enum(["unlimited", "limited"] as const),
  global_limit: z.number().int().positive().nullable().optional(),
  usage_count: z.number().int().min(0).default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PromoCodeCreateSchema = PromoCodeSchema.omit({
  id: true,
  usage_count: true,
  created_at: true,
  updated_at: true,
});

export const PromoCodeUpdateSchema = PromoCodeCreateSchema.partial();

// ─── Inferred types ───────────────────────────────────────────────────────────

export type PromoCode = z.infer<typeof PromoCodeSchema>;
export type PromoCodeCreateInput = z.infer<typeof PromoCodeCreateSchema>;
export type PromoCodeUpdateInput = z.infer<typeof PromoCodeUpdateSchema>;

/** Backward-compat alias — existing code imports PromoCodeInput */
export type PromoCodeInput = PromoCodeCreateInput;

// ─── Related types ────────────────────────────────────────────────────────────

export interface PromoCodeUsage {
  id: string;
  promo_code_id: string;
  booking_id?: string | null;
  user_id?: string | null;
  discount_applied: number;
  original_total?: number | null;
  final_total?: number | null;
  used_at: string;
}

export type PromoValidationResult =
  | {
      valid: true;
      promoCodeId: string;
      code: string;
      discountAmount: number;
      finalTotal: number;
    }
  | { valid: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPromoStatus(promo: PromoCode): PromoCodeStatus {
  if (!promo.is_active) return "Disabled";
  const today = new Date().toISOString().split("T")[0];
  if (promo.start_date && promo.start_date > today) return "Scheduled";
  if (promo.end_date && promo.end_date < today) return "Expired";
  return "Active";
}

export function formatUsage(promo: PromoCode): string {
  if (promo.global_usage === "limited" && promo.global_limit != null)
    return `${promo.usage_count}/${promo.global_limit}`;
  return `${promo.usage_count} used`;
}

export function formatDiscount(promo: PromoCode): string {
  if (promo.discount_type === "percentage")
    return `${promo.discount_value}% off`;
  return `£${Number(promo.discount_value).toFixed(2)} off`;
}

export function calculateDiscount(promo: PromoCode, subtotal: number): number {
  let discount =
    promo.discount_type === "percentage"
      ? (subtotal * promo.discount_value) / 100
      : promo.discount_value;
  if (promo.max_cap != null) discount = Math.min(discount, promo.max_cap);
  return Math.min(discount, subtotal);
}

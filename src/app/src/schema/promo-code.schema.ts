export type DiscountType = "percentage" | "fixed";
export type AppliesToType = "all" | "treatments" | "workshops" | "specific";
export type AssignType = "all" | "specific" | "filter";
export type UsagePerUser = "once" | "multiple";
export type GlobalUsage = "unlimited" | "limited";
export type PromoCodeStatus = "Active" | "Scheduled" | "Expired" | "Disabled";

export interface PromoCode {
  id: string;
  name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_cap?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  applies_to: AppliesToType;
  assign_to: AssignType;
  per_user_usage: UsagePerUser;
  per_user_limit?: number | null;
  global_usage: GlobalUsage;
  global_limit?: number | null;
  usage_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PromoCodeInput {
  name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_cap?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  applies_to: AppliesToType;
  assign_to: AssignType;
  per_user_usage: UsagePerUser;
  per_user_limit?: number | null;
  global_usage: GlobalUsage;
  global_limit?: number | null;
}

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
  | { valid: true; promoCodeId: string; code: string; discountAmount: number; finalTotal: number }
  | { valid: false; error: string };

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
  if (promo.discount_type === "percentage") return `${promo.discount_value}% off`;
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

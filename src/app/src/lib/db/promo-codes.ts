import { supabase } from "../../config/supabase";
import {
  PromoCode,
  PromoCodeInput,
  PromoCodeUsage,
  PromoValidationResult,
  AppliesToType,
  calculateDiscount,
} from "../../schema/promo-code.schema";

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getActivePromoCodesForBooking(): Promise<PromoCode[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("is_active", true)
    .gte("end_date", today)
    .lte("start_date", today)
    .eq("assign_to", "all")
    .or(`applies_to.eq.all,applies_to.eq.treatments`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPromoCodeById(id: string): Promise<PromoCode | null> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getPromoCodeByCode(
  code: string,
): Promise<PromoCode | null> {
  const { data } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", code.toUpperCase().trim())
    .maybeSingle();
  console.log("prome data ===>", data);
  return data ?? null;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createPromoCode(
  input: PromoCodeInput,
): Promise<PromoCode> {
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({ ...input, code: input.code.toUpperCase().trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromoCode(
  id: string,
  input: Partial<PromoCodeInput>,
): Promise<PromoCode> {
  const { data, error } = await supabase
    .from("promo_codes")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function disablePromoCode(id: string): Promise<void> {
  const { error } = await supabase
    .from("promo_codes")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ── Validation ────────────────────────────────────────────────────────────────

export async function validatePromoCode(
  code: string,
  userId: string,
  serviceType: AppliesToType,
  subtotal: number,
): Promise<PromoValidationResult> {
  const promo = await getPromoCodeByCode(code);
  console.log("promo ===>", promo);
  if (!promo) return { valid: false, error: "Promo code not found." };
  if (!promo.is_active)
    return { valid: false, error: "This promo code is disabled." };

  const today = new Date().toISOString().split("T")[0];
  if (promo.start_date && promo.start_date > today)
    return { valid: false, error: "This promo code is not yet active." };
  if (promo.end_date && promo.end_date < today)
    return { valid: false, error: "This promo code has expired." };

  if (
    promo.applies_to !== "all" &&
    promo.applies_to !== "specific" &&
    promo.applies_to !== serviceType
  ) {
    return {
      valid: false,
      error: `This code only applies to ${promo.applies_to}.`,
    };
  }

  if (promo.global_usage === "limited" && promo.global_limit != null) {
    if (promo.usage_count >= promo.global_limit)
      return {
        valid: false,
        error: "This promo code has reached its usage limit.",
      };
  }

  if (userId) {
    const { count } = await supabase
      .from("promo_code_usage")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promo.id)
      .eq("user_id", userId);

    const used = count ?? 0;
    if (promo.per_user_usage === "once" && used >= 1)
      return { valid: false, error: "You have already used this promo code." };
    if (
      promo.per_user_usage === "multiple" &&
      promo.per_user_limit != null &&
      used >= promo.per_user_limit
    )
      return {
        valid: false,
        error: `You have reached the maximum uses (${promo.per_user_limit}) for this code.`,
      };
  }

  const discountAmount = calculateDiscount(promo, subtotal);
  return {
    valid: true,
    promoCodeId: promo.id,
    code: promo.code,
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
  };
}

// ── Usage tracking ────────────────────────────────────────────────────────────

export async function recordPromoCodeUsage(
  promoCodeId: string,
  bookingId: string,
  userId: string,
  discountApplied: number,
  originalTotal: number,
  finalTotal: number,
): Promise<void> {
  const { error } = await supabase.from("promo_code_usage").insert({
    promo_code_id: promoCodeId,
    booking_id: bookingId,
    user_id: userId,
    discount_applied: discountApplied,
    original_total: originalTotal,
    final_total: finalTotal,
  });
  if (error) throw error;

  // Atomic increment — function created in migration 004
  await supabase.rpc("increment_promo_usage", { promo_id: promoCodeId });
}

export async function getPromoCodeUsageHistory(
  promoCodeId: string,
): Promise<PromoCodeUsage[]> {
  const { data, error } = await supabase
    .from("promo_code_usage")
    .select("*")
    .eq("promo_code_id", promoCodeId)
    .order("used_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface EnrichedUsage {
  id: string;
  user_name: string;
  user_contact: string;
  date_used: string;
  booking_id: string | null;
  discount_applied: number;
  original_total: number | null;
  final_total: number | null;
}

export async function getEnrichedUsageHistory(
  promoCodeId: string,
): Promise<EnrichedUsage[]> {
  const { data, error } = await supabase
    .from("promo_code_usage")
    .select(
      "id, booking_id, discount_applied, original_total, final_total, used_at, users:user_id ( full_name, email )",
    )
    .eq("promo_code_id", promoCodeId)
    .order("used_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_name: row.users?.full_name ?? "—",
    user_contact: row.users?.email ?? "—",
    date_used: row.used_at ? row.used_at.split("T")[0] : "—",
    booking_id: row.booking_id ?? null,
    discount_applied: row.discount_applied ?? 0,
    original_total: row.original_total ?? null,
    final_total: row.final_total ?? null,
  }));
}

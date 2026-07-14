import { supabase } from "../../config/supabase";

export async function createPayment({
  bookingId,
  amount,
  paymentMethod,
  provider,
  providerTransactionId,
}: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  provider: string;
  providerTransactionId?: string;
}) {
  const { data: snapshot } = await supabase
    .from("booking_financial_snapshots")
    .select("id")
    .eq("booking_id", bookingId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  console.log("snapshot ==>", snapshot);
  console.log("bookingId ==>", bookingId);

  const { data, error } = await supabase
    .from("payments")
    .insert({
      booking_id: bookingId,
      financial_snapshot_id: snapshot?.id,
      amount,
      payment_method: paymentMethod,
      provider,
      provider_transaction_id: providerTransactionId,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.log("error");
    throw error;
  }

  return data;
}

export async function refundPayment({
  paymentId,
  amount,
  reason,
}: {
  paymentId: string;
  amount: number;
  reason?: string;
}) {
  const { data, error } = await supabase
    .from("refunds")
    .insert({
      payment_id: paymentId,
      amount,
      reason,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function createInitialSnapshot(bookingId: string) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      subtotal_amount,
      discount_amount,
      tax_amount,
      total_amount
    `,
    )
    .eq("id", bookingId)
    .single();

  if (error) throw error;

  const { error: snapshotError } = await supabase
    .from("booking_financial_snapshots")
    .insert({
      booking_id: bookingId,
      version: 1,
      subtotal_amount: booking.subtotal_amount,
      discount_amount: booking.discount_amount,
      tax_amount: booking.tax_amount,
      total_amount: booking.total_amount,
      reason: "Initial booking",
    });

  if (snapshotError) {
    console.log("snapshotError");
    throw snapshotError;
  }
}

export async function createSnapshot(
  bookingId: string,
  reason: string,
) {
  console.log("in createSnapshot");
  const [{ data: booking }, { data: lastSnapshot }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          `
          subtotal_amount,
          discount_amount,
          tax_amount,
          total_amount
        `,
        )
        .eq("id", bookingId)
        .single(),

      supabase
        .from("booking_financial_snapshots")
        .select("version")
        .eq("booking_id", bookingId)
        .order("version", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle(),
    ]);

  const version = (lastSnapshot?.version ?? 0) + 1;

  const { error } = await supabase
    .from("booking_financial_snapshots")
    .insert({
      booking_id: bookingId,
      version,
      subtotal_amount: booking!.subtotal_amount,
      discount_amount: booking!.discount_amount,
      tax_amount: booking!.tax_amount,
      total_amount: booking!.total_amount,
      reason,
    });

  if (error) throw error;
}

export async function getFinancialHistory(bookingId: string) {
  console.log("getFinancialHistory");
  const [snapshots, payments, refunds] = await Promise.all([
    supabase
      .from("booking_financial_snapshots")
      .select("*")
      .eq("booking_id", bookingId)
      .order("version"),

    supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at"),

    supabase
      .from("refunds")
      .select(
        `
          *,
          payment:payments(
            booking_id
          )
        `,
      )
      .order("created_at"),
  ]);

  return {
    snapshots: snapshots.data ?? [],
    payments: payments.data ?? [],
    refunds:
      refunds.data?.filter(
        (r) => r.payment?.booking_id === bookingId,
      ) ?? [],
  };
}
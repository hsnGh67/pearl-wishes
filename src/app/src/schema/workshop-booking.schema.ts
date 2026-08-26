/**
 * Workshop Booking Schema
 * Source of truth for workshop booking/reservation data structures
 */

import { z } from "zod";

export enum WorkshopBookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum WorkshopPaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export const WORKSHOP_BOOKING_STATUS_LABELS: Record<WorkshopBookingStatus, string> = {
  [WorkshopBookingStatus.PENDING]: "Pending Review",
  [WorkshopBookingStatus.CONFIRMED]: "Confirmed",
  [WorkshopBookingStatus.SCHEDULED]: "Scheduled",
  [WorkshopBookingStatus.COMPLETED]: "Completed",
  [WorkshopBookingStatus.CANCELLED]: "Cancelled",
};

export const WORKSHOP_PAYMENT_STATUS_LABELS: Record<WorkshopPaymentStatus, string> = {
  [WorkshopPaymentStatus.PENDING]: "Pending",
  [WorkshopPaymentStatus.PAID]: "Paid",
  [WorkshopPaymentStatus.FAILED]: "Failed",
  [WorkshopPaymentStatus.REFUNDED]: "Refunded",
};

export const WORKSHOP_STATUS_COLORS: Record<WorkshopBookingStatus, string> = {
  [WorkshopBookingStatus.PENDING]: "#FCEAE0",
  [WorkshopBookingStatus.CONFIRMED]: "#E9CFCA",
  [WorkshopBookingStatus.SCHEDULED]: "#EACAB8",
  [WorkshopBookingStatus.COMPLETED]: "#D0A096",
  [WorkshopBookingStatus.CANCELLED]: "#DCD4CD",
};

// ─── Zod runtime schemas ───────────────────────────────────────────────────────

export const WorkshopBookingSchema = z.object({
  id: z.string(),
  workshop_id: z.string().min(1, "Workshop ID is required"),
  user_id: z.string().nullable().optional(),
  preferred_month: z.string().min(1, "Preferred month is required"),
  participant_name: z.string().min(1, "Participant name is required"),
  participant_phone: z.string().min(1, "Participant phone is required"),
  participant_email: z.string(),
  status: z.nativeEnum(WorkshopBookingStatus).default(WorkshopBookingStatus.PENDING),
  payment_status: z.nativeEnum(WorkshopPaymentStatus).default(WorkshopPaymentStatus.PENDING),
  notes: z.string().default(""),
  payment_intent_id: z.string().nullable(),
  scheduled_date: z.string().nullable(),
  receipt_number: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const WorkshopBookingCreateSchema = WorkshopBookingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  status: true,
  payment_status: true,
  notes: true,
  payment_intent_id: true,
  scheduled_date: true,
  receipt_number: true,
});

export const WorkshopBookingUpdateSchema = WorkshopBookingCreateSchema.partial();

// ─── Inferred types ───────────────────────────────────────────────────────────

export type WorkshopBooking = z.infer<typeof WorkshopBookingSchema>;
export type WorkshopBookingCreateInput = z.infer<typeof WorkshopBookingCreateSchema>;
export type WorkshopBookingUpdateInput = z.infer<typeof WorkshopBookingUpdateSchema>;

/** Backward-compat alias — existing code imports WorkshopBookingCreate */
export type WorkshopBookingCreate = WorkshopBookingCreateInput;

// ─── Related types (no Zod — not mutated directly) ────────────────────────────

export interface WorkshopBookingUser {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export interface WorkshopSession {
  id: string;
  workshop_id: string;
  class_id: string;
  date: string;
  status: string;
  people_numbers?: number;
  title?: string;
  starts_at: string;
  ends_at: string;
  weekdays?: string[];
}

export interface WorkshopSessionParticipant {
  id: string;
  workshop_id: string;
  workshop_class_id: string;
  workshop_session_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  created_at?: string;
}

export interface WorkshopBookingWithUser extends WorkshopBooking {
  user?: WorkshopBookingUser | null;
}

export interface WorkshopBookingDisplay extends WorkshopBooking {
  statusLabel: string;
  statusColor: string;
  paymentStatusLabel: string;
  preferredMonthLabel: string;
  formattedDate?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatWorkshopBookingForDisplay(
  booking: WorkshopBooking,
): WorkshopBookingDisplay {
  return {
    ...booking,
    statusLabel: WORKSHOP_BOOKING_STATUS_LABELS[booking.status],
    statusColor: WORKSHOP_STATUS_COLORS[booking.status],
    paymentStatusLabel: WORKSHOP_PAYMENT_STATUS_LABELS[booking.payment_status],
    preferredMonthLabel:
      booking.preferred_month.charAt(0).toUpperCase() +
      booking.preferred_month.slice(1),
    formattedDate: booking.scheduled_date
      ? new Date(booking.scheduled_date).toLocaleDateString("en-GB")
      : undefined,
  };
}

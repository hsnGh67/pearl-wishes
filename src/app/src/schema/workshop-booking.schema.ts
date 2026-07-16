/**
 * Workshop Booking Schema
 * Source of truth for workshop booking/reservation data structures
 */

/**
 * Workshop Booking Status
 */
export enum WorkshopBookingStatus {
  PENDING = "pending", // Initial status after booking
  CONFIRMED = "confirmed", // Admin confirmed the booking
  SCHEDULED = "scheduled", // Final date/time scheduled via WhatsApp
  COMPLETED = "completed", // Workshop completed
  CANCELLED = "cancelled", // Booking cancelled
}

/**
 * Workshop Payment Status
 */
export enum WorkshopPaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

/**
 * Status Display Labels
 */
export const WORKSHOP_BOOKING_STATUS_LABELS: Record<
  WorkshopBookingStatus,
  string
> = {
  [WorkshopBookingStatus.PENDING]: "Pending Review",
  [WorkshopBookingStatus.CONFIRMED]: "Confirmed",
  [WorkshopBookingStatus.SCHEDULED]: "Scheduled",
  [WorkshopBookingStatus.COMPLETED]: "Completed",
  [WorkshopBookingStatus.CANCELLED]: "Cancelled",
};

export const WORKSHOP_PAYMENT_STATUS_LABELS: Record<
  WorkshopPaymentStatus,
  string
> = {
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

/**
 * Workshop Booking Database Model
 */
export interface WorkshopBookingUser {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export interface WorkshopBooking {
  id: string;
  workshop_id: string;
  user_id?: string | null;
  preferred_month: string; // The month user selected (june, july, etc)
  participant_name: string;
  participant_phone: string;
  participant_email: string;
  status: WorkshopBookingStatus;
  payment_status: WorkshopPaymentStatus;
  notes: string;
  payment_intent_id: string | null;
  scheduled_date: string | null; // ISO date when final date is confirmed via WhatsApp
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
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

/**
 * Workshop Booking Create Input
 */
export interface WorkshopBookingCreate {
  workshop_id: string;
  preferred_month: string;
  participant_name: string;
  participant_phone: string;
  participant_email: string;
  notes: string;
  payment_status?: WorkshopPaymentStatus;
  payment_intent_id?: string | null;
  receipt_number?: string | null;
  scheduled_date?: string | null;
}

/**
 * Workshop Booking Display Model (for UI)
 */
export interface WorkshopBookingDisplay extends WorkshopBooking {
  statusLabel: string;
  statusColor: string;
  paymentStatusLabel: string;
  preferredMonthLabel: string;
  formattedDate?: string;
}

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

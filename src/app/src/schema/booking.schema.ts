import { z } from "zod";

/**
 * Booking Status Enum
 */
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

/**
 * Booking Status Display Names
 */
export const BOOKING_STATUS_LABELS: Record<
  BookingStatus,
  string
> = {
  [BookingStatus.PENDING]: "Pending",
  [BookingStatus.CONFIRMED]: "Confirmed",
  [BookingStatus.IN_PROGRESS]: "In Progress",
  [BookingStatus.COMPLETED]: "Completed",
  [BookingStatus.CANCELLED]: "Cancelled",
  [BookingStatus.NO_SHOW]: "No Show",
};

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIALL_PAID = "partially_paid",
  PARTIALL_REFUNDED = "partially_refunded",
  PAID = "paid",
  REFUNDED = "refunded",
}

/**
 * Zod Schema for Booking Validation
 */
export const BookingSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  appointment_date: z.string().or(z.date()),
  appointment_time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Invalid time format (HH:MM)",
    ),
  address: z
    .string()
    .min(3, "Address must be at least 3 characters")
    .max(500),
  district: z.string().min(2).max(100),
  status: z
    .nativeEnum(BookingStatus)
    .default(BookingStatus.PENDING),
  payment_status: z
    .nativeEnum(PaymentStatus)
    .default(PaymentStatus.PENDING),
  subtotal_amount: z.number().min(0),
  total_amount: z.number().min(0),
  discount_amount: z.number().min(0),
  balance_amount: z.number(),
  people_numbers: z.number().min(1),
  tax_amount: z.number().min(0),
  notes: z.string().max(1000).nullable().optional(),
  stripe_payment_intent_id: z.string().nullable().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type Booking = z.infer<typeof BookingSchema>;

/**
 * Booking Create Input
 */
export const BookingCreateSchema = BookingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type BookingCreate = z.infer<typeof BookingCreateSchema>;

/**
 * Booking Update Input
 */
export const BookingUpdateSchema =
  BookingSchema.partial().required({
    id: true,
  });

export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;

/**
 * Booking Display Model
 */
export interface BookingDisplay extends Booking {
  statusLabel: string;
  paymentStatusLabel: string;
  formattedPrice: string;
  formattedDate: string;
  formattedTime: string;
}

/**
 * Business Rules
 */
export const BOOKING_BUSINESS_RULES = {
  MIN_ADDRESS_LENGTH: 10,
  MAX_ADDRESS_LENGTH: 500,
  MIN_ADVANCE_BOOKING_HOURS: 24, // Must book at least 24 hours in advance
  MAX_ADVANCE_BOOKING_DAYS: 90, // Can book up to 90 days in advance
  // Business Hours: Monday-Saturday: 10:00 AM - 6:00 PM, Sunday: 11:00 AM - 5:00 PM
  BUSINESS_START_HOUR_WEEKDAY: 10, // Monday to Saturday
  BUSINESS_END_HOUR_WEEKDAY: 18, // Monday to Saturday
  BUSINESS_START_HOUR_SUNDAY: 11, // Sunday
  BUSINESS_END_HOUR_SUNDAY: 17, // Sunday
} as const;

/**
 * Helper Functions
 */

/**
 * Get business hours for a specific date
 * @param date - The date to check
 * @returns Object with startHour and endHour for that day
 */
export const getBusinessHoursForDate = (
  date: Date,
): { startHour: number; endHour: number } => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  if (dayOfWeek === 0) {
    // Sunday
    return {
      startHour:
        BOOKING_BUSINESS_RULES.BUSINESS_START_HOUR_SUNDAY,
      endHour: BOOKING_BUSINESS_RULES.BUSINESS_END_HOUR_SUNDAY,
    };
  } else {
    // Monday to Saturday
    return {
      startHour:
        BOOKING_BUSINESS_RULES.BUSINESS_START_HOUR_WEEKDAY,
      endHour: BOOKING_BUSINESS_RULES.BUSINESS_END_HOUR_WEEKDAY,
    };
  }
};

export const formatBookingForDisplay = (
  booking: Booking,
): BookingDisplay => ({
  ...booking,
  statusLabel: BOOKING_STATUS_LABELS[booking.status],
  paymentStatusLabel:
    booking.payment_status.charAt(0).toUpperCase() +
    booking.payment_status.slice(1),
  formattedPrice: `£${booking.total_amount.toFixed(2)}`,
  formattedDate: new Date(
    booking.appointment_date,
  ).toLocaleDateString("en-GB"),
  formattedTime: booking.appointment_time,
});

export const validateBooking = (data: unknown): Booking => {
  return BookingSchema.parse(data);
};

export const validateBookingCreate = (
  data: unknown,
): BookingCreate => {
  return BookingCreateSchema.parse(data);
};

export const validateBookingUpdate = (
  data: unknown,
): BookingUpdate => {
  return BookingUpdateSchema.parse(data);
};

/**
 * Business Logic Validators
 */
export const isBookingEditable = (
  booking: Booking,
): boolean => {
  return (
    booking.status === BookingStatus.PENDING ||
    booking.status === BookingStatus.CONFIRMED
  );
};

export const isBookingCancellable = (
  booking: Booking,
): boolean => {
  return (
    booking.status !== BookingStatus.CANCELLED &&
    booking.status !== BookingStatus.COMPLETED &&
    booking.status !== BookingStatus.NO_SHOW
  );
};

export const canRefundBooking = (booking: Booking): boolean => {
  return (
    booking.payment_status === PaymentStatus.PAID &&
    (booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.NO_SHOW)
  );
};
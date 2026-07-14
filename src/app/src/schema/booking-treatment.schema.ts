import { z } from "zod";

/**
 * Booking Treatment Status Enum
 */
export enum BookingTreatmentStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
}

/**
 * Zod Schema for Booking Treatment Validation
 * Represents individual person + treatment within a booking
 */
export const BookingTreatmentSchema = z.object({
  id: z.string().uuid().optional(),
  booking_id: z.string().uuid(),
  service_id: z.string().uuid(),
  person_name: z
    .string()
    .min(2, "Person name must be at least 2 characters")
    .max(100),
  service_name: z.string(), // Store name in case service is deleted
  price: z.number().min(0),
  duration: z.number().min(1), // in minutes
  status: z
    .nativeEnum(BookingTreatmentStatus)
    .default(BookingTreatmentStatus.ACTIVE),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type BookingTreatment = z.infer<
  typeof BookingTreatmentSchema
>;

/**
 * Booking Treatment Create Input
 */
export const BookingTreatmentCreateSchema =
  BookingTreatmentSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  });

export type BookingTreatmentCreate = z.infer<
  typeof BookingTreatmentCreateSchema
>;

/**
 * Booking Treatment Update Input
 */
export const BookingTreatmentUpdateSchema =
  BookingTreatmentSchema.partial().required({ id: true });

export type BookingTreatmentUpdate = z.infer<
  typeof BookingTreatmentUpdateSchema
>;

/**
 * Helper Functions
 */
export const validateBookingTreatment = (
  data: unknown,
): BookingTreatment => {
  return BookingTreatmentSchema.parse(data);
};

export const validateBookingTreatmentCreate = (
  data: unknown,
): BookingTreatmentCreate => {
  return BookingTreatmentCreateSchema.parse(data);
};

export const validateBookingTreatmentUpdate = (
  data: unknown,
): BookingTreatmentUpdate => {
  return BookingTreatmentUpdateSchema.parse(data);
};
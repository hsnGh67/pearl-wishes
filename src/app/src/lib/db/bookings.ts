import { supabase } from "../../config/supabase";
import {
  Booking,
  BookingCreate,
  BookingUpdate,
  validateBooking,
  validateBookingCreate,
  validateBookingUpdate,
  BookingStatus,
} from "../../schema/booking.schema";
import { BookingTreatmentStatus } from "../../schema/booking-treatment.schema";
import { dbLogger } from "./logger";
import { formatDate } from "../../utils/formatDate";
import {
  createInitialSnapshot,
  createPayment,
  createSnapshot,
} from "./payments";

/**
 * Get all bookings
 */
export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    dbLogger.info("Fetching all bookings", {
      table: "bookings",
    });

    const { data, error } = await supabase
      .from("bookings")
      .select("*,   services:booking_treatments (*)")
      .order("appointment_date", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch bookings", {
        table: "bookings",
        error,
      });
      throw error;
    }

    console.log("🔍 Raw bookings from DB:", data?.length, "records");
    console.log("🔍 Sample raw booking:", data?.[0]);

    const validatedBookings =
      data?.map((booking) => {
        try {
          return validateBooking(booking);
        } catch (validationError) {
          console.error(
            "❌ Validation failed for booking:",
            booking.id,
            validationError,
          );
          throw validationError;
        }
      }) || [];

    dbLogger.info("Successfully fetched bookings", {
      table: "bookings",
      data: { count: validatedBookings.length },
    });

    return validatedBookings;
  } catch (error) {
    dbLogger.error("Error in getAllBookings", { error });
    throw error;
  }
};

/**
 * Get bookings by status
 */
export const getBookingsByStatus = async (
  status: BookingStatus,
): Promise<Booking[]> => {
  try {
    dbLogger.info("Fetching bookings by status", {
      table: "bookings",
      data: { status },
    });

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `*,   services:booking_treatments (
      *,
      addons:booking_treatment_addons (*)
    )`,
      )
      .eq("status", status)
      .order("appointment_date", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch bookings by status", {
        table: "bookings",
        error,
      });
      throw error;
    }

    const validatedBookings =
      data?.map((booking) => validateBooking(booking)) || [];

    dbLogger.info("Successfully fetched bookings by status", {
      table: "bookings",
      data: { status, count: validatedBookings.length },
    });

    return validatedBookings;
  } catch (error) {
    dbLogger.error("Error in getBookingsByStatus", { error });
    throw error;
  }
};

/**
 * Booked time slot for a specific date, including estimated duration from booking treatments
 */
export interface BookedTimeSlot {
  appointment_date: string;
  appointment_time: string;
  duration: number;
}

export const getBookedTimesForDate = async (
  date: Date,
): Promise<BookedTimeSlot[]> => {
  const dateString = formatDate(date);

  dbLogger.info("Fetching booked time slots", {
    table: "bookings",
    data: { date: dateString },
  });

  try {
    const { data, error } = await supabase
      .from("booking_treatments")
      .select(
        "booking_id, duration, bookings!inner(appointment_time, appointment_date, status)",
      )
      .eq("status", BookingTreatmentStatus.ACTIVE)
      .eq("bookings.appointment_date", dateString)
      .neq("bookings.status", BookingStatus.CANCELLED);

    if (!error && data) {
      const grouped = data.reduce<Record<string, BookedTimeSlot>>(
        (acc, row) => {
          const booking = row.bookings;
          if (!booking?.appointment_time) return acc;

          const bookingId = row.booking_id;
          const duration = Number(row.duration) || 0;

          if (!acc[bookingId]) {
            acc[bookingId] = {
              appointment_time: booking.appointment_time,
              duration,
            };
          } else {
            acc[bookingId].duration += duration;
          }

          return acc;
        },
        {},
      );

      const slots = Object.values(grouped);
      dbLogger.info("Booked time slots loaded from treatments", {
        table: "booking_treatments",
        data: { date: dateString, count: slots.length },
      });
      return slots as BookedTimeSlot[];
    }

    if (error) {
      dbLogger.warn(
        "Failed to fetch booked time slots from booking_treatments, falling back to bookings table",
        {
          table: "booking_treatments",
          error,
        },
      );
    }

    const fallbackResponse = await supabase
      .from("bookings")
      .select("appointment_time")
      .eq("appointment_date", dateString)
      .neq("status", BookingStatus.CANCELLED)
      .order("appointment_time", { ascending: true });

    if (fallbackResponse.error) {
      dbLogger.error(
        "Failed to fetch booked time slots from bookings fallback",
        {
          table: "bookings",
          error: fallbackResponse.error,
        },
      );
      throw fallbackResponse.error;
    }

    const fallbackSlots = fallbackResponse.data
      ?.map((booking) => ({
        appointment_time: booking.appointment_time,
        duration: 60,
      }))
      .filter(Boolean) as BookedTimeSlot[];

    dbLogger.info("Booked time slots loaded from bookings fallback", {
      table: "bookings",
      data: { date: dateString, count: fallbackSlots.length },
    });
    return fallbackSlots;
  } catch (error) {
    dbLogger.error("Error in getBookedTimesForDate", { error });
    throw error;
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    dbLogger.info("Fetching booking by ID", {
      table: "bookings",
      data: { id },
    });

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `*,   services:booking_treatments (
      *,
      addOns:booking_treatment_addons (*)
    )`,
      )
      .eq("id", id)
      .single();

    if (error) {
      dbLogger.error("Failed to fetch booking by ID", {
        table: "bookings",
        error,
      });
      throw error;
    }

    if (!data) {
      dbLogger.warn("Booking not found", {
        table: "bookings",
        data: { id },
      });
      return null;
    }

    const validatedBooking = validateBooking(data);

    dbLogger.info("Successfully fetched booking", {
      table: "bookings",
      data: data,
    });

    return data;
  } catch (error) {
    dbLogger.error("Error in getBookingById", { error });
    throw error;
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (
  bookingData: BookingCreate,
): Promise<Booking> => {
  try {
    const validatedData = validateBookingCreate(bookingData);

    dbLogger.info("Creating new booking", {
      table: "bookings",
      data: validatedData,
    });

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...validatedData,
        booking_number: Math.floor(Math.random() * 1000000),
      })
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create booking", {
        table: "bookings",
        error,
      });
      throw error;
    }

    const validatedBooking = validateBooking(data);

    dbLogger.info("Successfully created booking", {
      table: "bookings",
      data: validatedBooking,
    });
    await createInitialSnapshot(validatedBooking.id);
    await createPayment({
      bookingId: validatedBooking.id,
      amount: validatedBooking.total_amount,
      paymentMethod: "stripe",
      provider: "stripe",
      providerTransactionId: `P-${Math.floor(Math.random() * 10000000)}`,
    });

    return validatedBooking;
  } catch (error) {
    dbLogger.error("Error in createBooking", { error });
    throw error;
  }
};

/**
 * Update an existing booking
 */
export const updateBooking = async (
  bookingData: BookingUpdate,
  reason: string,
): Promise<Booking> => {
  try {
    console.log("reason ====>", reason);
    const validatedData = validateBookingUpdate(bookingData);

    dbLogger.info("Updating booking", {
      table: "bookings",
      data: { id: validatedData.id },
    });

    const { id, ...updateFields } = validatedData;

    const { data, error } = await supabase
      .from("bookings")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to update booking", {
        table: "bookings",
        error,
      });
      throw error;
    }

    const validatedBooking = validateBooking(data);

    await createSnapshot(validatedBooking.id, reason);

    dbLogger.info("Successfully updated booking", {
      table: "bookings",
      data: { id: validatedBooking.id },
    });

    return validatedBooking;
  } catch (error) {
    dbLogger.error("Error in updateBooking", { error });
    throw error;
  }
};

/**
 * Delete a booking
 */
export const deleteBooking = async (id: string): Promise<void> => {
  try {
    dbLogger.info("Deleting booking", {
      table: "bookings",
      data: { id },
    });

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete booking", {
        table: "bookings",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted booking", {
      table: "bookings",
      data: { id },
    });
  } catch (error) {
    dbLogger.error("Error in deleteBooking", { error });
    throw error;
  }
};

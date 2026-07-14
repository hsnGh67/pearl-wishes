import { supabase } from "../../config/supabase";
import {
  Booking,
  BookingCreate,
} from "../../schema/booking.schema";
import { BookingTreatmentCreate } from "../../schema/booking-treatment.schema";
import { createBooking } from "./bookings";
import { createBookingTreatment } from "./booking-treatments";
import { dbLogger } from "./logger";
import { createBookingTreatmentAddons } from "./booking-treatment-addons";

/**
 * Interface for creating a booking with treatments
 */
export interface BookingWithTreatmentsCreate {
  booking: BookingCreate;
  treatments: Omit<BookingTreatmentCreate, "booking_id">[];
}

/**
 * Create a booking with associated treatments (multi-person support)
 * This function creates the booking first, then creates all treatments
 * in a transaction-like manner
 */
export async function createBookingWithTreatments(
  data: BookingWithTreatmentsCreate,
): Promise<{ booking: Booking; treatmentsCreated: number }> {
  try {
    dbLogger.info("Creating booking with treatments", {
      bookingData: data.booking,
      treatmentCount: data.treatments.length,
    });
    console.log("createBookingWithTreatments =>", { ...data });
    // Step 1: Create the booking
    const booking = await createBooking(data.booking);
    const addOnsTreatments = data.treatments
      .map((t) => ({ ...t }))
      .filter((t) => t.addOns.length > 0); // Filter out treatments without a addOns
    dbLogger.info("Booking created successfully", {
      bookingId: booking.id,
    });

    console.log("data.treatments ===>", data.treatments);
    // Step 2: Create all treatments for this booking
    let treatmentsCreated = 0;
    const treatmentPromises = data.treatments.map((treatment) =>
      createBookingTreatment({
        ...treatment,
        booking_id: booking.id,
      }),
    );

    try {
      const treatmentsRes = await Promise.all(
        treatmentPromises,
      );
      dbLogger.info("All treatments created successfully", {
        bookingId: booking.id,
        treatmentsCreated,
      });
      console.log("treatmentsRes ==>", treatmentsRes);
      treatmentsCreated = data.treatments.length;
      const addOnsPromises = addOnsTreatments.map((treatment) =>
        createBookingTreatmentAddons(
          treatmentsRes.find(
            (t: any) => t.service_id === treatment.service_id,
          )?.id || "",
          treatment.addOns,
        ),
      );
      dbLogger.info("All addons created successfully");
      await Promise.all(addOnsPromises);
    } catch (treatmentError) {
      // If treatments fail, we should log but not delete the booking
      // This allows manual recovery
      dbLogger.error("Failed to create some treatments", {
        bookingId: booking.id,
        error: treatmentError,
      });

      // Optionally: You could cancel the booking here
      // await updateBooking({ id: booking.id, status: BookingStatus.CANCELLED });
    }

    return {
      booking,
      treatmentsCreated,
    };
  } catch (error) {
    dbLogger.error("Error creating booking with treatments", {
      error,
    });
    throw error;
  }
}

/**
 * Bulk create treatments for an existing booking
 * Useful for adding treatments to bookings created before the multi-person feature
 */
export async function addTreatmentsToBooking(
  bookingId: string,
  treatments: Omit<BookingTreatmentCreate, "booking_id">[],
): Promise<number> {
  try {
    dbLogger.info("Adding treatments to existing booking", {
      bookingId,
      treatmentCount: treatments.length,
    });

    const treatmentPromises = treatments.map((treatment) =>
      createBookingTreatment({
        ...treatment,
        booking_id: bookingId,
      }),
    );

    await Promise.all(treatmentPromises);

    dbLogger.info("Treatments added successfully", {
      bookingId,
      treatmentsCreated: treatments.length,
    });

    return treatments.length;
  } catch (error) {
    dbLogger.error("Error adding treatments to booking", {
      error,
    });
    throw error;
  }
}
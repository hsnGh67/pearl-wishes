import { supabase } from "../../config/supabase";
import {
  BookingTreatment,
  BookingTreatmentCreate,
  BookingTreatmentUpdate,
  BookingTreatmentStatus,
  validateBookingTreatment,
} from "../../schema/booking-treatment.schema";
import { createBookingTreatmentAddons } from "./booking-treatment-addons";

/**
 * Get all booking treatments for a specific booking
 */
export async function getBookingTreatments(
  bookingId: string,
): Promise<BookingTreatment[]> {
  try {
    const { data, error } = await supabase
      .from("booking_treatments")
      .select("*, addOns:booking_treatment_addons(*)")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (
        error.code === "PGRST205" ||
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          "booking_treatments table not found - returning empty array",
        );
        return [];
      }
      console.error(
        "Error fetching booking treatments:",
        error,
      );
      throw new Error(
        `Failed to fetch booking treatments: ${error.message}`,
      );
    }
    console.log("BookingTreatments ==>", data);

    return data;
  } catch (error) {
    console.error("Error in getBookingTreatments:", error);
    return [];
  }
}

/**
 * Get all active booking treatments for a specific booking
 */
export async function getActiveBookingTreatments(
  bookingId: string,
): Promise<BookingTreatment[]> {
  const { data, error } = await supabase
    .from("booking_treatments")
    .select("*, booking_treatment_addons(*)")
    .eq("booking_id", bookingId)
    .eq("status", BookingTreatmentStatus.ACTIVE)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Error fetching active booking treatments:",
      error,
    );
    throw new Error(
      `Failed to fetch active booking treatments: ${error.message}`,
    );
  }

  return (data || []).map((item) => ({
    ...item,
    addOns: item.booking_treatment_addons,
  }));
}

/**
 * Get a single booking treatment by ID
 */
// export async function getBookingTreatment(
//   id: string,
// ): Promise<BookingTreatment | null> {
//   const { data, error } = await supabase
//     .from("booking_treatments")
//     .select("*, booking_treatment_addons(*)")
//     .eq("id", id)
//     .single();

//   if (error) {
//     console.error("Error fetching booking treatment:", error);
//     return null;
//   }

//   return data ? validateBookingTreatment(data) : null;
// }

/**
 * Create a new booking treatment
 */
export async function createBookingTreatment(
  treatment: BookingTreatmentCreate,
): Promise<BookingTreatment> {
  const newTreatment = { ...treatment };
  console.log("original treatment ===>", treatment);
  console.log("treatment3 ===>", newTreatment);
  delete newTreatment["addOns"];

  const { data, error } = await supabase
    .from("booking_treatments")
    .insert([newTreatment])
    .select()
    .single();

  if (error) {
    console.error("Error creating booking treatment:", error);
    if (data) {
      deleteBookingTreatment(data.id);
    }
    throw new Error(
      `Failed to create booking treatment: ${error.message}`,
    );
  }

  if (treatment.addOns?.length > 0) {
    await createBookingTreatmentAddons(
      data.id,
      treatment.addOns,
    );
  }

  return validateBookingTreatment(data);
}

/**
 * Update a booking treatment
 */
export async function updateBookingTreatment(
  treatment: BookingTreatmentUpdate,
): Promise<BookingTreatment> {
  const { id, ...updates } = treatment;

  const { data, error } = await supabase
    .from("booking_treatments")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating booking treatment:", error);
    throw new Error(
      `Failed to update booking treatment: ${error.message}`,
    );
  }

  return validateBookingTreatment(data);
}

/**
 * Cancel a booking treatment (soft delete)
 */
export async function cancelBookingTreatment(
  id: string,
): Promise<BookingTreatment> {
  return updateBookingTreatment({
    id,
    status: BookingTreatmentStatus.CANCELLED,
  });
}

/**
 * Delete a booking treatment (hard delete)
 */
export async function deleteBookingTreatment(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("booking_treatments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting booking treatment:", error);
    throw new Error(
      `Failed to delete booking treatment: ${error.message}`,
    );
  }
}

/**
 * Get count of active treatments for a booking
 */
export async function getActiveTreatmentCount(
  bookingId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("booking_treatments")
      .select("*", { count: "exact", head: true })
      .eq("booking_id", bookingId)
      .eq("status", BookingTreatmentStatus.ACTIVE);

    if (error) {
      // If table doesn't exist, return 0
      if (
        error.code === "PGRST205" ||
        error.message.includes("Could not find the table")
      ) {
        return 0;
      }
      console.error("Error counting active treatments:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getActiveTreatmentCount:", error);
    return 0;
  }
}
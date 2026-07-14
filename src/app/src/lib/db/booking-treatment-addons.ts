import { supabase } from "../../config/supabase";
import { dbLogger } from "./logger";

/**
 * Interface for creating a booking treatment add-on
 */
export interface BookingTreatmentAddonCreate {
  booking_treatment_id: string;
  name: string;
  price: number;
  duration?: number;
}

/**
 * Create a single add-on for a booking treatment
 */
export async function createBookingTreatmentAddon(
  data: BookingTreatmentAddonCreate,
) {
  try {
    dbLogger.info("Creating booking treatment add-on", data);

    const { data: addon, error } = await supabase
      .from("booking_treatment_addons")
      .insert([
        {
          booking_treatment_id: data.booking_treatment_id,
          name: data.name,
          price: data.price,
          duration: data.duration || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      dbLogger.error(
        "Error creating booking treatment add-on",
        { error },
      );
      throw error;
    }

    dbLogger.info(
      "Booking treatment add-on created successfully",
      {
        addonId: addon.id,
      },
    );

    return addon;
  } catch (error) {
    dbLogger.error("Error creating booking treatment add-on", {
      error,
    });
    throw error;
  }
}

/**
 * Create multiple add-ons for a booking treatment
 */
export async function createBookingTreatmentAddons(
  bookingTreatmentId: string,
  addons: Array<{
    name: string;
    price: number;
    duration: number;
  }>,
): Promise<number> {
  if (!addons || addons.length === 0) {
    return 0;
  }

  try {
    dbLogger.info(
      "Creating multiple booking treatment add-ons",
      {
        bookingTreatmentId,
        addonCount: addons.length,
      },
    );

    const addonsToInsert = addons.map((addon) => ({
      booking_treatment_id: bookingTreatmentId,
      name: addon.name,
      price: addon.price,
      duration: addon.duration,
    }));

    const { error, data } = await supabase
      .from("booking_treatment_addons")
      .insert(addonsToInsert)
      .select();

    if (error) {
      dbLogger.error(
        "Error creating booking treatment add-ons",
        { error },
      );
      throw error;
    }

    dbLogger.info(
      "Booking treatment add-ons created successfully",
      {
        bookingTreatmentId,
        addonsCreated: data?.length || 0,
      },
    );

    return data?.length || 0;
  } catch (error) {
    dbLogger.error("Error creating booking treatment add-ons", {
      error,
    });
    throw error;
  }
}

/**
 * Get all add-ons for a booking treatment
 */
export async function getBookingTreatmentAddons(
  bookingTreatmentId: string,
) {
  try {
    const { data, error } = await supabase
      .from("booking_treatment_addons")
      .select("*")
      .eq("booking_treatment_id", bookingTreatmentId)
      .order("created_at", { ascending: true });

    if (error) {
      dbLogger.error(
        "Error fetching booking treatment add-ons",
        { error },
      );
      throw error;
    }

    return data || [];
  } catch (error) {
    dbLogger.error("Error fetching booking treatment add-ons", {
      error,
    });
    throw error;
  }
}

/**
 * Delete add-on for a booking treatment
 */
export async function deleteBookingTreatmentAddon(
  addonId: string,
) {
  try {
    const { error } = await supabase
      .from("booking_treatment_addons")
      .delete()
      .eq("id", addonId);

    if (error) {
      dbLogger.error(
        "Error deleting booking treatment add-on",
        { error },
      );
      throw error;
    }

    dbLogger.info(
      "Booking treatment add-on deleted successfully",
      { addonId },
    );
  } catch (error) {
    dbLogger.error("Error deleting booking treatment add-on", {
      error,
    });
    throw error;
  }
}
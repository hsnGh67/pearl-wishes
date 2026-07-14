/**
 * Workshop Bookings Database Operations
 * All CRUD operations for workshop_bookings table
 */

import { supabase } from "../../config/supabase";
import {
  WorkshopBooking,
  WorkshopBookingCreate,
  WorkshopBookingUpdate,
  WorkshopBookingStatus,
  WorkshopPaymentStatus,
} from "../../schema/workshop-booking.schema";
import { formatDate } from "../../utils/formatDate";
import { BookedTimeSlot } from "./bookings";
import { dbLogger } from "./logger";

/**
 * Get all workshop bookings
 */
export async function getAllWorkshopBookings(): Promise<
  WorkshopBooking[]
> {
  try {
    dbLogger.info("Fetching all workshop bookings", {
      table: "workshop_bookings",
    });

    const { data, error } = await supabase
      .from("workshop_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch workshop bookings", {
        table: "workshop_bookings",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully fetched workshop bookings", {
      table: "workshop_bookings",
      count: data?.length || 0,
    });

    return data || [];
  } catch (error) {
    dbLogger.error("Error in getAllWorkshopBookings", {
      error,
    });
    throw error;
  }
}

export async function getBookedCandidatesByMonth(
  workshopId: string,
  month: string,
): Promise<WorkshopBooking[]> {
  try {
    dbLogger.info("Fetching booked candidates for month", {
      table: "workshop_bookings",
      data: { month },
    });
    const { data, error } = await supabase
      .from("workshop_bookings")
      .select(
        `*, user:users (
        id,
        full_name,
        phone,
        email
      )`,
      )
      .eq("status", WorkshopBookingStatus.PENDING)
      .eq("workshop_id", workshopId)
      .eq("preferred_month", month);
    console.log("DATA", data);
    if (error) {
      dbLogger.error(
        "Failed to fetch booked candidates for month",
        {
          table: "workshop_bookings",
          error,
        },
      );
      throw error;
    }
    dbLogger.info(
      "Successfully fetched booked candidates for month",
      {
        table: "workshop_bookings",
        data: { month, count: data?.length || 0 },
      },
    );
    return data || [];
  } catch (error) {
    dbLogger.error("Error in getBookedCandidatesForMonth", {
      error,
    });
    throw error;
  }
}

/**
 * Get workshop booking by ID
 */
export async function getWorkshopBookingById(
  id: string,
): Promise<WorkshopBooking | null> {
  try {
    dbLogger.info("Fetching workshop booking by ID", {
      table: "workshop_bookings",
      data: { id },
    });

    const { data, error } = await supabase
      .from("workshop_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      dbLogger.error("Failed to fetch workshop booking by ID", {
        table: "workshop_bookings",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully fetched workshop booking", {
      table: "workshop_bookings",
      data: { id },
    });

    return data;
  } catch (error) {
    dbLogger.error("Error in getWorkshopBookingById", {
      error,
    });
    throw error;
  }
}

/**
 * Get workshop bookings by status
 */
export async function getWorkshopBookingsByStatus(
  status: WorkshopBookingStatus,
): Promise<WorkshopBooking[]> {
  try {
    dbLogger.info("Fetching workshop bookings by status", {
      table: "workshop_bookings",
      data: { status },
    });

    const { data, error } = await supabase
      .from("workshop_bookings")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error(
        "Failed to fetch workshop bookings by status",
        {
          table: "workshop_bookings",
          error,
        },
      );
      throw error;
    }

    dbLogger.info(
      "Successfully fetched workshop bookings by status",
      {
        table: "workshop_bookings",
        data: { status, count: data?.length || 0 },
      },
    );

    return data || [];
  } catch (error) {
    dbLogger.error("Error in getWorkshopBookingsByStatus", {
      error,
    });
    throw error;
  }
}

/**
 * Create a new workshop booking
 */
export async function createWorkshopBooking(
  bookingData: any,
): Promise<any> {
  try {
    dbLogger.info("Creating new workshop booking", {
      table: "workshop_bookings",
      data: bookingData,
    });

    const { data, error } = await supabase
      .from("workshop_bookings")
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create workshop booking", {
        table: "workshop_bookings",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully created workshop booking", {
      table: "workshop_bookings",
      data: { id: data.id },
    });

    return data;
  } catch (error) {
    dbLogger.error("Error in createWorkshopBooking", { error });
    throw error;
  }
}

/**
 * Update an existing workshop booking
 */
export async function updateWorkshopBooking(
  bookingData: WorkshopBookingUpdate,
): Promise<WorkshopBooking> {
  try {
    dbLogger.info("Updating workshop booking", {
      table: "workshop_bookings",
      data: { id: bookingData.id },
    });

    const { id, ...updateFields } = bookingData;

    const { data, error } = await supabase
      .from("workshop_bookings")
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to update workshop booking", {
        table: "workshop_bookings",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully updated workshop booking", {
      table: "workshop_bookings",
      data: { id: data.id },
    });

    return data;
  } catch (error) {
    dbLogger.error("Error in updateWorkshopBooking", { error });
    throw error;
  }
}

/**
 * Cancel a workshop booking
 */
export async function cancelWorkshopBooking(
  id: string,
): Promise<WorkshopBooking> {
  return updateWorkshopBooking({
    id,
    status: WorkshopBookingStatus.CANCELLED,
  });
}

/**
 * Delete a workshop booking
 */
export async function deleteWorkshopBooking(
  id: string,
): Promise<void> {
  try {
    dbLogger.info("Deleting workshop booking", {
      table: "workshop_bookings",
      data: { id },
    });

    const { error } = await supabase
      .from("workshop_bookings")
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete workshop booking", {
        table: "workshop_bookings",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted workshop booking", {
      table: "workshop_bookings",
      data: { id },
    });
  } catch (error) {
    dbLogger.error("Error in deleteWorkshopBooking", { error });
    throw error;
  }
}

/**
 * Create a new workshop session
 */
export async function createWorkshopSession(
  sessionData: any,
): Promise<any> {
  try {
    dbLogger.info("Creating new workshop session", {
      table: "workshop_sessions",
      data: sessionData,
    });

    const { data, error } = await supabase
      .from("workshop_sessions")
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create workshop session", {
        table: "workshop_sessions",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully created workshop session", {
      table: "workshop_sessions",
      data: { id: data.id },
    });

    return data;
  } catch (error) {
    dbLogger.error("Error in createWorkshopSession", { error });
    throw error;
  }
}

export async function createWorkshopBookingStudent(
  bookingData: any,
): Promise<any> {
  try {
    dbLogger.info("Creating new workshop booking participant", {
      table: "workshop_session_participants",
      data: bookingData,
    });

    const { data, error } = await supabase
      .from("workshop_session_participants")
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      dbLogger.error(
        "Failed to create workshop booking participant",
        {
          table: "workshop_session_participants",
          error,
        },
      );
      throw error;
    }

    dbLogger.info(
      "Successfully created workshop booking session",
      {
        table: "workshop_session_participants",
        data: { id: data.id },
      },
    );

    return data;
  } catch (error) {
    dbLogger.error("Error in createWorkshopBookingSession", {
      error,
    });
    throw error;
  }
}

export async function updateWorkshopBookingStatusToScheduled(
  bookingId: string,
): Promise<any> {
  try {
    dbLogger.info("updating workshop booking status", {
      table: "workshop_bookings",
      data: { bookingId },
    });

    const { data, error } = await supabase
      .from("workshop_bookings")
      .update({ status: WorkshopBookingStatus.SCHEDULED })
      .eq("id", bookingId);

    if (error) {
      dbLogger.error(
        "Failed to update workshop booking status",
        {
          table: "workshop_bookings",
          error,
        },
      );
      throw error;
    }

    dbLogger.info(
      "Successfully updated workshop booking status",
      {
        table: "workshop_bookings",
        data: { bookingId },
      },
    );

    return data;
  } catch (error) {
    dbLogger.error("Error in updateWorkshopBookingStatus", {
      error,
    });
    throw error;
  }
}

export const getAllWorkshopSessions = async () => {
  try {
    dbLogger.info("Fetching all workshop sessions", {
      table: "workshop_sessions",
    });

    const { data, error } = await supabase
      .from("workshop_sessions")
      .select(
        "*,participants:workshop_session_participants(count),workshops(title)",
      )
      .eq("status", "scheduled");

    if (error) {
      dbLogger.error(
        "Error fetching workshop sessions by date",
        { error },
      );
      throw error;
    }

    const transformedData = data?.map(
      ({
        participants,
        workshops,
        ...rest
      }: {
        participants: any;
        workshops: any;
        rest: any;
      }) => ({
        ...rest,
        people_numbers: participants?.[0]?.count || 0,
        title: workshops?.title,
      }),
    );

    return transformedData;
  } catch (error) {
    dbLogger.error("Error in getWorkshopSessionsByDate", {
      error,
    });
    throw error;
  }
};

export const getWorkshopSessionsByDate = async (
  date: string,
) => {
  try {
    dbLogger.info("Fetching workshop sessions by date", {
      table: "workshop_sessions",
      data: { date },
    });

    const [year, month] = date.split("-");
    const { data, error } = await supabase
      .from("workshop_sessions")
      .select(
        "*,participants:workshop_session_participants(count),workshops(title)",
      )
      .eq("status", "scheduled")
      .gte("date", `${year}-${month}-01`)
      .lt(
        "date",
        `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`,
      );

    if (error) {
      dbLogger.error(
        "Error fetching workshop sessions by date",
        { error },
      );
      throw error;
    }

    const transformedData = data?.map(
      ({
        participants,
        workshops,
        ...rest
      }: {
        participants: any;
        workshops: any;
        rest: any;
      }) => ({
        ...rest,
        people_numbers: participants?.[0]?.count || 0,
        title: workshops?.title,
      }),
    );

    return transformedData;
  } catch (error) {
    dbLogger.error("Error in getWorkshopSessionsByDate", {
      error,
    });
    throw error;
  }
};

export const getWorkshopTimesForDate = async (date: Date) => {
  try {
    dbLogger.info("Fetching workshop booked times for date", {
      table: "workshop_sessions",
      data: { date },
    });

    const dateString = formatDate(date);
    const { data, error } = await supabase
      .from("workshop_sessions")
      .select("*")
      .eq("date", dateString);

    if (error) {
      dbLogger.error("Error fetching booked times for date", {
        error,
      });
      throw error;
    }

    const slots = data?.map((session: any) => ({
      appointment_date: session.date,
      appointment_time: session.starts_at,
      duration:
        (new Date().setHours(
          parseInt(session.ends_at.split(":")[0]),
          parseInt(session.ends_at.split(":")[1]),
          0,
          0,
        ) -
          new Date().setHours(
            parseInt(session.starts_at.split(":")[0]),
            parseInt(session.starts_at.split(":")[1]),
            0,
            0,
          )) /
        60000,
    }));
    return slots as BookedTimeSlot[];
  } catch (error) {
    dbLogger.error("Error in getWorkshopTimesForDate", {
      error,
    });
    throw error;
  }
};
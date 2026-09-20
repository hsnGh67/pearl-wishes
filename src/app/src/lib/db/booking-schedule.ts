import { supabase } from "../../config/supabase";
import { formatDate } from "../../utils/formatDate";
import { dbLogger } from "./logger";
import type { AvailableArtistForBooking } from "./available-artists";

export type ScheduleDateRange = {
  fromDate: Date;
  toDate: Date;
};

export type ListArtistsForServicesParams = {
  districtId: string;
  serviceIds: string[];
};

export type BookableDatesParams = {
  districtId: string;
  serviceIds: string[];
  fromDate: Date;
  toDate: Date;
  durationMinutes: number;
  bufferMinutes?: number;
  excludeBookingId?: string;
};

export type BookableDatesForArtistParams = BookableDatesParams & {
  artistId: string;
};

export type FreeTimesForArtistParams = {
  artistId: string;
  appointmentDate: Date;
  durationMinutes: number;
  bufferMinutes?: number;
  excludeBookingId?: string;
};

export type FreeTimesForServicesParams = {
  districtId: string;
  serviceIds: string[];
  appointmentDate: Date;
  durationMinutes: number;
  bufferMinutes?: number;
  excludeBookingId?: string;
};

export type AssignArtistForSlotParams = {
  districtId: string;
  serviceIds: string[];
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  bufferMinutes?: number;
  excludeBookingId?: string;
};

function distinctServiceIds(serviceIds: string[]): string[] {
  return [...new Set(serviceIds.filter(Boolean))];
}

function parseWorkDates(
  rows: Array<{ work_date: string } | string> | null,
): Date[] {
  if (!rows?.length) return [];
  return rows
    .map((row) => {
      const raw =
        typeof row === "string"
          ? row
          : (row as { work_date: string }).work_date;
      if (!raw) return null;
      const [y, m, d] = raw.split("-").map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    })
    .filter((d): d is Date => d instanceof Date);
}

function parseSlotTimes(
  rows: Array<{ slot_time: string } | string> | null,
): string[] {
  if (!rows?.length) return [];
  return rows
    .map((row) =>
      typeof row === "string"
        ? row
        : (row as { slot_time: string }).slot_time,
    )
    .filter(Boolean)
    .map((t) => t.slice(0, 5));
}

/** Inclusive calendar month range for bookable-date queries. */
export function monthDateRange(visibleMonth: Date): ScheduleDateRange {
  const fromDate = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const toDate = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  );
  return { fromDate, toDate };
}

export function dateKey(date: Date): string {
  return formatDate(date);
}

export async function listArtistsForServices(
  params: ListArtistsForServicesParams,
): Promise<AvailableArtistForBooking[]> {
  const serviceIds = distinctServiceIds(params.serviceIds);
  if (!params.districtId || serviceIds.length === 0) {
    return [];
  }

  try {
    dbLogger.info("Listing artists for services", {
      data: {
        districtId: params.districtId,
        serviceCount: serviceIds.length,
      },
    });

    const { data, error } = await supabase.rpc(
      "list_artists_for_services",
      {
        p_district_id: params.districtId,
        p_service_ids: serviceIds,
      },
    );

    if (error) {
      dbLogger.error("Failed to list artists for services", {
        error,
      });
      throw error;
    }

    return (data ?? []) as AvailableArtistForBooking[];
  } catch (error) {
    dbLogger.error("Error in listArtistsForServices", { error });
    throw error;
  }
}

export async function getBookableDatesForArtist(
  params: BookableDatesForArtistParams,
): Promise<Date[]> {
  const serviceIds = distinctServiceIds(params.serviceIds);
  if (
    !params.artistId ||
    !params.districtId ||
    serviceIds.length === 0
  ) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc(
      "get_bookable_dates_for_artist",
      {
        p_artist_id: params.artistId,
        p_district_id: params.districtId,
        p_service_ids: serviceIds,
        p_from_date: formatDate(params.fromDate),
        p_to_date: formatDate(params.toDate),
        p_duration_minutes: params.durationMinutes,
        p_buffer_minutes: params.bufferMinutes ?? 30,
        p_exclude_booking_id: params.excludeBookingId ?? null,
      },
    );

    if (error) {
      dbLogger.error("Failed to get bookable dates for artist", {
        error,
      });
      throw error;
    }

    return parseWorkDates(data);
  } catch (error) {
    dbLogger.error("Error in getBookableDatesForArtist", {
      error,
    });
    throw error;
  }
}

export async function getBookableDatesForServices(
  params: BookableDatesParams,
): Promise<Date[]> {
  const serviceIds = distinctServiceIds(params.serviceIds);
  if (!params.districtId || serviceIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc(
      "get_bookable_dates_for_services",
      {
        p_district_id: params.districtId,
        p_service_ids: serviceIds,
        p_from_date: formatDate(params.fromDate),
        p_to_date: formatDate(params.toDate),
        p_duration_minutes: params.durationMinutes,
        p_buffer_minutes: params.bufferMinutes ?? 30,
        p_exclude_booking_id: params.excludeBookingId ?? null,
      },
    );

    if (error) {
      dbLogger.error(
        "Failed to get bookable dates for services",
        { error },
      );
      throw error;
    }

    return parseWorkDates(data);
  } catch (error) {
    dbLogger.error("Error in getBookableDatesForServices", {
      error,
    });
    throw error;
  }
}

export async function getFreeTimesForArtist(
  params: FreeTimesForArtistParams,
): Promise<string[]> {
  if (!params.artistId) return [];

  try {
    const { data, error } = await supabase.rpc(
      "get_free_times_for_artist",
      {
        p_artist_id: params.artistId,
        p_appointment_date: formatDate(params.appointmentDate),
        p_duration_minutes: params.durationMinutes,
        p_buffer_minutes: params.bufferMinutes ?? 30,
        p_exclude_booking_id: params.excludeBookingId ?? null,
      },
    );

    if (error) {
      dbLogger.error("Failed to get free times for artist", {
        error,
      });
      throw error;
    }

    return parseSlotTimes(data);
  } catch (error) {
    dbLogger.error("Error in getFreeTimesForArtist", { error });
    throw error;
  }
}

export async function getFreeTimesForServices(
  params: FreeTimesForServicesParams,
): Promise<string[]> {
  const serviceIds = distinctServiceIds(params.serviceIds);
  if (!params.districtId || serviceIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc(
      "get_free_times_for_services",
      {
        p_district_id: params.districtId,
        p_service_ids: serviceIds,
        p_appointment_date: formatDate(params.appointmentDate),
        p_duration_minutes: params.durationMinutes,
        p_buffer_minutes: params.bufferMinutes ?? 30,
        p_exclude_booking_id: params.excludeBookingId ?? null,
      },
    );

    if (error) {
      dbLogger.error("Failed to get free times for services", {
        error,
      });
      throw error;
    }

    return parseSlotTimes(data);
  } catch (error) {
    dbLogger.error("Error in getFreeTimesForServices", { error });
    throw error;
  }
}

export async function assignArtistForSlot(
  params: AssignArtistForSlotParams,
): Promise<AvailableArtistForBooking | null> {
  const serviceIds = distinctServiceIds(params.serviceIds);
  if (
    !params.districtId ||
    serviceIds.length === 0 ||
    !params.appointmentTime
  ) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc(
      "assign_artist_for_slot",
      {
        p_district_id: params.districtId,
        p_service_ids: serviceIds,
        p_appointment_date: formatDate(params.appointmentDate),
        p_appointment_time: params.appointmentTime,
        p_duration_minutes: params.durationMinutes,
        p_buffer_minutes: params.bufferMinutes ?? 30,
        p_exclude_booking_id: params.excludeBookingId ?? null,
      },
    );

    if (error) {
      dbLogger.error("Failed to assign artist for slot", {
        error,
      });
      throw error;
    }

    const rows = (data ?? []) as AvailableArtistForBooking[];
    return rows[0] ?? null;
  } catch (error) {
    dbLogger.error("Error in assignArtistForSlot", { error });
    throw error;
  }
}

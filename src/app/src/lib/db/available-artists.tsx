import { supabase } from "../../config/supabase";
import { formatDate } from "../../utils/formatDate";
import { dbLogger } from "./logger";

export type AvailableArtistForBooking = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
};

export type GetAvailableArtistsForBookingParams = {
  districtName: string;
  serviceIds: string[];
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  bufferMinutes?: number;
  excludeBookingId?: string;
};

export function formatArtistDisplayName(
  artist: Pick<
    AvailableArtistForBooking,
    "first_name" | "last_name" | "username"
  >,
): string {
  const name =
    `${artist.first_name} ${artist.last_name}`.trim();
  return name || artist.username;
}

export const getAvailableArtistsForBooking = async (
  params: GetAvailableArtistsForBookingParams,
): Promise<AvailableArtistForBooking[]> => {
  const {
    districtName,
    serviceIds,
    appointmentDate,
    appointmentTime,
    durationMinutes,
    bufferMinutes = 30,
    excludeBookingId,
  } = params;

  const distinctServiceIds = [
    ...new Set(serviceIds.filter(Boolean)),
  ];
  if (!districtName || distinctServiceIds.length === 0) {
    return [];
  }

  try {
    dbLogger.info("Fetching available artists for booking", {
      data: {
        districtName,
        serviceCount: distinctServiceIds.length,
        appointmentDate: formatDate(appointmentDate),
        appointmentTime,
      },
    });

    const { data, error } = await supabase.rpc(
      "get_available_artists_for_booking",
      {
        p_district_name: districtName,
        p_service_ids: distinctServiceIds,
        p_appointment_date: formatDate(appointmentDate),
        p_appointment_time: appointmentTime,
        p_duration_minutes: durationMinutes,
        p_buffer_minutes: bufferMinutes,
        p_exclude_booking_id: excludeBookingId ?? null,
      },
    );

    if (error) {
      dbLogger.error("Failed to fetch available artists", {
        error,
      });
      throw error;
    }

    return (data ?? []) as AvailableArtistForBooking[];
  } catch (error) {
    dbLogger.error("Error in getAvailableArtistsForBooking", {
      error,
    });
    throw error;
  }
};
import { supabase } from "../../config/supabase";
import {
  ArtistAvailabilityBundle,
  DayStatus,
  WeeklyRhythmDay,
  validateArtistAvailabilityBundle,
} from "../../schema/artist-availability.schema";
import { dbLogger } from "./logger";

/** First-of-month date string (YYYY-MM-01) for a given Date. */
export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function normalizeTimeHm(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value.slice(0, 5);
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function mapRhythmRows(
  rows: Array<{
    dow: number;
    is_working: boolean;
    start_time: string;
    end_time: string;
  }> | null | undefined,
): WeeklyRhythmDay[] {
  return (rows ?? []).map((r) => ({
    dow: r.dow,
    is_working: r.is_working,
    start_time: normalizeTimeHm(r.start_time) ?? "10:00",
    end_time: normalizeTimeHm(r.end_time) ?? "18:00",
  }));
}

function normalizeBundle(raw: unknown): ArtistAvailabilityBundle {
  const data = raw as {
    artist_id: string;
    year_month: string;
    month: {
      artist_id: string;
      year_month: string;
      status: string;
      submitted_at?: string | null;
    };
    rhythm: Array<{
      dow: number;
      is_working: boolean;
      start_time: string;
      end_time: string;
    }>;
    month_rhythm?: Array<{
      dow: number;
      is_working: boolean;
      start_time: string;
      end_time: string;
    }>;
    has_month_rhythm?: boolean;
    overrides: Array<{
      work_date: string;
      status: string;
      start_time?: string | null;
      end_time?: string | null;
    }>;
  };

  const monthRhythm = mapRhythmRows(data.month_rhythm);
  const hasMonthRhythm =
    data.has_month_rhythm ?? monthRhythm.length > 0;

  return validateArtistAvailabilityBundle({
    artist_id: data.artist_id,
    year_month: String(data.year_month).slice(0, 10),
    month: {
      artist_id: data.month.artist_id,
      year_month: String(data.month.year_month).slice(0, 10),
      status: data.month.status,
      submitted_at: data.month.submitted_at ?? null,
    },
    rhythm: mapRhythmRows(data.rhythm),
    month_rhythm: monthRhythm,
    has_month_rhythm: hasMonthRhythm,
    overrides: (data.overrides ?? []).map((o) => ({
      work_date: String(o.work_date).slice(0, 10),
      status: o.status,
      start_time: normalizeTimeHm(o.start_time ?? null),
      end_time: normalizeTimeHm(o.end_time ?? null),
    })),
  });
}

export async function getArtistAvailability(
  artistId: string,
  yearMonth: Date | string,
): Promise<ArtistAvailabilityBundle> {
  const ym =
    typeof yearMonth === "string"
      ? yearMonth.slice(0, 10)
      : toYearMonth(yearMonth);

  try {
    dbLogger.info("Fetching artist availability", {
      data: { artistId, yearMonth: ym },
    });

    const { data, error } = await supabase.rpc("get_artist_availability", {
      p_artist_id: artistId,
      p_year_month: ym,
    });

    if (error) {
      dbLogger.error("Failed to fetch artist availability", { error });
      throw error;
    }

    return normalizeBundle(data);
  } catch (error) {
    dbLogger.error("Error in getArtistAvailability", { error });
    throw error;
  }
}

export async function upsertArtistWeeklyRhythm(
  artistId: string,
  days: WeeklyRhythmDay[],
): Promise<void> {
  try {
    dbLogger.info("Upserting artist weekly rhythm (defaults)", {
      data: { artistId, dayCount: days.length },
    });

    const { error } = await supabase.rpc("upsert_artist_weekly_rhythm", {
      p_artist_id: artistId,
      p_days: days.map((d) => ({
        dow: d.dow,
        is_working: d.is_working,
        start_time: d.start_time,
        end_time: d.end_time,
      })),
    });

    if (error) {
      dbLogger.error("Failed to upsert weekly rhythm", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in upsertArtistWeeklyRhythm", { error });
    throw error;
  }
}

export async function upsertArtistMonthWeeklyRhythm(
  artistId: string,
  yearMonth: Date | string,
  days: WeeklyRhythmDay[],
): Promise<void> {
  const ym =
    typeof yearMonth === "string"
      ? yearMonth.slice(0, 10)
      : toYearMonth(yearMonth);

  try {
    dbLogger.info("Upserting artist month weekly rhythm", {
      data: { artistId, yearMonth: ym, dayCount: days.length },
    });

    const { error } = await supabase.rpc(
      "upsert_artist_month_weekly_rhythm",
      {
        p_artist_id: artistId,
        p_year_month: ym,
        p_days: days.map((d) => ({
          dow: d.dow,
          is_working: d.is_working,
          start_time: d.start_time,
          end_time: d.end_time,
        })),
      },
    );

    if (error) {
      dbLogger.error("Failed to upsert month weekly rhythm", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in upsertArtistMonthWeeklyRhythm", { error });
    throw error;
  }
}

export async function upsertArtistDayOverride(params: {
  artistId: string;
  workDate: string;
  status: DayStatus;
  startTime?: string | null;
  endTime?: string | null;
}): Promise<void> {
  const { artistId, workDate, status, startTime, endTime } = params;

  try {
    dbLogger.info("Upserting artist day override", {
      data: { artistId, workDate, status },
    });

    const { error } = await supabase.rpc("upsert_artist_day_override", {
      p_artist_id: artistId,
      p_work_date: workDate,
      p_status: status,
      p_start_time: status === "working" ? (startTime ?? null) : null,
      p_end_time: status === "working" ? (endTime ?? null) : null,
    });

    if (error) {
      dbLogger.error("Failed to upsert day override", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in upsertArtistDayOverride", { error });
    throw error;
  }
}

export async function deleteArtistDayOverride(
  artistId: string,
  workDate: string,
): Promise<void> {
  try {
    dbLogger.info("Deleting artist day override", {
      data: { artistId, workDate },
    });

    const { error } = await supabase.rpc("delete_artist_day_override", {
      p_artist_id: artistId,
      p_work_date: workDate,
    });

    if (error) {
      dbLogger.error("Failed to delete day override", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in deleteArtistDayOverride", { error });
    throw error;
  }
}

/** Clears month weekly rhythm + day overrides so the month uses global defaults. */
export async function applyRhythmToMonth(
  artistId: string,
  yearMonth: Date | string,
): Promise<void> {
  const ym =
    typeof yearMonth === "string"
      ? yearMonth.slice(0, 10)
      : toYearMonth(yearMonth);

  try {
    dbLogger.info("Resetting month to default rhythm", {
      data: { artistId, yearMonth: ym },
    });

    const { error } = await supabase.rpc("apply_rhythm_to_month", {
      p_artist_id: artistId,
      p_year_month: ym,
    });

    if (error) {
      dbLogger.error("Failed to reset month rhythm", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in applyRhythmToMonth", { error });
    throw error;
  }
}

export async function submitArtistMonth(
  artistId: string,
  yearMonth: Date | string,
): Promise<void> {
  const ym =
    typeof yearMonth === "string"
      ? yearMonth.slice(0, 10)
      : toYearMonth(yearMonth);

  try {
    dbLogger.info("Submitting artist month", {
      data: { artistId, yearMonth: ym },
    });

    const { error } = await supabase.rpc("submit_artist_month", {
      p_artist_id: artistId,
      p_year_month: ym,
    });

    if (error) {
      dbLogger.error("Failed to submit artist month", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in submitArtistMonth", { error });
    throw error;
  }
}

export async function unlockArtistMonth(
  artistId: string,
  yearMonth: Date | string,
): Promise<void> {
  const ym =
    typeof yearMonth === "string"
      ? yearMonth.slice(0, 10)
      : toYearMonth(yearMonth);

  try {
    dbLogger.info("Unlocking artist month", {
      data: { artistId, yearMonth: ym },
    });

    const { error } = await supabase.rpc("unlock_artist_month", {
      p_artist_id: artistId,
      p_year_month: ym,
    });

    if (error) {
      dbLogger.error("Failed to unlock artist month", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in unlockArtistMonth", { error });
    throw error;
  }
}
